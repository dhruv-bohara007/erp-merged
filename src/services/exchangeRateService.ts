
interface ExchangeRates {
  [key: string]: number;
}

interface ExchangeRateResponse {
  result?: string;
  base_code?: string;
  base?: string;
  rates: ExchangeRates;
  time_last_update_unix?: number;
  time_last_updated?: number;
}

class ExchangeRateService {
  private static instance: ExchangeRateService;
  private cachedRates: ExchangeRates = {};
  private lastUpdate: number = 0;
  private readonly CACHE_DURATION = 3600000; // 1 hour in milliseconds
  private readonly API_URL = 'https://api.exchangerate-api.com/v4/latest/INR';
  private readonly REQUEST_TIMEOUT = 10000; // 10 seconds timeout

  static getInstance(): ExchangeRateService {
    if (!ExchangeRateService.instance) {
      ExchangeRateService.instance = new ExchangeRateService();
    }
    return ExchangeRateService.instance;
  }

  private constructor() {
    this.loadCachedRates();
  }

  private loadCachedRates() {
    try {
      const cached = localStorage.getItem('exchangeRates');
      const lastUpdate = localStorage.getItem('exchangeRatesLastUpdate');
      
      if (cached && lastUpdate) {
        this.cachedRates = JSON.parse(cached);
        this.lastUpdate = parseInt(lastUpdate);
      }
    } catch (error) {
      console.warn('Failed to load cached exchange rates:', error);
    }
  }

  private saveCachedRates() {
    try {
      localStorage.setItem('exchangeRates', JSON.stringify(this.cachedRates));
      localStorage.setItem('exchangeRatesLastUpdate', this.lastUpdate.toString());
    } catch (error) {
      console.warn('Failed to save cached exchange rates:', error);
    }
  }

  private async fetchRates(): Promise<ExchangeRates> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

    try {
      console.log('Fetching exchange rates from API...');
      
      const response = await fetch(this.API_URL, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ExchangeRateResponse = await response.json();
      console.log('API Response received:', data);
      
      // Check if we have rates data
      if (data.rates && typeof data.rates === 'object') {
        // Convert to INR base rates (rates are already INR-based from this API)
        const inrRates: ExchangeRates = { INR: 1 };
        
        for (const [currency, rate] of Object.entries(data.rates)) {
          if (currency !== 'INR' && typeof rate === 'number' && rate > 0) {
            inrRates[currency] = rate;
          }
        }
        
        this.cachedRates = inrRates;
        this.lastUpdate = Date.now();
        this.saveCachedRates();
        
        console.log('Exchange rates fetched successfully:', Object.keys(inrRates).length, 'currencies');
        return inrRates;
      } else {
        throw new Error('Invalid API response format - no rates data');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Failed to fetch exchange rates:', error);
      
      // Return cached rates if available
      if (Object.keys(this.cachedRates).length > 0) {
        console.log('Using cached exchange rates due to API failure');
        return this.cachedRates;
      }
      
      // Fallback rates with better coverage
      console.log('Using fallback exchange rates due to API failure');
      return {
        INR: 1,
        USD: 0.012,   // 1 INR = 0.012 USD
        EUR: 0.011,   // 1 INR = 0.011 EUR
        GBP: 0.0094,  // 1 INR = 0.0094 GBP
        JPY: 1.8,     // 1 INR = 1.8 JPY
        CAD: 0.016,   // 1 INR = 0.016 CAD
        AUD: 0.018,   // 1 INR = 0.018 AUD
        CNY: 0.085,   // 1 INR = 0.085 CNY
        SGD: 0.016,   // 1 INR = 0.016 SGD
        HKD: 0.094,   // 1 INR = 0.094 HKD
        MXN: 0.21,    // 1 INR = 0.21 MXN
        BRL: 0.065,   // 1 INR = 0.065 BRL
        ZAR: 0.22,    // 1 INR = 0.22 ZAR
        AED: 0.044,   // 1 INR = 0.044 AED
        SAR: 0.045,   // 1 INR = 0.045 SAR
      };
    }
  }

  async getRates(): Promise<ExchangeRates> {
    const now = Date.now();
    
    // Use cached rates if they're still fresh
    if (this.lastUpdate && (now - this.lastUpdate) < this.CACHE_DURATION && Object.keys(this.cachedRates).length > 0) {
      console.log('Using cached exchange rates (still fresh)');
      return this.cachedRates;
    }
    
    return await this.fetchRates();
  }

  async convertToINR(amount: number, fromCurrency: string): Promise<{ amountInINR: number; rate: number }> {
    if (fromCurrency === 'INR') {
      return { amountInINR: amount, rate: 1 };
    }

    try {
      const rates = await this.getRates();
      const rate = rates[fromCurrency];
      
      if (!rate || rate <= 0) {
        console.warn(`Exchange rate not found for ${fromCurrency}, using 1:1 conversion`);
        return { amountInINR: amount, rate: 1 };
      }
      
      // Convert from foreign currency to INR
      const amountInINR = amount / rate;
      
      return { amountInINR, rate: 1/rate };
    } catch (error) {
      console.error(`Currency conversion failed for ${fromCurrency}:`, error);
      return { amountInINR: amount, rate: 1 };
    }
  }

  async convertFromINR(amountINR: number, toCurrency: string): Promise<{ convertedAmount: number; rate: number }> {
    if (toCurrency === 'INR') {
      return { convertedAmount: amountINR, rate: 1 };
    }

    try {
      const rates = await this.getRates();
      const rate = rates[toCurrency];
      
      if (!rate || rate <= 0) {
        console.warn(`Exchange rate not found for ${toCurrency}, using 1:1 conversion`);
        return { convertedAmount: amountINR, rate: 1 };
      }
      
      // Convert from INR to foreign currency
      const convertedAmount = amountINR * rate;
      
      return { convertedAmount, rate };
    } catch (error) {
      console.error(`Currency conversion failed for ${toCurrency}:`, error);
      return { convertedAmount: amountINR, rate: 1 };
    }
  }
}

export const exchangeRateService = ExchangeRateService.getInstance();

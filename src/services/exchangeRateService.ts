

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
    try {
      const response = await fetch(this.API_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ExchangeRateResponse = await response.json();
      
      // Check if we have rates data
      if (data.rates && typeof data.rates === 'object') {
        // Convert to INR base rates (rates are already INR-based from this API)
        const inrRates: ExchangeRates = { INR: 1 };
        
        for (const [currency, rate] of Object.entries(data.rates)) {
          if (currency !== 'INR' && typeof rate === 'number') {
            inrRates[currency] = rate;
          }
        }
        
        this.cachedRates = inrRates;
        this.lastUpdate = Date.now();
        this.saveCachedRates();
        
        console.log('Exchange rates fetched successfully:', Object.keys(inrRates).length, 'currencies');
        return inrRates;
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      
      // Return cached rates if available
      if (Object.keys(this.cachedRates).length > 0) {
        console.log('Using cached exchange rates');
        return this.cachedRates;
      }
      
      // Fallback rates
      console.log('Using fallback exchange rates');
      return {
        INR: 1,
        USD: 0.012,
        EUR: 0.011,
        GBP: 0.0094,
        JPY: 1.8,
        CAD: 0.016,
        AUD: 0.018,
        CNY: 0.085,
        SGD: 0.016,
      };
    }
  }

  async getRates(): Promise<ExchangeRates> {
    const now = Date.now();
    
    // Use cached rates if they're still fresh
    if (this.lastUpdate && (now - this.lastUpdate) < this.CACHE_DURATION && Object.keys(this.cachedRates).length > 0) {
      return this.cachedRates;
    }
    
    return await this.fetchRates();
  }

  async convertToINR(amount: number, fromCurrency: string): Promise<{ amountInINR: number; rate: number }> {
    if (fromCurrency === 'INR') {
      return { amountInINR: amount, rate: 1 };
    }

    const rates = await this.getRates();
    const rate = rates[fromCurrency];
    
    if (!rate) {
      console.warn(`Exchange rate not found for ${fromCurrency}, using 1:1 conversion`);
      return { amountInINR: amount, rate: 1 };
    }
    
    // Convert from foreign currency to INR
    const amountInINR = amount / rate;
    
    return { amountInINR, rate: 1/rate };
  }

  async convertFromINR(amountINR: number, toCurrency: string): Promise<{ convertedAmount: number; rate: number }> {
    if (toCurrency === 'INR') {
      return { convertedAmount: amountINR, rate: 1 };
    }

    const rates = await this.getRates();
    const rate = rates[toCurrency];
    
    if (!rate) {
      console.warn(`Exchange rate not found for ${toCurrency}, using 1:1 conversion`);
      return { convertedAmount: amountINR, rate: 1 };
    }
    
    // Convert from INR to foreign currency
    const convertedAmount = amountINR * rate;
    
    return { convertedAmount, rate };
  }
}

export const exchangeRateService = ExchangeRateService.getInstance();



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

interface FreeCurrencyResponse {
  data: ExchangeRates;
}

class ExchangeRateService {
  private static instance: ExchangeRateService;
  private cachedRates: ExchangeRates = {};
  private cachedINRRates: ExchangeRates = {};
  private lastUpdate: number = 0;
  private lastINRUpdate: number = 0;
  private readonly CACHE_DURATION = 3600000; // 1 hour in milliseconds
  private readonly PRIMARY_API_URL = 'https://api.exchangerate-api.com/v4/latest/INR';
  private readonly SECONDARY_API_URL = 'https://api.freecurrencyapi.com/v1/latest';
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
      const cachedINR = localStorage.getItem('exchangeRatesINR');
      const lastUpdate = localStorage.getItem('exchangeRatesLastUpdate');
      const lastINRUpdate = localStorage.getItem('exchangeRatesINRLastUpdate');
      
      if (cached && lastUpdate) {
        this.cachedRates = JSON.parse(cached);
        this.lastUpdate = parseInt(lastUpdate);
      }
      
      if (cachedINR && lastINRUpdate) {
        this.cachedINRRates = JSON.parse(cachedINR);
        this.lastINRUpdate = parseInt(lastINRUpdate);
      }
    } catch (error) {
      console.warn('Failed to load cached exchange rates:', error);
    }
  }

  private saveCachedRates() {
    try {
      localStorage.setItem('exchangeRates', JSON.stringify(this.cachedRates));
      localStorage.setItem('exchangeRatesINR', JSON.stringify(this.cachedINRRates));
      localStorage.setItem('exchangeRatesLastUpdate', this.lastUpdate.toString());
      localStorage.setItem('exchangeRatesINRLastUpdate', this.lastINRUpdate.toString());
    } catch (error) {
      console.warn('Failed to save cached exchange rates:', error);
    }
  }

  private async fetchINRBasedRates(): Promise<ExchangeRates> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

    try {
      console.log('Fetching INR-based exchange rates from primary API...');
      
      const response = await fetch(this.PRIMARY_API_URL, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ExchangeRateResponse = await response.json();
      
      if (data.rates && typeof data.rates === 'object') {
        const inrRates: ExchangeRates = { INR: 1 };
        
        for (const [currency, rate] of Object.entries(data.rates)) {
          if (currency !== 'INR' && typeof rate === 'number' && rate > 0) {
            inrRates[currency] = rate;
          }
        }
        
        this.cachedRates = inrRates;
        this.lastUpdate = Date.now();
        this.saveCachedRates();
        
        console.log('INR-based exchange rates fetched successfully:', Object.keys(inrRates).length, 'currencies');
        return inrRates;
      } else {
        throw new Error('Invalid API response format - no rates data');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Failed to fetch INR-based exchange rates:', error);
      
      if (Object.keys(this.cachedRates).length > 0) {
        console.log('Using cached INR-based exchange rates due to API failure');
        return this.cachedRates;
      }
      
      // Fallback rates
      return {
        INR: 1, USD: 0.012, EUR: 0.011, GBP: 0.0094, JPY: 1.8, CAD: 0.016,
        AUD: 0.018, CNY: 0.085, SGD: 0.016, HKD: 0.094, MXN: 0.21,
        BRL: 0.065, ZAR: 0.22, AED: 0.044, SAR: 0.045
      };
    }
  }

  private async fetchFromINRRates(): Promise<ExchangeRates> {
    // For FreeCurrencyAPI, we need to use INR as base and get rates to other currencies
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

    try {
      console.log('Fetching INR to other currencies rates from secondary API...');
      
      // Using FreeCurrencyAPI with INR as base
      const response = await fetch(`${this.SECONDARY_API_URL}?apikey=fca_live_your_api_key&base_currency=INR`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // If FreeCurrencyAPI fails, use primary API data inverted
        console.log('Secondary API failed, using primary API data for INR conversion');
        const primaryRates = await this.fetchINRBasedRates();
        const invertedRates: ExchangeRates = { INR: 1 };
        
        // Convert from "1 INR = X foreign currency" format
        for (const [currency, rate] of Object.entries(primaryRates)) {
          if (currency !== 'INR' && rate > 0) {
            invertedRates[currency] = rate; // Keep the same format since it's already INR-based
          }
        }
        
        this.cachedINRRates = invertedRates;
        this.lastINRUpdate = Date.now();
        this.saveCachedRates();
        return invertedRates;
      }
      
      const data: FreeCurrencyResponse = await response.json();
      
      if (data.data && typeof data.data === 'object') {
        const rates: ExchangeRates = { INR: 1, ...data.data };
        
        this.cachedINRRates = rates;
        this.lastINRUpdate = Date.now();
        this.saveCachedRates();
        
        console.log('INR conversion rates fetched successfully from secondary API');
        return rates;
      } else {
        throw new Error('Invalid secondary API response format');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Failed to fetch from secondary API:', error);
      
      // Fallback to using primary API data
      if (Object.keys(this.cachedINRRates).length > 0) {
        return this.cachedINRRates;
      }
      
      // Use primary API as fallback
      return await this.fetchINRBasedRates();
    }
  }

  async getRates(): Promise<ExchangeRates> {
    const now = Date.now();
    
    if (this.lastUpdate && (now - this.lastUpdate) < this.CACHE_DURATION && Object.keys(this.cachedRates).length > 0) {
      console.log('Using cached INR-based exchange rates (still fresh)');
      return this.cachedRates;
    }
    
    return await this.fetchINRBasedRates();
  }

  async getINRConversionRates(): Promise<ExchangeRates> {
    const now = Date.now();
    
    if (this.lastINRUpdate && (now - this.lastINRUpdate) < this.CACHE_DURATION && Object.keys(this.cachedINRRates).length > 0) {
      console.log('Using cached INR conversion rates (still fresh)');
      return this.cachedINRRates;
    }
    
    return await this.fetchFromINRRates();
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
      const rates = await this.getINRConversionRates();
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

  // New method for full conversion: Company Currency → INR → Client Currency
  async convertCompanyToClient(amount: number, companyCurrency: string, clientCurrency: string): Promise<{
    companyAmount: number;
    amountInINR: number;
    clientAmount: number;
    companyToINRRate: number;
    INRToClientRate: number;
  }> {
    console.log(`Converting ${amount} from ${companyCurrency} to ${clientCurrency} via INR`);
    
    // Step 1: Convert company currency to INR
    const { amountInINR, rate: companyToINRRate } = await this.convertToINR(amount, companyCurrency);
    
    // Step 2: Convert INR to client currency
    const { convertedAmount: clientAmount, rate: INRToClientRate } = await this.convertFromINR(amountInINR, clientCurrency);
    
    return {
      companyAmount: amount,
      amountInINR,
      clientAmount,
      companyToINRRate,
      INRToClientRate
    };
  }
}

export const exchangeRateService = ExchangeRateService.getInstance();

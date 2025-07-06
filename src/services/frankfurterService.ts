
interface FrankfurterRates {
  [key: string]: number;
}

interface FrankfurterResponse {
  amount: number;
  base: string;
  date: string;
  rates: FrankfurterRates;
}

interface CurrencyList {
  [code: string]: string;
}

interface CachedRate {
  rate: number;
  timestamp: number;
  date: string;
}

interface CachedCurrencies {
  currencies: CurrencyList;
  timestamp: number;
}

class FrankfurterService {
  private static instance: FrankfurterService;
  private readonly BASE_URL = 'https://api.frankfurter.app';
  private readonly CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours
  private readonly REQUEST_TIMEOUT = 10000; // 10 seconds

  static getInstance(): FrankfurterService {
    if (!FrankfurterService.instance) {
      FrankfurterService.instance = new FrankfurterService();
    }
    return FrankfurterService.instance;
  }

  private constructor() {}

  async getSupportedCurrencies(): Promise<CurrencyList> {
    const cacheKey = 'frankfurter_currencies';
    const cached = this.getCachedCurrencies(cacheKey);
    
    if (cached) {
      return cached.currencies;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

      const response = await fetch(`${this.BASE_URL}/currencies`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const currencies: CurrencyList = await response.json();
      
      // Cache the currencies
      const cacheData: CachedCurrencies = {
        currencies,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));

      return currencies;
    } catch (error) {
      console.error('Failed to fetch currencies from Frankfurter:', error);
      
      // Return fallback currencies
      return {
        'USD': 'US Dollar',
        'EUR': 'Euro',
        'GBP': 'British Pound',
        'JPY': 'Japanese Yen',
        'CAD': 'Canadian Dollar',
        'AUD': 'Australian Dollar',
        'CHF': 'Swiss Franc',
        'CNY': 'Chinese Yuan',
        'INR': 'Indian Rupee'
      };
    }
  }

  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<{
    rate: number;
    isLive: boolean;
    timestamp: Date;
    error?: string;
  }> {
    if (fromCurrency === toCurrency) {
      return {
        rate: 1,
        isLive: true,
        timestamp: new Date()
      };
    }

    const cacheKey = `frankfurter_${fromCurrency}_${toCurrency}`;
    const cached = this.getCachedRate(cacheKey);

    // Return cached rate if still fresh
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return {
        rate: cached.rate,
        isLive: false,
        timestamp: new Date(cached.timestamp)
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

      const response = await fetch(
        `${this.BASE_URL}/latest?from=${fromCurrency}&to=${toCurrency}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: FrankfurterResponse = await response.json();
      const rate = data.rates[toCurrency];

      if (!rate) {
        throw new Error(`Rate not found for ${toCurrency}`);
      }

      // Cache the rate
      const cacheData: CachedRate = {
        rate,
        timestamp: Date.now(),
        date: data.date
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));

      return {
        rate,
        isLive: true,
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`Failed to fetch exchange rate ${fromCurrency}→${toCurrency}:`, error);

      // Try to use cached rate even if expired
      if (cached) {
        return {
          rate: cached.rate,
          isLive: false,
          timestamp: new Date(cached.timestamp),
          error: 'Live rates unavailable. Using cached rates.'
        };
      }

      // Fallback to hardcoded rate for USD
      if (fromCurrency === 'INR' && toCurrency === 'USD') {
        return {
          rate: 0.012,
          isLive: false,
          timestamp: new Date(),
          error: 'Live rates unavailable. Using fallback rate.'
        };
      }

      // Last resort - return 1:1 rate
      return {
        rate: 1,
        isLive: false,
        timestamp: new Date(),
        error: 'Exchange rate unavailable. Displaying original values.'
      };
    }
  }

  private getCachedRate(key: string): CachedRate | null {
    try {
      const cached = localStorage.getItem(key);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  private getCachedCurrencies(key: string): CachedCurrencies | null {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      
      const data: CachedCurrencies = JSON.parse(cached);
      
      // Check if cache is still valid
      if (Date.now() - data.timestamp < this.CACHE_DURATION) {
        return data;
      }
      
      return null;
    } catch {
      return null;
    }
  }
}

export const frankfurterService = FrankfurterService.getInstance();


interface CurrencyRate {
  [key: string]: number;
}

interface CurrencyResponse {
  base: string;
  date: string;
  rates: CurrencyRate;
}

interface CurrencyList {
  [code: string]: string;
}

class FrankfurterService {
  private static instance: FrankfurterService;
  private baseUrl = 'https://api.frankfurter.app';
  private cachePrefix = 'frankfurter_';
  private cacheExpiry = 4 * 60 * 60 * 1000; // 4 hours

  static getInstance(): FrankfurterService {
    if (!FrankfurterService.instance) {
      FrankfurterService.instance = new FrankfurterService();
    }
    return FrankfurterService.instance;
  }

  private getCacheKey(from: string, to: string): string {
    return `${this.cachePrefix}${from}_${to}`;
  }

  private getCachedRate(from: string, to: string): number | null {
    try {
      const cacheKey = this.getCacheKey(from, to);
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const { rate, timestamp } = JSON.parse(cached);
      const now = Date.now();
      
      if (now - timestamp > this.cacheExpiry) {
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      return rate;
    } catch {
      return null;
    }
  }

  private setCachedRate(from: string, to: string, rate: number): void {
    try {
      const cacheKey = this.getCacheKey(from, to);
      const data = {
        rate,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch {
      // Ignore cache errors
    }
  }

  private getFallbackRate(toCurrency: string): number {
    const fallbackRates: Record<string, number> = {
      USD: 0.012,
      EUR: 0.011,
      GBP: 0.0095,
      JPY: 1.8,
      CAD: 0.016,
      AUD: 0.018,
      SGD: 0.016,
      AED: 0.044,
      SAR: 0.045,
    };
    return fallbackRates[toCurrency] || 0.012;
  }

  async getSupportedCurrencies(): Promise<CurrencyList> {
    try {
      const response = await fetch(`${this.baseUrl}/currencies`);
      if (!response.ok) throw new Error('Failed to fetch currencies');
      return await response.json();
    } catch (error) {
      console.warn('Failed to fetch currencies from Frankfurter:', error);
      // Return a basic list of supported currencies
      return {
        USD: 'US Dollar',
        EUR: 'Euro',
        GBP: 'British Pound',
        JPY: 'Japanese Yen',
        CAD: 'Canadian Dollar',
        AUD: 'Australian Dollar',
        SGD: 'Singapore Dollar',
        AED: 'UAE Dirham',
        SAR: 'Saudi Riyal',
        INR: 'Indian Rupee'
      };
    }
  }

  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<{
    rate: number;
    source: 'live' | 'cached' | 'fallback';
    timestamp?: number;
  }> {
    if (fromCurrency === toCurrency) {
      return { rate: 1, source: 'live' };
    }

    // Check cache first
    const cachedRate = this.getCachedRate(fromCurrency, toCurrency);
    if (cachedRate !== null) {
      return { rate: cachedRate, source: 'cached' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/latest?from=${fromCurrency}&to=${toCurrency}`);
      if (!response.ok) throw new Error('API request failed');
      
      const data: CurrencyResponse = await response.json();
      const rate = data.rates[toCurrency];
      
      if (rate) {
        this.setCachedRate(fromCurrency, toCurrency, rate);
        return { rate, source: 'live' };
      }
      
      throw new Error('Rate not found in response');
    } catch (error) {
      console.warn(`Failed to fetch rate from ${fromCurrency} to ${toCurrency}:`, error);
      
      // Use fallback rate
      const fallbackRate = this.getFallbackRate(toCurrency);
      return { rate: fallbackRate, source: 'fallback' };
    }
  }

  convertAmount(amount: number, rate: number): number {
    return amount * rate;
  }
}

export const frankfurterService = FrankfurterService.getInstance();

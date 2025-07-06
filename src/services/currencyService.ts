
interface CurrencyData {
  [key: string]: string;
}

interface ExchangeRateResponse {
  amount: number;
  base: string;
  date: string;
  rates: {
    [key: string]: number;
  };
}

interface CachedRate {
  rate: number;
  timestamp: number;
  currency: string;
}

class CurrencyService {
  private static instance: CurrencyService;
  private readonly CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours
  private readonly API_BASE = 'https://api.frankfurter.app';
  private readonly FALLBACK_RATES: Record<string, number> = {
    USD: 0.012,
    EUR: 0.011,
    GBP: 0.0094,
    JPY: 1.8,
    CAD: 0.016,
    AUD: 0.018,
  };

  static getInstance(): CurrencyService {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService();
    }
    return CurrencyService.instance;
  }

  async getSupportedCurrencies(): Promise<CurrencyData> {
    try {
      const response = await fetch(`${this.API_BASE}/currencies`);
      if (!response.ok) throw new Error('Failed to fetch currencies');
      
      const currencies = await response.json();
      // Add INR as base currency
      return { INR: 'Indian Rupee', ...currencies };
    } catch (error) {
      console.error('Error fetching currencies:', error);
      // Return fallback currencies
      return {
        INR: 'Indian Rupee',
        USD: 'United States Dollar',
        EUR: 'Euro',
        GBP: 'British Pound Sterling',
        JPY: 'Japanese Yen',
        CAD: 'Canadian Dollar',
        AUD: 'Australian Dollar',
      };
    }
  }

  private getCacheKey(currency: string): string {
    return `frankfurter_rate_${currency}`;
  }

  private getCachedRate(currency: string): CachedRate | null {
    try {
      const cached = localStorage.getItem(this.getCacheKey(currency));
      if (!cached) return null;
      
      const parsedCache: CachedRate = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is still valid
      if (now - parsedCache.timestamp < this.CACHE_DURATION) {
        return parsedCache;
      }
      
      // Remove expired cache
      localStorage.removeItem(this.getCacheKey(currency));
      return null;
    } catch (error) {
      console.error('Error reading cached rate:', error);
      return null;
    }
  }

  private setCachedRate(currency: string, rate: number): void {
    try {
      const cacheData: CachedRate = {
        rate,
        timestamp: Date.now(),
        currency
      };
      localStorage.setItem(this.getCacheKey(currency), JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching rate:', error);
    }
  }

  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<{
    rate: number;
    source: 'live' | 'cached' | 'fallback';
    timestamp?: Date;
  }> {
    // If same currency, return 1
    if (fromCurrency === toCurrency) {
      return { rate: 1, source: 'live' };
    }

    // Check cache first
    const cachedRate = this.getCachedRate(toCurrency);
    
    try {
      // Try to fetch live rate
      const response = await fetch(
        `${this.API_BASE}/latest?from=${fromCurrency}&to=${toCurrency}`
      );
      
      if (response.ok) {
        const data: ExchangeRateResponse = await response.json();
        const rate = data.rates[toCurrency];
        
        if (rate) {
          // Cache the new rate
          this.setCachedRate(toCurrency, rate);
          return { rate, source: 'live' };
        }
      }
      
      throw new Error('Invalid API response');
    } catch (error) {
      console.error('Error fetching live rate:', error);
      
      // Use cached rate if available
      if (cachedRate) {
        return {
          rate: cachedRate.rate,
          source: 'cached',
          timestamp: new Date(cachedRate.timestamp)
        };
      }
      
      // Use fallback rate
      const fallbackRate = this.FALLBACK_RATES[toCurrency];
      if (fallbackRate) {
        return { rate: fallbackRate, source: 'fallback' };
      }
      
      // Last resort: return 1 (show in INR)
      return { rate: 1, source: 'fallback' };
    }
  }

  convertAmount(amountINR: number, rate: number): number {
    return amountINR * rate;
  }

  formatCurrency(amount: number, currency: string): string {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      // Fallback formatting
      const symbols: Record<string, string> = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        JPY: '¥',
        CAD: 'C$',
        AUD: 'A$',
        INR: '₹',
      };
      
      const symbol = symbols[currency] || currency;
      return `${symbol}${amount.toFixed(2)}`;
    }
  }

  getCurrencyFlag(currency: string): string {
    // Map currencies to flag emojis
    const flags: Record<string, string> = {
      USD: '🇺🇸',
      EUR: '🇪🇺',
      GBP: '🇬🇧',
      JPY: '🇯🇵',
      CAD: '🇨🇦',
      AUD: '🇦🇺',
      INR: '🇮🇳',
      CHF: '🇨🇭',
      CNY: '🇨🇳',
      SGD: '🇸🇬',
      HKD: '🇭🇰',
      NZD: '🇳🇿',
      SEK: '🇸🇪',
      NOK: '🇳🇴',
      DKK: '🇩🇰',
    };
    
    return flags[currency] || '🌍';
  }
}

export const currencyService = CurrencyService.getInstance();

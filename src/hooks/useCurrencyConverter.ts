import { useState, useEffect } from 'react';
import { exchangeRateService } from '@/services/exchangeRateService';

interface ExchangeRates {
  [key: string]: number;
}

interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

export const currencyMap: Record<string, CurrencyInfo> = {
  'US': { code: 'USD', symbol: '$', name: 'US Dollar' },
  'IN': { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  'GB': { code: 'GBP', symbol: '£', name: 'British Pound' },
  'DE': { code: 'EUR', symbol: '€', name: 'Euro' },
  'FR': { code: 'EUR', symbol: '€', name: 'Euro' },
  'IT': { code: 'EUR', symbol: '€', name: 'Euro' },
  'ES': { code: 'EUR', symbol: '€', name: 'Euro' },
  'NL': { code: 'EUR', symbol: '€', name: 'Euro' },
  'CA': { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  'AU': { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  'JP': { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  'CN': { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  'SG': { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  'HK': { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  'MX': { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  'BR': { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  'ZA': { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  'AE': { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  'SA': { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
};

export const useCurrencyConverter = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convertToINR = async (amount: number, fromCountry: string): Promise<{ amountInINR: number; rate: number }> => {
    const fromCurrency = currencyMap[fromCountry]?.code || 'USD';
    
    setLoading(true);
    try {
      const result = await exchangeRateService.convertToINR(amount, fromCurrency);
      setError(null);
      return result;
    } catch (err) {
      console.error('Error converting to INR:', err);
      setError('Failed to convert currency');
      return { amountInINR: amount, rate: 1 };
    } finally {
      setLoading(false);
    }
  };

  const convertFromINR = async (amountINR: number, toCountry: string): Promise<{ convertedAmount: number; rate: number }> => {
    const toCurrency = currencyMap[toCountry]?.code || 'USD';
    
    setLoading(true);
    try {
      const result = await exchangeRateService.convertFromINR(amountINR, toCurrency);
      setError(null);
      return result;
    } catch (err) {
      console.error('Error converting from INR:', err);
      setError('Failed to convert currency');
      return { convertedAmount: amountINR, rate: 1 };
    } finally {
      setLoading(false);
    }
  };

  const convertCurrency = (amount: number, fromCountry: string, toCountry: string): number => {
    // This is a legacy method, kept for compatibility but not recommended for new code
    const fromCurrency = currencyMap[fromCountry]?.code || 'USD';
    const toCurrency = currencyMap[toCountry]?.code || 'USD';
    
    if (fromCurrency === toCurrency) return amount;
    
    // Basic fallback conversion (not real-time)
    const fallbackRates: Record<string, number> = {
      USD: 83, INR: 1, EUR: 91, GBP: 105, JPY: 0.55, CAD: 61, AUD: 55
    };
    
    const fromRate = fallbackRates[fromCurrency] || 83;
    const toRate = fallbackRates[toCurrency] || 83;
    
    const inrAmount = amount * fromRate;
    return inrAmount / toRate;
  };

  const getCurrencyInfo = (countryCode: string): CurrencyInfo => {
    return currencyMap[countryCode] || { code: 'USD', symbol: '$', name: 'US Dollar' };
  };

  const formatCurrency = (amount: number, countryCode: string): string => {
    const currencyInfo = getCurrencyInfo(countryCode);
    return `${currencyInfo.symbol}${amount.toFixed(2)}`;
  };

  return {
    convertToINR,
    convertFromINR,
    convertCurrency, // legacy method
    getCurrencyInfo,
    formatCurrency,
    loading,
    error
  };
};

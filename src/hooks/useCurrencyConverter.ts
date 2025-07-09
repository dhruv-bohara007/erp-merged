
import { useState, useEffect } from 'react';
import { exchangeRateService } from '@/services/exchangeRateService';
import { countryCurrencyMapping } from '@/data/countryCurrencyMapping';

interface ExchangeRates {
  [key: string]: number;
}

interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

// Export the country-currency mapping functions
export const getCurrencyInfo = (countryCode: string): CurrencyInfo => {
  return countryCurrencyMapping[countryCode] || { code: 'USD', symbol: '$', name: 'US Dollar' };
};

export const useCurrencyConverter = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convertToINR = async (amount: number, fromCurrency: string): Promise<{ amountInINR: number; rate: number }> => {
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

  const convertFromINR = async (amountINR: number, toCurrency: string): Promise<{ convertedAmount: number; rate: number }> => {
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
    const fromCurrency = getCurrencyInfo(fromCountry)?.code || 'USD';
    const toCurrency = getCurrencyInfo(toCountry)?.code || 'USD';
    
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

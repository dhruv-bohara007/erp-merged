
import { useState, useEffect } from 'react';

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
  const [rates, setRates] = useState<ExchangeRates>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRates = async () => {
      setLoading(true);
      try {
        // Using a free API that doesn't require keys - exchangerate-api.com
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        setRates(data.rates);
        setError(null);
      } catch (err) {
        console.error('Error fetching exchange rates:', err);
        setError('Failed to fetch exchange rates');
        // Fallback rates for basic conversion
        setRates({
          USD: 1,
          INR: 83,
          GBP: 0.79,
          EUR: 0.85,
          CAD: 1.35,
          AUD: 1.50,
          JPY: 150,
          CNY: 7.2,
          SGD: 1.35,
          HKD: 7.8,
          MXN: 17,
          BRL: 5,
          ZAR: 18,
          AED: 3.67,
          SAR: 3.75,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

  const convertCurrency = (amount: number, fromCountry: string, toCountry: string): number => {
    const fromCurrency = currencyMap[fromCountry]?.code || 'USD';
    const toCurrency = currencyMap[toCountry]?.code || 'USD';
    
    if (fromCurrency === toCurrency) return amount;
    
    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;
    
    // Convert to USD first, then to target currency
    const usdAmount = amount / fromRate;
    return usdAmount * toRate;
  };

  const getCurrencyInfo = (countryCode: string): CurrencyInfo => {
    return currencyMap[countryCode] || { code: 'USD', symbol: '$', name: 'US Dollar' };
  };

  const formatCurrency = (amount: number, countryCode: string): string => {
    const currencyInfo = getCurrencyInfo(countryCode);
    return `${currencyInfo.symbol}${amount.toFixed(2)}`;
  };

  return {
    convertCurrency,
    getCurrencyInfo,
    formatCurrency,
    loading,
    error,
    rates
  };
};

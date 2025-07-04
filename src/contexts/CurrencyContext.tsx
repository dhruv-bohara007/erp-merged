
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CurrencyRate {
  code: string;
  rate: number;
  symbol: string;
  name: string;
}

export interface CurrencyContextType {
  displayCurrency: string;
  setDisplayCurrency: (currency: string) => void;
  rates: Record<string, CurrencyRate>;
  convertAmount: (amount: number, fromCurrency?: string, toCurrency?: string) => number;
  formatCurrency: (amount: number, currency?: string) => string;
  loading: boolean;
  error: string | null;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const SUPPORTED_CURRENCIES = {
  INR: { symbol: '₹', name: 'Indian Rupee' },
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
  AUD: { symbol: 'A$', name: 'Australian Dollar' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar' },
  JPY: { symbol: '¥', name: 'Japanese Yen' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar' },
};

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [displayCurrency, setDisplayCurrency] = useState<string>('INR');
  const [rates, setRates] = useState<Record<string, CurrencyRate>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect user's currency based on location
  const detectUserCurrency = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      const countryCode = data.country_code;
      
      // Map country codes to currencies
      const currencyMap: Record<string, string> = {
        'US': 'USD',
        'GB': 'GBP',
        'EU': 'EUR',
        'AU': 'AUD',
        'CA': 'CAD',
        'JP': 'JPY',
        'SG': 'SGD',
        'IN': 'INR'
      };
      
      const detectedCurrency = currencyMap[countryCode] || 'INR';
      
      // Only set if different from INR and user hasn't manually selected
      const savedCurrency = localStorage.getItem('preferredCurrency');
      if (!savedCurrency && detectedCurrency !== 'INR') {
        setDisplayCurrency(detectedCurrency);
      } else if (savedCurrency) {
        setDisplayCurrency(savedCurrency);
      }
    } catch (err) {
      console.error('Failed to detect user currency:', err);
    }
  };

  // Fetch exchange rates
  const fetchExchangeRates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Using a free currency API - replace with your preferred service
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/INR');
      const data = await response.json();
      
      const formattedRates: Record<string, CurrencyRate> = {};
      
      Object.keys(SUPPORTED_CURRENCIES).forEach(code => {
        const rate = code === 'INR' ? 1 : data.rates[code] || 1;
        formattedRates[code] = {
          code,
          rate,
          symbol: SUPPORTED_CURRENCIES[code as keyof typeof SUPPORTED_CURRENCIES].symbol,
          name: SUPPORTED_CURRENCIES[code as keyof typeof SUPPORTED_CURRENCIES].name
        };
      });
      
      setRates(formattedRates);
    } catch (err) {
      setError('Failed to fetch exchange rates');
      console.error('Exchange rate fetch error:', err);
      
      // Fallback rates if API fails
      const fallbackRates: Record<string, CurrencyRate> = {};
      Object.keys(SUPPORTED_CURRENCIES).forEach(code => {
        fallbackRates[code] = {
          code,
          rate: 1, // Fallback to 1:1 ratio
          symbol: SUPPORTED_CURRENCIES[code as keyof typeof SUPPORTED_CURRENCIES].symbol,
          name: SUPPORTED_CURRENCIES[code as keyof typeof SUPPORTED_CURRENCIES].name
        };
      });
      setRates(fallbackRates);
    } finally {
      setLoading(false);
    }
  };

  // Convert amount between currencies
  const convertAmount = (amount: number, fromCurrency = 'INR', toCurrency?: string): number => {
    const targetCurrency = toCurrency || displayCurrency;
    
    if (fromCurrency === targetCurrency) return amount;
    
    const fromRate = rates[fromCurrency]?.rate || 1;
    const toRate = rates[targetCurrency]?.rate || 1;
    
    // Convert to INR first, then to target currency
    const inrAmount = fromCurrency === 'INR' ? amount : amount / fromRate;
    const convertedAmount = targetCurrency === 'INR' ? inrAmount : inrAmount * toRate;
    
    return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
  };

  // Format currency with proper symbol and locale
  const formatCurrency = (amount: number, currency?: string): string => {
    const targetCurrency = currency || displayCurrency;
    const currencyInfo = rates[targetCurrency];
    
    if (!currencyInfo) return `₹${amount.toLocaleString()}`;
    
    const convertedAmount = convertAmount(amount, 'INR', targetCurrency);
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: targetCurrency,
        minimumFractionDigits: targetCurrency === 'JPY' ? 0 : 2,
        maximumFractionDigits: targetCurrency === 'JPY' ? 0 : 2,
      }).format(convertedAmount);
    } catch (err) {
      // Fallback formatting
      return `${currencyInfo.symbol}${convertedAmount.toLocaleString()}`;
    }
  };

  // Handle currency change
  const handleSetDisplayCurrency = (currency: string) => {
    setDisplayCurrency(currency);
    localStorage.setItem('preferredCurrency', currency);
  };

  useEffect(() => {
    detectUserCurrency();
    fetchExchangeRates();
    
    // Refresh rates every hour
    const interval = setInterval(fetchExchangeRates, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const value: CurrencyContextType = {
    displayCurrency,
    setDisplayCurrency: handleSetDisplayCurrency,
    rates,
    convertAmount,
    formatCurrency,
    loading,
    error
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

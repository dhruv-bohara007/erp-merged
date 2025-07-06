
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { frankfurterService } from '@/services/frankfurterService';

interface CurrencyContextType {
  selectedCurrency: string;
  exchangeRate: number;
  isLoading: boolean;
  rateSource: 'live' | 'cached' | 'fallback';
  lastUpdated?: number;
  error?: string;
  setSelectedCurrency: (currency: string) => void;
  convertFromINR: (amount: number) => number;
  formatAmount: (amount: number) => string;
  getCurrencySymbol: (currency: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

interface CurrencyProviderProps {
  children: ReactNode;
}

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  SGD: 'S$',
  AED: 'د.إ',
  SAR: '﷼',
  INR: '₹',
};

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [selectedCurrency, setSelectedCurrencyState] = useState<string>('INR');
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rateSource, setRateSource] = useState<'live' | 'cached' | 'fallback'>('live');
  const [lastUpdated, setLastUpdated] = useState<number>();
  const [error, setError] = useState<string>();

  const setSelectedCurrency = async (currency: string) => {
    if (currency === selectedCurrency) return;
    
    setSelectedCurrencyState(currency);
    setIsLoading(true);
    setError(undefined);

    try {
      const result = await frankfurterService.getExchangeRate('INR', currency);
      setExchangeRate(result.rate);
      setRateSource(result.source);
      setLastUpdated(Date.now());
      
      if (result.source === 'fallback') {
        setError('Live rates unavailable. Using fallback rates.');
      }
    } catch (err) {
      setError('Failed to fetch exchange rate');
      setExchangeRate(1);
      setRateSource('fallback');
    } finally {
      setIsLoading(false);
    }
  };

  const convertFromINR = (amount: number): number => {
    return frankfurterService.convertAmount(amount, exchangeRate);
  };

  const getCurrencySymbol = (currency: string): string => {
    return currencySymbols[currency] || currency;
  };

  const formatAmount = (amount: number): string => {
    const convertedAmount = convertFromINR(amount);
    const symbol = getCurrencySymbol(selectedCurrency);
    
    if (selectedCurrency === 'JPY') {
      return `${symbol}${Math.round(convertedAmount).toLocaleString()}`;
    }
    
    return `${symbol}${convertedAmount.toFixed(2)}`;
  };

  const value: CurrencyContextType = {
    selectedCurrency,
    exchangeRate,
    isLoading,
    rateSource,
    lastUpdated,
    error,
    setSelectedCurrency,
    convertFromINR,
    formatAmount,
    getCurrencySymbol,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

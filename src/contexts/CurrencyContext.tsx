
import React, { createContext, useContext, useState, useEffect } from 'react';
import { frankfurterService } from '@/services/frankfurterService';
import { useAuth } from '@/contexts/AuthContext';

interface CurrencyContextType {
  displayCurrency: string;
  setDisplayCurrency: (currency: string) => void;
  supportedCurrencies: Record<string, string>;
  loading: boolean;
  convertFromINR: (amountINR: number, toCurrency: string) => Promise<{
    convertedAmount: number;
    rate: number;
    isLive: boolean;
    error?: string;
    timestamp: Date;
  }>;
  getCurrencySymbol: (currencyCode: string) => string;
  getCurrencyFlag: (currencyCode: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  INR: '₹',
  CAD: 'C$',
  AUD: 'A$',
  CHF: 'CHF',
  CNY: '¥',
  SGD: 'S$',
  HKD: 'HK$',
  MXN: '$',
  BRL: 'R$',
  ZAR: 'R',
  AED: 'د.إ',
  SAR: '﷼'
};

const currencyFlags: Record<string, string> = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  JPY: '🇯🇵',
  INR: '🇮🇳',
  CAD: '🇨🇦',
  AUD: '🇦🇺',
  CHF: '🇨🇭',
  CNY: '🇨🇳',
  SGD: '🇸🇬',
  HKD: '🇭🇰',
  MXN: '🇲🇽',
  BRL: '🇧🇷',
  ZAR: '🇿🇦',
  AED: '🇦🇪',
  SAR: '🇸🇦'
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [displayCurrency, setDisplayCurrencyState] = useState<string>('INR');
  const [supportedCurrencies, setSupportedCurrencies] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeCurrencies = async () => {
      try {
        const currencies = await frankfurterService.getSupportedCurrencies();
        setSupportedCurrencies(currencies);
        
        // Set default currency based on user's country or INR
        if (currentUser?.country) {
          const countryCurrencyMap: Record<string, string> = {
            'US': 'USD',
            'IN': 'INR',
            'GB': 'GBP',
            'DE': 'EUR',
            'FR': 'EUR',
            'IT': 'EUR',
            'ES': 'EUR',
            'NL': 'EUR',
            'CA': 'CAD',
            'AU': 'AUD',
            'JP': 'JPY',
            'CN': 'CNY',
            'SG': 'SGD',
            'HK': 'HKD',
            'MX': 'MXN',
            'BR': 'BRL',
            'ZA': 'ZAR',
            'AE': 'AED',
            'SA': 'SAR'
          };
          
          const userCurrency = countryCurrencyMap[currentUser.country] || 'INR';
          setDisplayCurrencyState(userCurrency);
        }
      } catch (error) {
        console.error('Failed to initialize currencies:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeCurrencies();
  }, [currentUser]);

  const setDisplayCurrency = (currency: string) => {
    setDisplayCurrencyState(currency);
  };

  const convertFromINR = async (amountINR: number, toCurrency: string) => {
    if (toCurrency === 'INR') {
      return {
        convertedAmount: amountINR,
        rate: 1,
        isLive: true,
        timestamp: new Date()
      };
    }

    const result = await frankfurterService.getExchangeRate('INR', toCurrency);
    return {
      convertedAmount: amountINR * result.rate,
      rate: result.rate,
      isLive: result.isLive,
      error: result.error,
      timestamp: result.timestamp
    };
  };

  const getCurrencySymbol = (currencyCode: string): string => {
    return currencySymbols[currencyCode] || currencyCode;
  };

  const getCurrencyFlag = (currencyCode: string): string => {
    return currencyFlags[currencyCode] || '🏳️';
  };

  const value: CurrencyContextType = {
    displayCurrency,
    setDisplayCurrency,
    supportedCurrencies,
    loading,
    convertFromINR,
    getCurrencySymbol,
    getCurrencyFlag
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

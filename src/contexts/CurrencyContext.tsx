
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { currencyService } from '@/services/currencyService';

interface CurrencyContextType {
  selectedCurrency: string;
  exchangeRate: number;
  rateSource: 'live' | 'cached' | 'fallback';
  rateTimestamp?: Date;
  loading: boolean;
  error: string | null;
  supportedCurrencies: Record<string, string>;
  setSelectedCurrency: (currency: string) => void;
  convertAmount: (amountINR: number) => number;
  formatAmount: (amountINR: number) => string;
  getCurrencyDisplay: () => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
  defaultCurrency?: string;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ 
  children, 
  defaultCurrency = 'INR' 
}) => {
  const [selectedCurrency, setSelectedCurrencyState] = useState<string>(
    localStorage.getItem('selectedCurrency') || defaultCurrency
  );
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [rateSource, setRateSource] = useState<'live' | 'cached' | 'fallback'>('live');
  const [rateTimestamp, setRateTimestamp] = useState<Date | undefined>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [supportedCurrencies, setSupportedCurrencies] = useState<Record<string, string>>({});

  // Load supported currencies on mount
  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        const currencies = await currencyService.getSupportedCurrencies();
        setSupportedCurrencies(currencies);
      } catch (err) {
        console.error('Failed to load currencies:', err);
      }
    };
    
    loadCurrencies();
  }, []);

  // Update exchange rate when currency changes
  useEffect(() => {
    const updateExchangeRate = async () => {
      if (selectedCurrency === 'INR') {
        setExchangeRate(1);
        setRateSource('live');
        setRateTimestamp(undefined);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await currencyService.getExchangeRate('INR', selectedCurrency);
        setExchangeRate(result.rate);
        setRateSource(result.source);
        setRateTimestamp(result.timestamp);
        
        if (result.source === 'cached' && result.timestamp) {
          setError(`⚠️ Live rates unavailable. Using cached rates from ${result.timestamp.toLocaleString()}.`);
        } else if (result.source === 'fallback') {
          setError('⚠️ Live rates unavailable. Using fallback rates.');
        }
      } catch (err) {
        setError('Failed to fetch exchange rate. Displaying original INR values.');
        setExchangeRate(1);
        setRateSource('fallback');
      } finally {
        setLoading(false);
      }
    };

    updateExchangeRate();
  }, [selectedCurrency]);

  const setSelectedCurrency = (currency: string) => {
    setSelectedCurrencyState(currency);
    localStorage.setItem('selectedCurrency', currency);
  };

  const convertAmount = (amountINR: number): number => {
    return currencyService.convertAmount(amountINR, exchangeRate);
  };

  const formatAmount = (amountINR: number): string => {
    const convertedAmount = convertAmount(amountINR);
    return currencyService.formatCurrency(convertedAmount, selectedCurrency);
  };

  const getCurrencyDisplay = (): string => {
    const flag = currencyService.getCurrencyFlag(selectedCurrency);
    return `${flag} ${selectedCurrency}`;
  };

  return (
    <CurrencyContext.Provider value={{
      selectedCurrency,
      exchangeRate,
      rateSource,
      rateTimestamp,
      loading,
      error,
      supportedCurrencies,
      setSelectedCurrency,
      convertAmount,
      formatAmount,
      getCurrencyDisplay,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};


import React, { createContext, useContext, useState, useEffect } from 'react';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { useCompanyData } from '@/hooks/useCompanyData';

interface CurrencyContextType {
  selectedCountry: string;
  setSelectedCountry: (country: string) => void;
  convertAmount: (amount: number) => number;
  formatAmount: (amount: number) => string;
  selectedCurrency: {
    code: string;
    symbol: string;
    name: string;
  };
  isConverting: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { companyData } = useCompanyData();
  const { convertCurrency, formatCurrency, getCurrencyInfo, loading } = useCurrencyConverter();
  
  // Initialize with company's country or US as fallback
  const [selectedCountry, setSelectedCountry] = useState<string>('');

  useEffect(() => {
    if (companyData?.country && !selectedCountry) {
      setSelectedCountry(companyData.country);
    } else if (!selectedCountry) {
      setSelectedCountry('US');
    }
  }, [companyData?.country, selectedCountry]);

  const companyCountry = companyData?.country || 'US';
  const selectedCurrency = getCurrencyInfo(selectedCountry);

  const convertAmount = (amount: number): number => {
    if (selectedCountry === companyCountry) return amount;
    return convertCurrency(amount, companyCountry, selectedCountry);
  };

  const formatAmount = (amount: number): string => {
    const convertedAmount = convertAmount(amount);
    return formatCurrency(convertedAmount, selectedCountry);
  };

  return (
    <CurrencyContext.Provider value={{
      selectedCountry,
      setSelectedCountry,
      convertAmount,
      formatAmount,
      selectedCurrency,
      isConverting: loading
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

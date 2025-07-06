
import { useState, useEffect } from 'react';
import { useCompanyData } from './useCompanyData';

export const useDisplayCountry = () => {
  const { companyData } = useCompanyData();
  const [displayCountry, setDisplayCountry] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (companyData?.country) {
      setDisplayCountry(companyData.country);
      setIsLoading(false);
    }
  }, [companyData]);

  const updateDisplayCountry = (country: string) => {
    setDisplayCountry(country);
    localStorage.setItem('displayCountry', country);
  };

  // Load from localStorage on mount if available
  useEffect(() => {
    const savedCountry = localStorage.getItem('displayCountry');
    if (savedCountry && !displayCountry) {
      setDisplayCountry(savedCountry);
    }
  }, []);

  return {
    displayCountry,
    updateDisplayCountry,
    isLoading,
    companyCountry: companyData?.country || 'US'
  };
};

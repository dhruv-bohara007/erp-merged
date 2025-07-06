
import { useState, useEffect } from 'react';
import { useCurrencyConverter } from './useCurrencyConverter';
import { useDisplayCountry } from './useDisplayCountry';
import { useTaxCalculations } from './useTaxCalculations';

interface DisplayAmount {
  original: number;
  converted: number;
  currency: string;
  symbol: string;
  rate: number;
}

export const useDisplayCurrency = () => {
  const { displayCountry, companyCountry } = useDisplayCountry();
  const { convertFromINR, getCurrencyInfo } = useCurrencyConverter();
  const { calculateTaxes: calculateOriginalTaxes } = useTaxCalculations();
  const [conversionRates, setConversionRates] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(false);

  // Update conversion rates when display country changes
  useEffect(() => {
    if (displayCountry && displayCountry !== 'IN') {
      setLoading(true);
      convertFromINR(1, displayCountry)
        .then(({ rate }) => {
          setConversionRates(prev => ({
            ...prev,
            [displayCountry]: rate
          }));
        })
        .catch(error => {
          console.error('Failed to fetch conversion rate:', error);
        })
        .finally(() => setLoading(false));
    }
  }, [displayCountry, convertFromINR]);

  const convertAmount = async (amountINR: number): Promise<DisplayAmount> => {
    const displayCurrency = getCurrencyInfo(displayCountry);
    
    if (displayCountry === 'IN' || displayCountry === companyCountry) {
      return {
        original: amountINR,
        converted: amountINR,
        currency: 'INR',
        symbol: '₹',
        rate: 1
      };
    }

    try {
      const { convertedAmount, rate } = await convertFromINR(amountINR, displayCountry);
      return {
        original: amountINR,
        converted: convertedAmount,
        currency: displayCurrency.code,
        symbol: displayCurrency.symbol,
        rate
      };
    } catch (error) {
      console.error('Currency conversion failed:', error);
      // Fallback to INR
      return {
        original: amountINR,
        converted: amountINR,
        currency: 'INR',
        symbol: '₹',
        rate: 1
      };
    }
  };

  const formatDisplayAmount = (amount: DisplayAmount): string => {
    return `${amount.symbol}${amount.converted.toFixed(2)}`;
  };

  const calculateDisplayTaxes = (subtotalINR: number, clientCountry?: string) => {
    // Use display country for tax calculations
    const taxCalc = calculateOriginalTaxes(subtotalINR, displayCountry, clientCountry || displayCountry);
    return taxCalc;
  };

  return {
    convertAmount,
    formatDisplayAmount,
    calculateDisplayTaxes,
    displayCountry,
    loading,
    isDisplayCurrency: displayCountry !== 'IN' && displayCountry !== companyCountry
  };
};

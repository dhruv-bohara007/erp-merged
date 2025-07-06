
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Globe } from 'lucide-react';
import { countries } from '@/data/countries';
import { currencyMap } from '@/hooks/useCurrencyConverter';
import { useDisplayCountry } from '@/hooks/useDisplayCountry';
import { exchangeRateService } from '@/services/exchangeRateService';

const CountryDropdown = () => {
  const { displayCountry, updateDisplayCountry, companyCountry } = useDisplayCountry();
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const handleCountryChange = async (newCountry: string) => {
    setIsConverting(true);
    setConversionError(null);
    
    try {
      // Test the conversion to ensure rates are available
      await exchangeRateService.getRates();
      updateDisplayCountry(newCountry);
    } catch (error) {
      console.error('Failed to update display country:', error);
      setConversionError('Exchange rates unavailable');
      // Still allow the change but show warning
      updateDisplayCountry(newCountry);
    } finally {
      setIsConverting(false);
    }
  };

  const selectedCountry = countries.find(c => c.value === displayCountry);
  const isUnrecognizedCountry = displayCountry && !selectedCountry;
  const currency = currencyMap[displayCountry];
  const isDefaultCountry = displayCountry === companyCountry;

  return (
    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-2">
        <Globe className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Display Currency
        </span>
      </div>
      
      <Select value={displayCountry} onValueChange={handleCountryChange} disabled={isConverting}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select country">
            <div className="flex items-center justify-between w-full">
              <span>
                {selectedCountry?.label || displayCountry}
                {currency && ` (${currency.code})`}
              </span>
              {isUnrecognizedCountry && (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-60 overflow-y-auto">
          {countries.map((country) => (
            <SelectItem key={country.value} value={country.value}>
              <div className="flex items-center justify-between w-full">
                <span>{country.label}</span>
                {currencyMap[country.value] && (
                  <span className="text-xs text-gray-500 ml-2">
                    {currencyMap[country.value].code}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status indicators */}
      <div className="mt-2 space-y-1">
        {!isDefaultCountry && currency && (
          <Badge variant="secondary" className="text-xs">
            Displayed in {currency.name}
          </Badge>
        )}
        
        {conversionError && (
          <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="h-3 w-3" />
            <span>Rates unavailable - displaying in company currency</span>
          </div>
        )}
        
        {isConverting && (
          <div className="text-xs text-blue-600 dark:text-blue-400">
            Updating rates...
          </div>
        )}
      </div>
    </div>
  );
};

export default CountryDropdown;

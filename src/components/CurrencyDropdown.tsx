
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { frankfurterService } from '@/services/frankfurterService';

interface CurrencyDropdownProps {
  className?: string;
}

const countryFlags: Record<string, string> = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  JPY: '🇯🇵',
  CAD: '🇨🇦',
  AUD: '🇦🇺',
  SGD: '🇸🇬',
  AED: '🇦🇪',
  SAR: '🇸🇦',
  INR: '🇮🇳',
};

const CurrencyDropdown: React.FC<CurrencyDropdownProps> = ({ className }) => {
  const {
    selectedCurrency,
    isLoading,
    rateSource,
    error,
    setSelectedCurrency,
    getCurrencySymbol
  } = useCurrency();
  
  const [currencies, setCurrencies] = useState<Record<string, string>>({});
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);

  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        const currencyList = await frankfurterService.getSupportedCurrencies();
        setCurrencies(currencyList);
      } catch (error) {
        console.error('Failed to load currencies:', error);
        // Use basic fallback
        setCurrencies({
          INR: 'Indian Rupee',
          USD: 'US Dollar',
          EUR: 'Euro',
          GBP: 'British Pound'
        });
      } finally {
        setLoadingCurrencies(false);
      }
    };

    loadCurrencies();
  }, []);

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
  };

  if (loadingCurrencies) {
    return (
      <div className="px-2 mb-4">
        <div className="flex items-center justify-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Loading currencies...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`px-2 mb-4 ${className}`}>
      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Display Currency
          </span>
          {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
        </div>
        
        <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
          <SelectTrigger className="w-full h-8 text-sm">
            <SelectValue>
              <div className="flex items-center gap-2">
                <span>{countryFlags[selectedCurrency] || '🌍'}</span>
                <span>{getCurrencySymbol(selectedCurrency)}</span>
                <span className="text-xs opacity-75">{selectedCurrency}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800 border shadow-lg z-50">
            {Object.entries(currencies).map(([code, name]) => (
              <SelectItem key={code} value={code} className="text-sm">
                <div className="flex items-center gap-2">
                  <span>{countryFlags[code] || '🌍'}</span>
                  <span>{getCurrencySymbol(code)}</span>
                  <span className="font-medium">{code}</span>
                  <span className="text-xs opacity-75 truncate">{name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {error && rateSource === 'fallback' && (
          <Badge variant="secondary" className="text-xs w-full justify-start">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Using cached rates
          </Badge>
        )}
        
        {selectedCurrency === 'INR' && (
          <Badge variant="default" className="text-xs w-full justify-center">
            Original INR values
          </Badge>
        )}
      </div>
    </div>
  );
};

export default CurrencyDropdown;

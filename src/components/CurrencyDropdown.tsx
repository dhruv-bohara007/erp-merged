
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

const CurrencyDropdown = () => {
  const {
    displayCurrency,
    setDisplayCurrency,
    supportedCurrencies,
    loading,
    getCurrencySymbol,
    getCurrencyFlag
  } = useCurrency();
  
  const [isConverting, setIsConverting] = useState(false);

  const handleCurrencyChange = async (newCurrency: string) => {
    setIsConverting(true);
    try {
      setDisplayCurrency(newCurrency);
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsConverting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading currencies...
      </div>
    );
  }

  const currencyEntries = Object.entries(supportedCurrencies);
  const isUnrecognizedCurrency = !supportedCurrencies[displayCurrency];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Display Currency:</span>
        {isUnrecognizedCurrency && (
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
        )}
      </div>
      
      <Select value={displayCurrency} onValueChange={handleCurrencyChange}>
        <SelectTrigger className="w-full">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span>{getCurrencyFlag(displayCurrency)}</span>
              <span>{getCurrencySymbol(displayCurrency)} {displayCurrency}</span>
              {isUnrecognizedCurrency && (
                <Badge variant="outline" className="text-xs text-yellow-600">
                  Unrecognized
                </Badge>
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-white z-50 max-h-60 overflow-y-auto">
          {currencyEntries.map(([code, name]) => (
            <SelectItem key={code} value={code}>
              <div className="flex items-center gap-2">
                <span>{getCurrencyFlag(code)}</span>
                <span>{getCurrencySymbol(code)} {code}</span>
                <span className="text-sm text-gray-500 truncate">{name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        {isConverting ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            Converting currencies...
          </>
        ) : (
          <>
            <span>{getCurrencyFlag(displayCurrency)}</span>
            <span>Displaying in {displayCurrency}</span>
          </>
        )}
      </div>
    </div>
  );
};

export default CurrencyDropdown;

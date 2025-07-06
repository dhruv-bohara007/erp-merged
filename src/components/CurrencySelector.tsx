
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { currencyService } from '@/services/currencyService';

const CurrencySelector: React.FC = () => {
  const {
    selectedCurrency,
    loading,
    error,
    supportedCurrencies,
    setSelectedCurrency,
    getCurrencyDisplay,
    rateSource
  } = useCurrency();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          Display Currency
        </label>
        {loading && (
          <div className="flex items-center gap-1 text-xs text-blue-600">
            <Loader2 className="w-3 h-3 animate-spin" />
            Converting currencies...
          </div>
        )}
      </div>

      <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
        <SelectTrigger className="w-full">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span>Displaying in {getCurrencyDisplay()}</span>
              {rateSource === 'cached' && (
                <Badge variant="outline" className="text-xs">
                  Cached
                </Badge>
              )}
              {rateSource === 'fallback' && (
                <Badge variant="secondary" className="text-xs">
                  Fallback
                </Badge>
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-60 bg-white border shadow-md z-50">
          {Object.entries(supportedCurrencies).map(([code, name]) => (
            <SelectItem key={code} value={code}>
              <div className="flex items-center gap-2">
                <span>{currencyService.getCurrencyFlag(code)}</span>
                <span className="font-medium">{code}</span>
                <span className="text-sm text-gray-500 truncate">{name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error && (
        <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
          {error}
        </div>
      )}

      {selectedCurrency === 'INR' && (
        <Badge variant="outline" className="text-xs">
          Displaying original INR values
        </Badge>
      )}
    </div>
  );
};

export default CurrencySelector;

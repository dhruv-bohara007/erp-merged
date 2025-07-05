
import { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { countries } from '@/data/countries';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';

const CurrencySelector = () => {
  const [open, setOpen] = useState(false);
  const { selectedCountry, setSelectedCountry, selectedCurrency, isConverting } = useCurrency();
  const { getCurrencyInfo } = useCurrencyConverter();

  const handleSelect = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setOpen(false);
  };

  const selectedCountryName = countries.find(country => country.value === selectedCountry)?.label || 'United States';

  return (
    <div className="p-3 border-t">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Currency View</span>
        {isConverting && (
          <Badge variant="outline" className="text-xs">
            Converting...
          </Badge>
        )}
      </div>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-left"
            size="sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Globe className="h-4 w-4 flex-shrink-0" />
              <div className="min-w-0">
                <div className="truncate text-sm">{selectedCountryName}</div>
                <div className="text-xs text-gray-500">{selectedCurrency.code} ({selectedCurrency.symbol})</div>
              </div>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search countries..." className="h-9" />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {countries.map((country) => {
                  const currencyInfo = getCurrencyInfo(country.value);
                  return (
                    <CommandItem
                      key={country.value}
                      value={country.label}
                      onSelect={() => handleSelect(country.value)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium">{country.label}</div>
                          <div className="text-xs text-gray-500">
                            {currencyInfo.name} ({currencyInfo.code})
                          </div>
                        </div>
                      </div>
                      {selectedCountry === country.value && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default CurrencySelector;

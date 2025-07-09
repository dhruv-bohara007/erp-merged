
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';
import { countries } from '@/data/countries';

interface AddressInfoProps {
  formData: {
    streetAddress: string;
    city: string;
    country: string;
  };
  onInputChange: (field: string, value: string) => void;
}

const AddressInfo: React.FC<AddressInfoProps> = ({ formData, onInputChange }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold">Business Address</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Label htmlFor="streetAddress">
            Street Address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="streetAddress"
            type="text"
            placeholder="123 Business Park"
            value={formData.streetAddress}
            onChange={(e) => onInputChange('streetAddress', e.target.value)}
            className="mt-1"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="city">
            City <span className="text-red-500">*</span>
          </Label>
          <Input
            id="city"
            type="text"
            placeholder="Mumbai"
            value={formData.city}
            onChange={(e) => onInputChange('city', e.target.value)}
            className="mt-1"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="country">
            Country <span className="text-red-500">*</span>
          </Label>
          <Select 
            value={formData.country} 
            onValueChange={(value) => onInputChange('country', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {countries.map((country) => (
                <SelectItem key={country.value} value={country.value}>
                  {country.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default AddressInfo;

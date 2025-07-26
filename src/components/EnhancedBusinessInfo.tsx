import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Building, 
  Upload,
  Save,
  Edit,
  X,
  Image,
  FileSignature,
  User,
  Phone
} from 'lucide-react';
import { CompanyData } from '@/hooks/useCompanyData';
import { useFileUpload } from '@/hooks/useFileUpload';
import { countriesWithTaxInfo } from '@/data/countriesWithTax';
import { countryPhoneCodes } from '@/data/countryPhoneCodes';
import { getCurrencyByCountry } from '@/data/countryCurrencyMapping';

interface EnhancedBusinessInfoProps {
  formData: CompanyData;
  isEditing: boolean;
  saving: boolean;
  onInputChange: (field: string, value: string) => void;
  onCountryChange: (countryValue: string) => void;
  onSave: () => void;
  onEdit: () => void;
  onCancel: () => void;
  selectedCountryInfo: any;
}

const EnhancedBusinessInfo: React.FC<EnhancedBusinessInfoProps> = ({
  formData,
  isEditing,
  saving,
  onInputChange,
  onCountryChange,
  onSave,
  onEdit,
  onCancel,
  selectedCountryInfo
}) => {
  const { uploadFile, uploading } = useFileUpload();
  const logoFileRef = useRef<HTMLInputElement>(null);
  const signatureFileRef = useRef<HTMLInputElement>(null);

  const [selectedPhoneCode, setSelectedPhoneCode] = useState('+1');

  // Extract phone number without country code
  const getPhoneWithoutCode = (fullPhone: string) => {
    const phoneCode = selectedPhoneCode;
    if (fullPhone.startsWith(phoneCode)) {
      return fullPhone.substring(phoneCode.length).trim();
    }
    return fullPhone;
  };

  // Handle phone code change
  const handlePhoneCodeChange = (code: string) => {
    setSelectedPhoneCode(code);
    const phoneWithoutCode = getPhoneWithoutCode(formData.phone || '');
    onInputChange('phone', `${code} ${phoneWithoutCode}`.trim());
  };

  // Handle phone number change
  const handlePhoneNumberChange = (value: string) => {
    onInputChange('phone', `${selectedPhoneCode} ${value}`.trim());
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const downloadURL = await uploadFile(file, 'logos');
    if (downloadURL) {
      onInputChange('logoUrl', downloadURL);
    }
  };

  const handleSignatureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const downloadURL = await uploadFile(file, 'signatures');
    if (downloadURL) {
      onInputChange('signatureUrl', downloadURL);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Business Information
          </CardTitle>
          {!isEditing ? (
            <Button onClick={onEdit} variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={onSave} size="sm" disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button onClick={onCancel} variant="outline" size="sm">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Business Owner Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-lg font-medium text-gray-900">Business Owner Details</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessOwnerName">Business Owner Name</Label>
              <Input
                id="businessOwnerName"
                value={formData.businessOwnerName || ''}
                onChange={(e) => onInputChange('businessOwnerName', e.target.value)}
                disabled={!isEditing}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessOwnerPosition">Position/Designation</Label>
              <Input
                id="businessOwnerPosition"
                value={formData.businessOwnerPosition || ''}
                onChange={(e) => onInputChange('businessOwnerPosition', e.target.value)}
                disabled={!isEditing}
                placeholder="CEO, Managing Director, etc."
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Basic Company Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Company Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={formData.companyName || ''}
                onChange={(e) => onInputChange('companyName', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => onInputChange('email', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone Number
              </Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-28 justify-between"
                      disabled={!isEditing}
                    >
                      {selectedPhoneCode}
                      <span className="ml-2 h-4 w-4 shrink-0 opacity-50">▼</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0">
                    <Command>
                      <CommandInput placeholder="Search country code..." />
                      <CommandEmpty>No country code found.</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          {Object.entries(countryPhoneCodes).map(([country, data]) => (
                            <CommandItem
                              key={country}
                              value={`${data.code} ${data.name}`}
                              onSelect={() => handlePhoneCodeChange(data.code)}
                            >
                              <span className="font-mono">{data.code}</span>
                              <span className="ml-2 text-muted-foreground">{data.name}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Input
                  id="phone"
                  value={getPhoneWithoutCode(formData.phone || '')}
                  onChange={(e) => handlePhoneNumberChange(e.target.value)}
                  disabled={!isEditing}
                  placeholder="123 456 7890"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website || ''}
                onChange={(e) => onInputChange('website', e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Address */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Address Information</h3>
          <div className="space-y-2">
            <Label htmlFor="streetAddress">Street Address</Label>
            <Textarea
              id="streetAddress"
              value={formData.streetAddress || ''}
              onChange={(e) => onInputChange('streetAddress', e.target.value)}
              rows={2}
              disabled={!isEditing}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city || ''}
                onChange={(e) => onInputChange('city', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select 
                value={formData.country || 'US'} 
                onValueChange={onCountryChange}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countriesWithTaxInfo.map((country) => (
                    <SelectItem key={country.value} value={country.value}>
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={formData.companyCurrency || 'USD'}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">
                Automatically set based on country
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Tax Information */}
        {selectedCountryInfo && formData.taxInfo && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Tax Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryTaxId">{selectedCountryInfo.primaryTaxLabel}</Label>
                <Input
                  id="primaryTaxId"
                  value={formData.taxInfo.primaryId || ''}
                  onChange={(e) => onInputChange('taxInfo.primaryId', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              {selectedCountryInfo.secondaryTaxLabel && (
                <div className="space-y-2">
                  <Label htmlFor="secondaryTaxId">{selectedCountryInfo.secondaryTaxLabel}</Label>
                  <Input
                    id="secondaryTaxId"
                    value={formData.taxInfo.secondaryId || ''}
                    onChange={(e) => onInputChange('taxInfo.secondaryId', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* Banking Information */}
        {selectedCountryInfo && formData.bankInfo && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Banking Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={formData.bankInfo.bankName || ''}
                  onChange={(e) => onInputChange('bankInfo.bankName', e.target.value)}
                  disabled={!isEditing}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={formData.bankInfo.accountNumber || ''}
                  onChange={(e) => onInputChange('bankInfo.accountNumber', e.target.value)}
                  disabled={!isEditing}
                  required
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="routingCode">{selectedCountryInfo.routingLabel}</Label>
                <Input
                  id="routingCode"
                  value={formData.bankInfo.routingCode || ''}
                  onChange={(e) => onInputChange('bankInfo.routingCode', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Company Logo and Digital Signature */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Branding & Signatures</h3>
          
          {/* Company Logo */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Company Logo URL</Label>
              <Input
                id="logoUrl"
                type="url"
                placeholder="https://example.com/logo.png"
                value={formData.logoUrl || ''}
                onChange={(e) => onInputChange('logoUrl', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            
            {isEditing && (
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">OR</div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => logoFileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Upload Logo'}
                </Button>
                <input
                  ref={logoFileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>
            )}

            {formData.logoUrl && (
              <div className="flex items-center gap-4 mt-2">
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  <img
                    src={formData.logoUrl}
                    alt="Company Logo"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <p>Logo preview</p>
                  <p className="text-xs">Max size: 5MB</p>
                </div>
              </div>
            )}
          </div>

          {/* Digital Signature */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signatureUrl">Digital Signature URL</Label>
              <Input
                id="signatureUrl"
                type="url"
                placeholder="https://example.com/signature.png"
                value={formData.signatureUrl || ''}
                onChange={(e) => onInputChange('signatureUrl', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            
            {isEditing && (
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">OR</div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => signatureFileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2"
                >
                  <FileSignature className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Upload Signature'}
                </Button>
                <input
                  ref={signatureFileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSignatureUpload}
                  className="hidden"
                />
              </div>
            )}

            {formData.signatureUrl && (
              <div className="flex items-center gap-4 mt-2">
                <div className="w-32 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  <img
                    src={formData.signatureUrl}
                    alt="Digital Signature"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <p>Signature preview</p>
                  <p className="text-xs">Max size: 5MB</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedBusinessInfo;
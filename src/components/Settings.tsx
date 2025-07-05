import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { countryTaxData } from '@/data/countryTaxData';
import { useInvoiceSettings, InvoiceSettings } from '@/hooks/useInvoiceSettings';

interface SettingsProps { }

const Settings: React.FC<SettingsProps> = () => {
  return (
    <Tabs defaultValue="invoice" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="invoice">Invoice</TabsTrigger>
        <TabsTrigger value="profile" disabled>Profile</TabsTrigger>
        <TabsTrigger value="account" disabled>Account</TabsTrigger>
      </TabsList>
      <TabsContent value="invoice">
        <InvoiceSettings />
      </TabsContent>
      <TabsContent value="profile">
        <div className="p-4">Profile settings content</div>
      </TabsContent>
      <TabsContent value="account">
        <div className="p-4">Account settings content</div>
      </TabsContent>
    </Tabs>
  );
};

const InvoiceSettings = () => {
  const { invoiceSettings, loading, saving, saveInvoiceSettings } = useInvoiceSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<InvoiceSettings | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>('');

  useEffect(() => {
    if (invoiceSettings) {
      setFormData(invoiceSettings);
      // Find the country based on the tax codes in defaultTaxes
      if (invoiceSettings.defaultTaxes.length > 0) {
        const taxCode = invoiceSettings.defaultTaxes[0].code;
        const country = countryTaxData.find(c => c.code === taxCode);
        setSelectedCountry(country?.code || 'IN');
      } else {
        setSelectedCountry('IN');
      }
    }
  }, [invoiceSettings]);

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    const country = countryTaxData.find(c => c.code === countryCode);
    if (country && formData) {
      setFormData({
        ...formData,
        defaultTaxes: country.defaultTaxes
      });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (formData) {
      setFormData({
        ...formData,
        [field]: value
      });
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (formData) {
      await saveInvoiceSettings(formData);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setFormData(invoiceSettings);
    if (invoiceSettings?.defaultTaxes.length > 0) {
      const taxCode = invoiceSettings.defaultTaxes[0].code;
      const country = countryTaxData.find(c => c.code === taxCode);
      setSelectedCountry(country?.code || 'IN');
    }
    setIsEditing(false);
  };

  if (loading) {
    return <div className="p-4">Loading invoice settings...</div>;
  }

  if (!formData) {
    return <div className="p-4">No invoice settings found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Invoice Settings</h3>
        {!isEditing ? (
          <Button onClick={handleEdit}>Edit</Button>
        ) : (
          <div className="space-x-2">
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="country">Country</Label>
          <Select 
            value={selectedCountry} 
            onValueChange={handleCountryChange}
            disabled={!isEditing}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {countryTaxData.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
          <Input
            id="invoicePrefix"
            value={formData.invoicePrefix}
            onChange={(e) => handleInputChange('invoicePrefix', e.target.value)}
            readOnly={!isEditing}
            className={!isEditing ? 'bg-gray-50' : ''}
          />
        </div>

        <div>
          <Label htmlFor="nextInvoiceNumber">Next Invoice Number</Label>
          <Input
            id="nextInvoiceNumber"
            type="number"
            value={formData.nextInvoiceNumber}
            onChange={(e) => handleInputChange('nextInvoiceNumber', parseInt(e.target.value))}
            readOnly={!isEditing}
            className={!isEditing ? 'bg-gray-50' : ''}
          />
        </div>

        <div>
          <Label htmlFor="paymentTerms">Payment Terms</Label>
          <Input
            id="paymentTerms"
            value={formData.paymentTerms}
            onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
            readOnly={!isEditing}
            className={!isEditing ? 'bg-gray-50' : ''}
          />
        </div>
      </div>

      <div>
        <Label>Default Tax Configuration</Label>
        <div className="space-y-2 mt-2">
          {formData.defaultTaxes.map((tax, index) => (
            <div key={index} className="flex items-center space-x-4 p-3 border rounded">
              <span className="font-medium w-20">{tax.name}:</span>
              <span className="w-16">{tax.rate}%</span>
              <span className="text-sm text-gray-500">({tax.code})</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="footerText">Footer Text</Label>
        <textarea
          id="footerText"
          value={formData.footerText}
          onChange={(e) => handleInputChange('footerText', e.target.value)}
          readOnly={!isEditing}
          className={`w-full p-2 border rounded ${!isEditing ? 'bg-gray-50' : ''}`}
          rows={3}
        />
      </div>
    </div>
  );
};

export default Settings;

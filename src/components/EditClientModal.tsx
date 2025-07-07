import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useClients } from '@/hooks/useFirestore';
import { useToast } from '@/hooks/use-toast';
import { countries } from '@/data/countries';
import { getCurrencyByCountry } from '@/data/countryCurrencyMapping';
import type { Client } from '@/hooks/useFirestore';

interface EditClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

// Tax ID mappings for different countries
const taxIdMappings: Record<string, string> = {
  'US': 'Federal EIN',
  'IN': 'GSTIN',
  'GB': 'VAT Registration Number',
  'DE': 'VAT ID',
  'FR': 'SIRET',
  'CA': 'Business Number',
  'AU': 'ABN',
  'JP': 'Corporate Number',
  'CN': 'USCI',
  'SG': 'UEN',
  'AE': 'TRN',
  'SA': 'CR Number',
  'BR': 'CNPJ',
  'MX': 'RFC',
};

const EditClientModal = ({ open, onOpenChange, client }: EditClientModalProps) => {
  const { updateClient } = useClients();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: '',
    taxInfo: {
      id: '',
      type: ''
    },
    status: 'active' as 'active' | 'inactive'
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        pincode: client.pincode || '',
        country: client.country || '',
        taxInfo: {
          id: client.taxInfo?.id || '',
          type: client.taxInfo?.type || ''
        },
        status: client.status || 'active'
      });
    }
  }, [client]);

  const handleCountryChange = (countryCode: string) => {
    const taxType = taxIdMappings[countryCode] || 'Tax ID';
    setFormData(prev => ({
      ...prev,
      country: countryCode,
      taxInfo: {
        ...prev.taxInfo,
        type: taxType
      }
    }));
  };

  const handleTaxIdChange = (taxId: string) => {
    setFormData(prev => ({
      ...prev,
      taxInfo: {
        ...prev.taxInfo,
        id: taxId
      }
    }));
  };

  const handleStatusChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      status: checked ? 'active' : 'inactive'
    }));
  };

  const handleSave = async () => {
    if (!client) return;
    
    setLoading(true);
    try {
      // Get currency based on selected country
      const currencyInfo = getCurrencyByCountry(formData.country);
      
      await updateClient(client.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        country: formData.country,
        clientCurrency: currencyInfo.code, // Add currency field
        taxInfo: formData.taxInfo.id ? formData.taxInfo : undefined,
        status: formData.status
      });
      
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update client",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!client) return null;

  const selectedCountry = countries.find(c => c.value === formData.country);
  const taxIdLabel = formData.taxInfo.type || 'Tax ID';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Company Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter company name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="Enter email address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="+1 XXX XXX XXXX"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select value={formData.country} onValueChange={handleCountryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {countries.map((country) => (
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
              value={getCurrencyByCountry(formData.country).code}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">
              Automatically set based on country
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxId">{taxIdLabel}</Label>
            <Input
              id="taxId"
              value={formData.taxInfo.id}
              onChange={(e) => handleTaxIdChange(e.target.value)}
              placeholder={`Enter ${taxIdLabel}`}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
              placeholder="Enter city"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => setFormData({...formData, state: e.target.value})}
              placeholder="Enter state"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pincode">PIN Code</Label>
            <Input
              id="pincode"
              value={formData.pincode}
              onChange={(e) => setFormData({...formData, pincode: e.target.value})}
              placeholder="Enter PIN code"
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="Enter complete address"
              rows={3}
            />
          </div>
          <div className="col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="status">Client Status</Label>
                <p className="text-sm text-gray-500">
                  {formData.status === 'active' ? 'Client is active and can receive invoices' : 'Client is inactive and will not appear in active lists'}
                </p>
              </div>
              <Switch
                id="status"
                checked={formData.status === 'active'}
                onCheckedChange={handleStatusChange}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditClientModal;

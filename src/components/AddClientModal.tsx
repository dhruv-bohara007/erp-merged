
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClients, Client } from '@/hooks/useFirestore';
import { useToast } from '@/hooks/use-toast';
import { countriesWithTaxId } from '@/data/countriesWithTaxId';

interface AddClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddClientModal = ({ open, onOpenChange }: AddClientModalProps) => {
  const { addClient } = useClients();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('IN');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'IN',
    taxInfo: {
      id: '',
      type: 'GSTIN'
    },
    status: 'active' as const
  });

  const selectedCountryData = countriesWithTaxId.find(c => c.code === selectedCountry);

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    const countryData = countriesWithTaxId.find(c => c.code === countryCode);
    setFormData({
      ...formData,
      country: countryCode,
      taxInfo: {
        id: '',
        type: countryData?.taxIdType || 'TAX_ID'
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create client data with country and taxInfo
      const clientData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        country: formData.country,
        taxInfo: formData.taxInfo,
        status: formData.status
      };

      await addClient(clientData);
      toast({
        title: "Success",
        description: "Client added successfully",
      });
      onOpenChange(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        country: 'IN',
        taxInfo: {
          id: '',
          type: 'GSTIN'
        },
        status: 'active'
      });
      setSelectedCountry('IN');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add client",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter company name"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="Enter email address"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+91 XXXXX XXXXX"
                required
              />
            </div>
            <div>
              <Label htmlFor="country">Country *</Label>
              <Select value={selectedCountry} onValueChange={handleCountryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countriesWithTaxId.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="taxId">{selectedCountryData?.taxIdLabel || 'Tax ID'}</Label>
            <Input
              id="taxId"
              value={formData.taxInfo.id}
              onChange={(e) => setFormData({
                ...formData, 
                taxInfo: { ...formData.taxInfo, id: e.target.value }
              })}
              placeholder={selectedCountryData?.placeholder || 'Enter Tax ID'}
            />
          </div>

          <div>
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="Enter complete address"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                placeholder="Enter city"
                required
              />
            </div>
            <div>
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({...formData, state: e.target.value})}
                placeholder="Enter state"
                required
              />
            </div>
            <div>
              <Label htmlFor="pincode">PIN Code *</Label>
              <Input
                id="pincode"
                value={formData.pincode}
                onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                placeholder="Enter PIN code"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Client'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddClientModal;

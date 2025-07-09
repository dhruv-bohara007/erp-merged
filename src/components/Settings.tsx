
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { useCompanyData } from '@/hooks/useCompanyData';
import { countries } from '@/data/countries';
import { countryCurrencyMapping, getCurrencyByCountry } from '@/data/countryCurrencyMapping';
import FileUploadButton from './FileUploadButton';

const Settings = () => {
  const { companyData, loading, saving, saveCompanyData } = useCompanyData();
  const [formData, setFormData] = useState({
    companyName: '',
    streetAddress: '',
    city: '',
    country: 'US',
    companyCurrency: 'USD',
    email: '',
    phone: '',
    website: '',
    logoUrl: '',
    signatureUrl: '',
    taxInfo: {
      primaryId: '',
      primaryType: 'Federal EIN',
      secondaryId: ''
    },
    bankInfo: {
      bankName: '',
      accountNumber: '',
      routingCode: '',
      routingType: 'ROUTING'
    }
  });

  useEffect(() => {
    if (companyData) {
      setFormData({
        companyName: companyData.companyName || '',
        streetAddress: companyData.streetAddress || '',
        city: companyData.city || '',
        country: companyData.country || 'US',
        companyCurrency: companyData.companyCurrency || 'USD',
        email: companyData.email || '',
        phone: companyData.phone || '',
        website: companyData.website || '',
        logoUrl: companyData.logoUrl || '',
        signatureUrl: companyData.signatureUrl || '',
        taxInfo: {
          primaryId: companyData.taxInfo?.primaryId || '',
          primaryType: companyData.taxInfo?.primaryType || 'Federal EIN',
          secondaryId: companyData.taxInfo?.secondaryId || ''
        },
        bankInfo: {
          bankName: companyData.bankInfo?.bankName || '',
          accountNumber: companyData.bankInfo?.accountNumber || '',
          routingCode: companyData.bankInfo?.routingCode || '',
          routingType: companyData.bankInfo?.routingType || 'ROUTING'
        }
      });
    }
  }, [companyData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyData) return;

    const updatedData = {
      ...companyData,
      ...formData,
      companyCurrency: getCurrencyByCountry(formData.country).code
    };

    await saveCompanyData(updatedData);
  };

  const handleLogoUpload = (url: string) => {
    setFormData(prev => ({ ...prev, logoUrl: url }));
  };

  const handleSignatureUpload = (url: string) => {
    setFormData(prev => ({ ...prev, signatureUrl: url }));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Company Settings</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="logoUrl">Company Logo</Label>
                <div className="flex gap-2">
                  <Input
                    id="logoUrl"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
                    placeholder="Logo URL or upload a file"
                  />
                  <FileUploadButton
                    onUploadSuccess={handleLogoUpload}
                    uploadType="logo"
                    accept="image/*"
                    disabled={saving}
                  />
                </div>
                {formData.logoUrl && (
                  <div className="mt-2">
                    <img
                      src={formData.logoUrl}
                      alt="Company Logo"
                      className="h-16 w-auto object-contain border rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="signatureUrl">Digital Signature</Label>
                <div className="flex gap-2">
                  <Input
                    id="signatureUrl"
                    value={formData.signatureUrl}
                    onChange={(e) => setFormData({...formData, signatureUrl: e.target.value})}
                    placeholder="Signature URL or upload a file"
                  />
                  <FileUploadButton
                    onUploadSuccess={handleSignatureUpload}
                    uploadType="signature"
                    accept="image/*"
                    disabled={saving}
                  />
                </div>
                {formData.signatureUrl && (
                  <div className="mt-2">
                    <img
                      src={formData.signatureUrl}
                      alt="Digital Signature"
                      className="h-16 w-auto object-contain border rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle>Address Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="streetAddress">Street Address</Label>
              <Input
                id="streetAddress"
                value={formData.streetAddress}
                onChange={(e) => setFormData({...formData, streetAddress: e.target.value})}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="country">Country</Label>
                <Select 
                  value={formData.country} 
                  onValueChange={(value) => setFormData({
                    ...formData, 
                    country: value,
                    companyCurrency: getCurrencyByCountry(value).code
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tax Information */}
        <Card>
          <CardHeader>
            <CardTitle>Tax Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primaryType">Primary Tax ID Type</Label>
                <Select 
                  value={formData.taxInfo.primaryType} 
                  onValueChange={(value) => setFormData({
                    ...formData, 
                    taxInfo: {...formData.taxInfo, primaryType: value}
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Federal EIN">Federal EIN</SelectItem>
                    <SelectItem value="SSN">SSN</SelectItem>
                    <SelectItem value="GSTIN">GSTIN</SelectItem>
                    <SelectItem value="VAT">VAT Number</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="primaryId">Primary Tax ID</Label>
                <Input
                  id="primaryId"
                  value={formData.taxInfo.primaryId}
                  onChange={(e) => setFormData({
                    ...formData, 
                    taxInfo: {...formData.taxInfo, primaryId: e.target.value}
                  })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="secondaryId">Secondary Tax ID (Optional)</Label>
              <Input
                id="secondaryId"
                value={formData.taxInfo.secondaryId}
                onChange={(e) => setFormData({
                  ...formData, 
                  taxInfo: {...formData.taxInfo, secondaryId: e.target.value}
                })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bank Information */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={formData.bankInfo.bankName}
                  onChange={(e) => setFormData({
                    ...formData, 
                    bankInfo: {...formData.bankInfo, bankName: e.target.value}
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={formData.bankInfo.accountNumber}
                  onChange={(e) => setFormData({
                    ...formData, 
                    bankInfo: {...formData.bankInfo, accountNumber: e.target.value}
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="routingCode">Routing Code</Label>
                <Input
                  id="routingCode"
                  value={formData.bankInfo.routingCode}
                  onChange={(e) => setFormData({
                    ...formData, 
                    bankInfo: {...formData.bankInfo, routingCode: e.target.value}
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="routingType">Routing Type</Label>
                <Select 
                  value={formData.bankInfo.routingType} 
                  onValueChange={(value) => setFormData({
                    ...formData, 
                    bankInfo: {...formData.bankInfo, routingType: value}
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ROUTING">Routing Number</SelectItem>
                    <SelectItem value="SWIFT">SWIFT Code</SelectItem>
                    <SelectItem value="IFSC">IFSC Code</SelectItem>
                    <SelectItem value="SORT">Sort Code</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Settings;

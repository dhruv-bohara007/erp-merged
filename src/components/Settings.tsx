
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Building, 
  IndianRupee, 
  FileText, 
  Bell, 
  Palette,
  Upload,
  Save,
  Edit,
  X
} from 'lucide-react';
import { useCompanyData, CompanyData } from '@/hooks/useCompanyData';
import { useInvoiceSettings, InvoiceSettings } from '@/hooks/useInvoiceSettings';
import { countriesWithTaxInfo, CountryTaxInfo } from '@/data/countriesWithTax';
import { countryTaxData, CountryTaxInfo as CountryTaxDataInfo } from '@/data/countryTaxData';
import { countries } from '@/data/countries';

const Settings = () => {
  const { companyData, loading, saving, saveCompanyData } = useCompanyData();
  const { invoiceSettings, loading: invoiceLoading, saving: invoiceSaving, saveInvoiceSettings } = useInvoiceSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [isInvoiceEditing, setIsInvoiceEditing] = useState(false);
  const [formData, setFormData] = useState<CompanyData | null>(null);
  const [invoiceFormData, setInvoiceFormData] = useState<InvoiceSettings | null>(null);
  const [selectedCountryInfo, setSelectedCountryInfo] = useState<CountryTaxInfo | null>(null);
  const [invoiceTaxCountry, setInvoiceTaxCountry] = useState<string>('IN');

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailReminders: true,
    smsReminders: false,
    overdueAlerts: true,
    paymentReceived: true,
    weeklyReports: true
  });

  useEffect(() => {
    if (companyData) {
      setFormData(companyData);
      const countryInfo = countriesWithTaxInfo.find(c => c.value === companyData.country);
      setSelectedCountryInfo(countryInfo || countriesWithTaxInfo[0]);
    }
  }, [companyData]);

  useEffect(() => {
    if (invoiceSettings) {
      setInvoiceFormData(invoiceSettings);
    }
  }, [invoiceSettings]);

  useEffect(() => {
    if (companyData?.country) {
      setInvoiceTaxCountry(companyData.country);
    }
  }, [companyData?.country]);

  const handleInputChange = (field: string, value: string) => {
    if (!formData) return;
    
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      
      if (parent === 'taxInfo') {
        setFormData({
          ...formData,
          taxInfo: {
            ...formData.taxInfo,
            [child]: value
          }
        });
      } else if (parent === 'bankInfo') {
        setFormData({
          ...formData,
          bankInfo: {
            ...formData.bankInfo,
            [child]: value
          }
        });
      }
    } else {
      setFormData({
        ...formData,
        [field]: value
      });
    }
  };

  const handleInvoiceInputChange = (field: string, value: string | number) => {
    if (!invoiceFormData) return;
    
    setInvoiceFormData({
      ...invoiceFormData,
      [field]: value
    });
  };

  const handleCountryChange = (countryValue: string) => {
    const countryInfo = countriesWithTaxInfo.find(c => c.value === countryValue);
    if (countryInfo && formData) {
      setSelectedCountryInfo(countryInfo);
      setFormData({
        ...formData,
        country: countryValue,
        taxInfo: {
          ...formData.taxInfo,
          primaryType: countryInfo.primaryTaxLabel
        },
        bankInfo: {
          ...formData.bankInfo,
          routingType: countryInfo.routingType
        }
      });
    }
  };

  const handleInvoiceCountryChange = (countryCode: string) => {
    setInvoiceTaxCountry(countryCode);
    const countryTaxInfo = countryTaxData.find(c => c.code === countryCode);
    if (countryTaxInfo && invoiceFormData) {
      setInvoiceFormData({
        ...invoiceFormData,
        defaultTaxes: countryTaxInfo.defaultTaxes
      });
    }
  };

  const handleTaxRateChange = (index: number, rate: number) => {
    if (!invoiceFormData) return;
    
    const updatedTaxes = [...invoiceFormData.defaultTaxes];
    updatedTaxes[index] = { ...updatedTaxes[index], rate };
    
    setInvoiceFormData({
      ...invoiceFormData,
      defaultTaxes: updatedTaxes
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (formData) {
      await saveCompanyData(formData);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setFormData(companyData);
    setIsEditing(false);
  };

  const handleInvoiceEdit = () => {
    setIsInvoiceEditing(true);
  };

  const handleInvoiceSave = async () => {
    if (invoiceFormData) {
      await saveInvoiceSettings(invoiceFormData);
      setIsInvoiceEditing(false);
    }
  };

  const handleInvoiceCancel = () => {
    setInvoiceFormData(invoiceSettings);
    setIsInvoiceEditing(false);
  };

  if (loading || invoiceLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading company profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Company Profile</h1>
          <p className="text-gray-600 mt-2">Manage your company profile and application preferences</p>
        </div>

        <Tabs defaultValue="business" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="invoice">Invoice</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          {/* Business Information */}
          <TabsContent value="business">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Business Information
                  </CardTitle>
                  {!isEditing ? (
                    <Button onClick={handleEdit} variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={handleSave} size="sm" disabled={saving}>
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                      <Button onClick={handleCancel} variant="outline" size="sm">
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {formData && (
                  <>
                    {/* Basic Company Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                          id="companyName"
                          value={formData.companyName || ''}
                          onChange={(e) => handleInputChange('companyName', e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone || ''}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={formData.website || ''}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="streetAddress">Street Address</Label>
                        <Textarea
                          id="streetAddress"
                          value={formData.streetAddress || ''}
                          onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                          rows={2}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={formData.city || ''}
                            onChange={(e) => handleInputChange('city', e.target.value)}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country">Country</Label>
                          <Select 
                            value={formData.country || 'US'} 
                            onValueChange={handleCountryChange}
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
                      </div>
                    </div>

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
                              onChange={(e) => handleInputChange('taxInfo.primaryId', e.target.value)}
                              disabled={!isEditing}
                            />
                          </div>
                          {selectedCountryInfo.secondaryTaxLabel && (
                            <div className="space-y-2">
                              <Label htmlFor="secondaryTaxId">{selectedCountryInfo.secondaryTaxLabel}</Label>
                              <Input
                                id="secondaryTaxId"
                                value={formData.taxInfo.secondaryId || ''}
                                onChange={(e) => handleInputChange('taxInfo.secondaryId', e.target.value)}
                                disabled={!isEditing}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedCountryInfo && formData.bankInfo && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">Banking Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="bankName">Bank Name</Label>
                            <Input
                              id="bankName"
                              value={formData.bankInfo.bankName || ''}
                              onChange={(e) => handleInputChange('bankInfo.bankName', e.target.value)}
                              disabled={!isEditing}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="accountNumber">Account Number</Label>
                            <Input
                              id="accountNumber"
                              value={formData.bankInfo.accountNumber || ''}
                              onChange={(e) => handleInputChange('bankInfo.accountNumber', e.target.value)}
                              disabled={!isEditing}
                              required
                            />
                          </div>
                          <div className="space-y-2 col-span-2">
                            <Label htmlFor="routingCode">{selectedCountryInfo.routingLabel}</Label>
                            <Input
                              id="routingCode"
                              value={formData.bankInfo.routingCode || ''}
                              onChange={(e) => handleInputChange('bankInfo.routingCode', e.target.value)}
                              disabled={!isEditing}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Company Logo */}
                    <div className="space-y-2">
                      <Label>Company Logo</Label>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Building className="w-8 h-8 text-gray-400" />
                        </div>
                        <Button variant="outline" disabled={!isEditing}>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Logo
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoice Settings */}
          <TabsContent value="invoice">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Invoice Settings
                  </CardTitle>
                  {!isInvoiceEditing ? (
                    <Button onClick={handleInvoiceEdit} variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={handleInvoiceSave} size="sm" disabled={invoiceSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        {invoiceSaving ? 'Saving...' : 'Save'}
                      </Button>
                      <Button onClick={handleInvoiceCancel} variant="outline" size="sm">
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {invoiceFormData && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                        <Input
                          id="invoicePrefix"
                          value={invoiceFormData.invoicePrefix}
                          onChange={(e) => handleInvoiceInputChange('invoicePrefix', e.target.value)}
                          disabled={!isInvoiceEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nextInvoiceNumber">Next Invoice Number</Label>
                        <Input
                          id="nextInvoiceNumber"
                          type="number"
                          value={invoiceFormData.nextInvoiceNumber}
                          onChange={(e) => handleInvoiceInputChange('nextInvoiceNumber', Number(e.target.value))}
                          disabled={!isInvoiceEditing}
                        />
                      </div>
                    </div>

                    {/* Country Selection for Tax Settings */}
                    <div className="space-y-2">
                      <Label htmlFor="taxCountry">Tax Configuration Country</Label>
                      <Select 
                        value={invoiceTaxCountry} 
                        onValueChange={handleInvoiceCountryChange}
                        disabled={!isInvoiceEditing}
                      >
                        <SelectTrigger>
                          <SelectValue />
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

                    {/* Dynamic Tax Fields */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Default Tax Rates</h3>
                      <div className="space-y-3">
                        {invoiceFormData.defaultTaxes.map((tax, index) => (
                          <div key={index} className="grid grid-cols-2 gap-4 items-center">
                            <div className="space-y-2">
                              <Label>{tax.name}</Label>
                              <Input
                                value={tax.name}
                                disabled
                                className="bg-gray-50"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Rate (%)</Label>
                              <Input
                                type="number"
                                value={tax.rate}
                                onChange={(e) => handleTaxRateChange(index, Number(e.target.value))}
                                disabled={!isInvoiceEditing}
                                step="0.01"
                                min="0"
                                max="100"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="paymentTerms">Default Payment Terms</Label>
                      <Select 
                        value={invoiceFormData.paymentTerms} 
                        onValueChange={(value) => handleInvoiceInputChange('paymentTerms', value)}
                        disabled={!isInvoiceEditing}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Net 15">Net 15</SelectItem>
                          <SelectItem value="Net 30">Net 30</SelectItem>
                          <SelectItem value="Net 45">Net 45</SelectItem>
                          <SelectItem value="Net 60">Net 60</SelectItem>
                          <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="footerText">Invoice Footer Text</Label>
                      <Textarea
                        id="footerText"
                        value={invoiceFormData.footerText}
                        onChange={(e) => handleInvoiceInputChange('footerText', e.target.value)}
                        rows={3}
                        disabled={!isInvoiceEditing}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailReminders">Email Reminders</Label>
                      <p className="text-sm text-gray-500">Send email reminders for due invoices</p>
                    </div>
                    <Switch
                      id="emailReminders"
                      checked={notifications.emailReminders}
                      onCheckedChange={(checked) => setNotifications({...notifications, emailReminders: checked})}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="smsReminders">SMS Reminders</Label>
                      <p className="text-sm text-gray-500">Send SMS reminders for due invoices</p>
                    </div>
                    <Switch
                      id="smsReminders"
                      checked={notifications.smsReminders}
                      onCheckedChange={(checked) => setNotifications({...notifications, smsReminders: checked})}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="overdueAlerts">Overdue Alerts</Label>
                      <p className="text-sm text-gray-500">Get notified when invoices become overdue</p>
                    </div>
                    <Switch
                      id="overdueAlerts"
                      checked={notifications.overdueAlerts}
                      onCheckedChange={(checked) => setNotifications({...notifications, overdueAlerts: checked})}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="paymentReceived">Payment Received</Label>
                      <p className="text-sm text-gray-500">Get notified when payments are received</p>
                    </div>
                    <Switch
                      id="paymentReceived"
                      checked={notifications.paymentReceived}
                      onCheckedChange={(checked) => setNotifications({...notifications, paymentReceived: checked})}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="weeklyReports">Weekly Reports</Label>
                      <p className="text-sm text-gray-500">Receive weekly summary reports</p>
                    </div>
                    <Switch
                      id="weeklyReports"
                      checked={notifications.weeklyReports}
                      onCheckedChange={(checked) => setNotifications({...notifications, weeklyReports: checked})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Appearance & Branding
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Invoice Template</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
                        <div className="text-sm font-medium">Modern</div>
                        <div className="text-xs text-gray-500">Clean and professional</div>
                      </div>
                      <div className="border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-gray-300">
                        <div className="text-sm font-medium">Classic</div>
                        <div className="text-xs text-gray-500">Traditional layout</div>
                      </div>
                      <div className="border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-gray-300">
                        <div className="text-sm font-medium">Minimal</div>
                        <div className="text-xs text-gray-500">Simple and clean</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded bg-blue-500 border-2 border-blue-600 cursor-pointer"></div>
                      <div className="w-8 h-8 rounded bg-green-500 border-2 border-transparent cursor-pointer"></div>
                      <div className="w-8 h-8 rounded bg-purple-500 border-2 border-transparent cursor-pointer"></div>
                      <div className="w-8 h-8 rounded bg-red-500 border-2 border-transparent cursor-pointer"></div>
                      <div className="w-8 h-8 rounded bg-orange-500 border-2 border-transparent cursor-pointer"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="w-5 h-5" />
                  Payment Integrations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <IndianRupee className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">Razorpay</div>
                        <div className="text-sm text-gray-500">Accept online payments in India</div>
                      </div>
                    </div>
                    <Button variant="outline">Connect</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <IndianRupee className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">PayU</div>
                        <div className="text-sm text-gray-500">Indian payment gateway</div>
                      </div>
                    </div>
                    <Button variant="outline">Connect</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <IndianRupee className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">Paytm</div>
                        <div className="text-sm text-gray-500">Paytm payment gateway</div>
                      </div>
                    </div>
                    <Button variant="outline">Connect</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;

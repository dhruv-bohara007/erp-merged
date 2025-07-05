
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Building2, MapPin, Banknote } from 'lucide-react';

const CompanySignupForm = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    phone: '',
    email: '',
    streetAddress: '',
    city: '',
    country: '',
    currency: '',
    defaultCGST: '',
    defaultSGST: '',
    defaultIGST: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const countries = [
    { value: 'IN', label: 'India' },
    { value: 'US', label: 'United States' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'CA', label: 'Canada' },
    { value: 'AU', label: 'Australia' },
    { value: 'SG', label: 'Singapore' },
    { value: 'AE', label: 'United Arab Emirates' }
  ];

  const currencies = [
    { value: 'INR', label: 'INR (₹)' },
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'CAD', label: 'CAD (C$)' },
    { value: 'AUD', label: 'AUD (A$)' },
    { value: 'SGD', label: 'SGD (S$)' },
    { value: 'AED', label: 'AED (د.إ)' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = [
      'companyName', 'phone', 'email', 'streetAddress', 
      'city', 'country', 'currency', 'defaultCGST', 'defaultSGST', 'defaultIGST'
    ];
    
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Here you would typically save the company data to your backend/Firebase
      console.log('Company data:', formData);
      
      toast({
        title: 'Company Setup Complete!',
        description: 'Your company information has been saved successfully.',
      });
      
      // Redirect to dashboard or next step
      // navigate('/admin-dashboard');
      
    } catch (error) {
      toast({
        title: 'Setup Failed',
        description: 'Failed to save company information. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Complete Your Company Setup</CardTitle>
          <CardDescription>
            Enter your business details to start generating invoices
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Company Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold">Company Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="companyName">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="TechSolutions Pvt Ltd"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="info@techsolutions.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
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
                    onChange={(e) => handleInputChange('streetAddress', e.target.value)}
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
                    onChange={(e) => handleInputChange('city', e.target.value)}
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
                    onValueChange={(value) => handleInputChange('country', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select country" />
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
            </div>

            {/* Currency & Tax Settings */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Banknote className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold">Currency & Tax Settings</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="currency">
                    Default Currency <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.currency} 
                    onValueChange={(value) => handleInputChange('currency', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="defaultCGST">
                    Default CGST (%) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="defaultCGST"
                    type="number"
                    placeholder="9"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.defaultCGST}
                    onChange={(e) => handleInputChange('defaultCGST', e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="defaultSGST">
                    Default SGST (%) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="defaultSGST"
                    type="number"
                    placeholder="9"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.defaultSGST}
                    onChange={(e) => handleInputChange('defaultSGST', e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="defaultIGST">
                    Default IGST (%) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="defaultIGST"
                    type="number"
                    placeholder="18"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.defaultIGST}
                    onChange={(e) => handleInputChange('defaultIGST', e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Setting up...' : 'Save & Proceed'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanySignupForm;

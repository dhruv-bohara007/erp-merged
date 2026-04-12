
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import { useCompanySignup } from '@/hooks/useCompanySignup';
import CompanyInfo from '@/components/CompanyInfo';
import AddressInfo from '@/components/AddressInfo';

const CompanySignupForm = () => {
  const { formData, loading, handleInputChange, handleSubmit } = useCompanySignup();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Complete Your Company Setup</CardTitle>
          <CardDescription>
            Enter your business details to start generating invoices. Currency and tax settings can be configured later in Settings.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <CompanyInfo formData={formData} onInputChange={handleInputChange} />
            <AddressInfo formData={formData} onInputChange={handleInputChange} />

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Currency settings and tax rates (CGST, SGST, IGST) can be configured later in the Settings page after completing this initial setup.
              </p>
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

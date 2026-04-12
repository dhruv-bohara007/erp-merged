
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2 } from 'lucide-react';

interface CompanyInfoProps {
  formData: {
    companyName: string;
    phone: string;
    email: string;
  };
  onInputChange: (field: string, value: string) => void;
}

const CompanyInfo: React.FC<CompanyInfoProps> = ({ formData, onInputChange }) => {
  return (
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
            onChange={(e) => onInputChange('companyName', e.target.value)}
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
            onChange={(e) => onInputChange('phone', e.target.value)}
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
            onChange={(e) => onInputChange('email', e.target.value)}
            className="mt-1"
            required
          />
        </div>
      </div>
    </div>
  );
};

export default CompanyInfo;

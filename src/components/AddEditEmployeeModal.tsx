import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, Timestamp, getDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { Employee } from '@/types/firestore';
import { countries } from '@/data/countries';
import { countryPhoneCodes } from '@/data/countryPhoneCodes';
import { Mail } from 'lucide-react';

interface AddEditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee | null;
  onEmployeeAdded: () => void;
}

const AddEditEmployeeModal = ({ isOpen, onClose, employee, onEmployeeAdded }: AddEditEmployeeModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    country: '',
    phoneCode: '',
    phoneNumber: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        country: employee.country || '',
        phoneCode: employee.phoneCode || '',
        phoneNumber: employee.phoneNumber || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        country: '',
        phoneCode: '',
        phoneNumber: ''
      });
    }
  }, [employee, isOpen]);


  const handleCountryChange = (countryCode: string) => {
    const phoneCode = countryPhoneCodes[countryCode]?.code || '';
    setFormData(prev => ({
      ...prev,
      country: countryCode,
      phoneCode: phoneCode
    }));
  };

  const sendRegistrationInvite = async (employeeData: any, companyName: string) => {
    try {
      setIsSendingEmail(true);

      const payload = {
        employeeName: employeeData.name,
        employeeEmail: employeeData.email,
        companyName: companyName,
        registrationUrl: `${window.location.origin}/register?email=${encodeURIComponent(employeeData.email)}&type=employee`
      };

      const response = await fetch('http://localhost:3001/api/send-registration-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Registration invitation sent successfully',
        });
      } else {
        throw new Error(result.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending registration invite:', error);
      toast({
        title: 'Email Error',
        description: `Failed to send registration invite: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields (Name, Email).',
        variant: 'destructive',
      });
      return;
    }

    if (formData.country && !formData.phoneNumber) {
      toast({
        title: 'Error',
        description: 'Phone number is required when a country is selected.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (!currentUser?.companyId) {
        toast({
          title: 'Error',
          description: 'Company information not found. Cannot save employee.',
          variant: 'destructive',
        });
        return;
      }

      const employeeData = {
        companyId: currentUser.companyId,
        name: formData.name,
        email: formData.email,
        country: formData.country,
        phoneCode: formData.phoneCode,
        phoneNumber: formData.phoneNumber,
        status: employee ? employee.status : 'invited',
        role: 'employee',
        updatedAt: Timestamp.now(),
      };

      if (employee) {
        await updateDoc(doc(db, 'employees', employee.id), employeeData);
        toast({
          title: 'Success',
          description: 'Employee updated successfully.',
        });
      } else {
        await addDoc(collection(db, 'employees'), {
          ...employeeData,
          createdAt: Timestamp.now(),
        });

        // Send registration invitation for new employees
        try {
          let companyName = 'Your Company';
          if (currentUser?.companyId) {
            const companyDoc = await getDoc(doc(db, 'companies', currentUser.companyId));
            if (companyDoc.exists()) {
              const data = companyDoc.data();
              if (data && typeof data.name === 'string' && data.name.trim() !== '') {
                companyName = data.name;
              }
            }
          }
          await sendRegistrationInvite(employeeData, companyName);
        } catch (emailError) {
          console.error('Email sending failed during employee creation:', emailError);
          toast({
            title: 'Email Send Warning',
            description: 'Employee added, but failed to send registration invite. Please try sending manually.',
            variant: 'destructive',
          });
        }

        toast({
          title: 'Success',
          description: 'Employee added successfully.',
        });
      }

      onEmployeeAdded();
      onClose();
    } catch (error) {
      console.error('Frontend: Error saving employee:', error);
      toast({
        title: 'Error',
        description: `Failed to ${employee ? 'update' : 'add'} employee.`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Employee Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter employee name"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter employee email"
              required
            />
          </div>


          <div>
            <Label htmlFor="country">Country</Label>
            <Select value={formData.country} onValueChange={handleCountryChange}>
              <SelectTrigger>
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

          {formData.country && (
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <div className="flex space-x-2">
                <Input
                  value={formData.phoneCode}
                  readOnly
                  className="w-20 bg-gray-100"
                />
                <Input
                  id="phone"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="Enter phone number"
                  required={!!formData.country}
                  className="flex-1"
                />
              </div>
            </div>
          )}

          <div className="flex space-x-2 pt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              <Mail className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Sending...' : employee ? 'Update Employee' : 'Send Registration Invite'}
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onClose}
          >
            Cancel
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditEmployeeModal;

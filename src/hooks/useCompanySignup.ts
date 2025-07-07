
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CompanyFormData {
  companyName: string;
  phone: string;
  email: string;
  streetAddress: string;
  city: string;
  country: string;
}

export const useCompanySignup = () => {
  const [formData, setFormData] = useState<CompanyFormData>({
    companyName: '',
    phone: '',
    email: '',
    streetAddress: '',
    city: '',
    country: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { currentUser, refreshUser } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to complete company setup',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate required fields
    const requiredFields = ['companyName', 'phone', 'email', 'streetAddress', 'city', 'country'];
    
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
      // Create company document with user ID as the document ID
      const companyData = {
        ...formData,
        adminUserId: currentUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      };

      console.log('Creating company with data:', companyData);
      console.log('User ID:', currentUser.uid);
      console.log('User role:', currentUser.role);

      // Save company data to Firestore
      await setDoc(doc(db, 'companies', currentUser.uid), companyData);
      
      // Update user document to include company association
      await updateDoc(doc(db, 'users', currentUser.uid), {
        companyId: currentUser.uid,
        hasCompletedSetup: true,
        updatedAt: new Date().toISOString()
      });
      
      // Refresh user data to get the updated hasCompletedSetup status
      await refreshUser();
      
      toast({
        title: 'Company Setup Complete!',
        description: 'Your company information has been saved successfully.',
      });
      
      // Redirect to admin dashboard
      navigate('/admin-dashboard');
      
    } catch (error) {
      console.error('Company setup error:', error);
      toast({
        title: 'Setup Failed',
        description: 'Failed to save company information. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    loading,
    handleInputChange,
    handleSubmit
  };
};

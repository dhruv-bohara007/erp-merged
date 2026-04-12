
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface CompanyData {
  adminUserId: string;
  companyName: string;
  streetAddress: string;
  city: string;
  country: string;
  companyCurrency: string; // Added currency field
  email: string;
  phone: string;
  website?: string;
  logoUrl?: string; // New field for logo URL
  signatureUrl?: string; // New field for digital signature URL
  businessOwnerName?: string; // New field for business owner name
  businessOwnerPosition?: string; // New field for business owner position
  createdAt: string;
  updatedAt: string;
  taxInfo: {
    primaryId: string;
    primaryType: string;
    secondaryId?: string;
  };
  bankInfo: {
    bankName: string;
    accountNumber: string;
    routingCode: string;
    routingType: string;
  };
}

export const useCompanyData = () => {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const fetchCompanyData = async () => {
    if (!currentUser?.uid) return;
    
    try {
      const docRef = doc(db, 'companies', currentUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as CompanyData;
        // Ensure all fields are properly initialized
        const normalizedData: CompanyData = {
          ...data,
          companyCurrency: data.companyCurrency || 'USD', // Default to USD if not set
          taxInfo: data.taxInfo || {
            primaryId: '',
            primaryType: 'Federal EIN',
            secondaryId: ''
          },
          bankInfo: data.bankInfo || {
            bankName: '',
            accountNumber: '',
            routingCode: '',
            routingType: 'ROUTING'
          }
        };
        setCompanyData(normalizedData);
      } else {
        // Initialize with default data
        const defaultData: CompanyData = {
          adminUserId: currentUser.uid,
          companyName: '',
          streetAddress: '',
          city: '',
          country: 'US',
          companyCurrency: 'USD', // Default currency
          email: currentUser.email || '',
          phone: '',
          website: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
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
        };
        setCompanyData(defaultData);
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load company data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveCompanyData = async (data: CompanyData) => {
    if (!currentUser?.uid) return;
    
    setSaving(true);
    try {
      const docRef = doc(db, 'companies', currentUser.uid);
      const updatedData = {
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(docRef, updatedData, { merge: true });
      setCompanyData(updatedData);
      
      toast({
        title: 'Success',
        description: 'Company profile updated successfully'
      });
    } catch (error) {
      console.error('Error saving company data:', error);
      toast({
        title: 'Error',
        description: 'Failed to save company data',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, [currentUser?.uid]);

  return {
    companyData,
    loading,
    saving,
    saveCompanyData,
    refetchData: fetchCompanyData
  };
};

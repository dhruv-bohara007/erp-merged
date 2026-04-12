
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface InvoiceSettings {
  invoicePrefix: string;
  nextInvoiceNumber: number;
  defaultTaxes: Array<{
    name: string;
    rate: number;
    code: string;
  }>;
  paymentTerms: string;
  footerText: string;
}

export const useInvoiceSettings = () => {
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const fetchInvoiceSettings = async () => {
    if (!currentUser?.uid) return;
    
    try {
      const docRef = doc(db, 'companies', currentUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const settings = data.invoiceSettings || {
          invoicePrefix: 'INV',
          nextInvoiceNumber: 1,
          defaultTaxes: [
            { name: 'CGST', rate: 9, code: 'IN' },
            { name: 'SGST', rate: 9, code: 'IN' },
            { name: 'IGST', rate: 18, code: 'IN' }
          ],
          paymentTerms: 'Net 30',
          footerText: 'Thank you for your business! Please pay within the due date.'
        };
        setInvoiceSettings(settings);
      } else {
        // Initialize with default settings
        const defaultSettings: InvoiceSettings = {
          invoicePrefix: 'INV',
          nextInvoiceNumber: 1,
          defaultTaxes: [
            { name: 'CGST', rate: 9, code: 'IN' },
            { name: 'SGST', rate: 9, code: 'IN' },
            { name: 'IGST', rate: 18, code: 'IN' }
          ],
          paymentTerms: 'Net 30',
          footerText: 'Thank you for your business! Please pay within the due date.'
        };
        setInvoiceSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error fetching invoice settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invoice settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveInvoiceSettings = async (settings: InvoiceSettings) => {
    if (!currentUser?.uid) return;
    
    setSaving(true);
    try {
      const docRef = doc(db, 'companies', currentUser.uid);
      await updateDoc(docRef, {
        invoiceSettings: settings,
        updatedAt: new Date().toISOString()
      });
      
      setInvoiceSettings(settings);
      
      toast({
        title: 'Success',
        description: 'Invoice settings updated successfully'
      });
    } catch (error) {
      console.error('Error saving invoice settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save invoice settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchInvoiceSettings();
  }, [currentUser?.uid]);

  return {
    invoiceSettings,
    loading,
    saving,
    saveInvoiceSettings,
    refetchSettings: fetchInvoiceSettings
  };
};

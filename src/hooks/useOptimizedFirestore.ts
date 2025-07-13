
import { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp,
  getDoc,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

// Cache for company and client data to avoid repeated fetches
const companyCache = new Map();
const clientCache = new Map();

export const useOptimizedInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const lastFetchTime = useRef(0);

  useEffect(() => {
    if (!currentUser?.companyId) {
      setInvoices([]);
      setLoading(false);
      return;
    }

    // Throttle listener setup to prevent excessive re-subscriptions
    const now = Date.now();
    if (now - lastFetchTime.current < 1000) {
      return;
    }
    lastFetchTime.current = now;

    console.log('Setting up optimized invoices listener for company:', currentUser.companyId);
    
    // Use limit to reduce initial load
    const q = query(
      collection(db, 'invoices'), 
      where('companyId', '==', currentUser.companyId),
      orderBy('createdAt', 'desc'),
      limit(50) // Limit initial load to 50 most recent invoices
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('Optimized invoices snapshot received:', snapshot.docs.length, 'documents');
        
        // Only process if there are actual changes
        if (!snapshot.docChanges().length && invoices.length > 0) {
          console.log('No changes detected, skipping update');
          return;
        }

        const invoiceData = snapshot.docs.map(doc => {
          const data = doc.data();
          
          return {
            id: doc.id,
            ...data,
            // Handle currency fields with fallbacks
            totalAmountINR: data.totalAmountINR || data.totalAmount || 0,
            companyCurrency: data.companyCurrency || 'INR',
            companyAmount: data.companyAmount || data.totalAmount || 0,
            clientCurrency: data.clientCurrency || 'INR',
            clientAmount: data.clientAmount || data.totalAmount || 0,
            amountPaidByClient: data.amountPaidByClient || 0,
            // Handle country fields with fallbacks
            companyCountry: data.companyCountry || 'IN',
            clientCountry: data.clientCountry || 'IN',
            // Handle dates
            issueDate: data.issueDate?.toDate(),
            dueDate: data.dueDate?.toDate(),
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          };
        });
        
        setInvoices(invoiceData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error in optimized invoices listener:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.companyId]);

  const addInvoice = async (invoice) => {
    if (!currentUser?.companyId) {
      throw new Error('User company ID not found');
    }

    try {
      console.log('Creating invoice with cached company/client data...');
      
      // Use cached data if available
      let companyData = companyCache.get(currentUser.companyId);
      if (!companyData) {
        const companyDoc = await getDoc(doc(db, 'companies', currentUser.companyId));
        if (companyDoc.exists()) {
          companyData = companyDoc.data();
          companyCache.set(currentUser.companyId, companyData);
        }
      }

      let clientData = clientCache.get(invoice.clientId);
      if (!clientData) {
        const clientDoc = await getDoc(doc(db, 'clients', invoice.clientId));
        if (clientDoc.exists()) {
          clientData = clientDoc.data();
          clientCache.set(invoice.clientId, clientData);
        }
      }

      if (!companyData || !clientData) {
        throw new Error('Company or client data not found');
      }

      // Prepare invoice with snapshot data
      const invoiceData = {
        ...invoice,
        companyId: currentUser.companyId,
        // Company snapshot
        companyCountry: companyData.country || 'IN',
        companyName: companyData.companyName || '',
        companyCurrency: companyData.companyCurrency || 'INR',
        companyAddress: companyData.streetAddress || '',
        // Client snapshot
        clientCountry: clientData.country || 'IN',
        clientAddress: clientData.address || '',
        clientCurrency: clientData.clientCurrency || 'INR',
        clientState: clientData.state || '',
        clientName: clientData.name || '',
        clientEmail: clientData.email || '',
        // Convert dates
        issueDate: Timestamp.fromDate(invoice.issueDate),
        dueDate: Timestamp.fromDate(invoice.dueDate),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'invoices'), invoiceData);
      console.log('Invoice created with cached data');
      return docRef.id;
    } catch (err) {
      console.error('Error adding invoice:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to add invoice');
    }
  };

  const updateInvoice = async (id, updates) => {
    try {
      const docRef = doc(db, 'invoices', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (err) {
      console.error('Error updating invoice:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to update invoice');
    }
  };

  const deleteInvoice = async (id) => {
    try {
      await deleteDoc(doc(db, 'invoices', id));
    } catch (err) {
      console.error('Error deleting invoice:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to delete invoice');
    }
  };

  return { invoices, loading, error, addInvoice, updateInvoice, deleteInvoice };
};

// Clear cache when needed
export const clearFirestoreCache = () => {
  companyCache.clear();
  clientCache.clear();
};

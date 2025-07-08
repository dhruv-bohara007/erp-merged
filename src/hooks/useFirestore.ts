import { useState, useEffect } from 'react';
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
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export interface Invoice {
  id: string;
  companyId: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientState: string;
  clientPhone?: string;
  clientPincode?: string;
  items: InvoiceItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  totalAmount: number;
  // Currency fields
  totalAmountINR: number;
  companyCurrency: string;
  companyAmount: number;
  clientCurrency: string;
  clientAmount: number;
  conversionRate?: {
    companyToINR: number;
    INRToClient: number;
    timestamp: Date;
  };
  // Country fields
  companyCountry: string;
  clientCountry: string;
  // Company snapshot fields
  companyName: string;
  companyEmail?: string;
  companyWebsite?: string;
  companyLogoUrl?: string;
  companyPhone?: string;
  companyCity?: string;
  companyTaxInfo?: {
    primaryType?: string;
    primaryId?: string;
    secondaryId?: string;
    gstin?: string;
    pan?: string;
  };
  companyBankDetails?: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountHolderName: string;
  };
  companyAddress: string;
  ownerSignatureUrl?: string;
  // Client snapshot fields
  clientAddress: string;
  clientTaxInfo?: {
    id: string;
    type: string;
  };
  // New fields from companies collection
  bankInfo?: object;
  logoUrl?: string;
  signatureUrl?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  issueDate: Date;
  dueDate: Date;
  notes?: string;
  terms?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  clientCurrency?: string;
  gstin?: string;
  taxInfo?: {
    id: string;
    type: string;
  };
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  amount: number;
  paymentMethod: string;
  paymentDate: Date;
  status: 'completed' | 'pending' | 'failed';
  notes?: string;
  createdAt: Date;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  clientId?: string;
  clientName?: string;
  projectName?: string;
  description: string;
  expenseDate: Date;
  receipt?: string;
  status: 'recorded' | 'approved' | 'reimbursed';
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  category: string;
  sku: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unitPrice: number;
  unitCost: number;
  unit: string;
  supplier: string;
  location: string;
  status: 'active' | 'inactive' | 'discontinued';
  createdAt: Date;
  updatedAt: Date;
}

// Custom hooks for each collection
export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser?.companyId) {
      setInvoices([]);
      setLoading(false);
      return;
    }

    console.log('Setting up invoices listener for company:', currentUser.companyId);
    
    const q = query(
      collection(db, 'invoices'), 
      where('companyId', '==', currentUser.companyId)
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('Invoices snapshot received:', snapshot.docs.length, 'documents');
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
            // Handle country fields with fallbacks
            companyCountry: data.companyCountry || 'IN',
            clientCountry: data.clientCountry || 'IN',
            // Handle company snapshot fields with fallbacks
            companyName: data.companyName || '',
            companyEmail: data.companyEmail,
            companyWebsite: data.companyWebsite,
            companyLogoUrl: data.companyLogoUrl,
            companyPhone: data.companyPhone,
            companyCity: data.companyCity,
            companyTaxInfo: data.companyTaxInfo,
            companyBankDetails: data.companyBankDetails,
            companyAddress: data.companyAddress || '',
            ownerSignatureUrl: data.ownerSignatureUrl,
            // Handle client snapshot fields with fallbacks
            clientAddress: data.clientAddress || '',
            clientPhone: data.clientPhone,
            clientPincode: data.clientPincode,
            clientTaxInfo: data.clientTaxInfo,
            // Handle new fields with fallbacks
            bankInfo: data.bankInfo,
            logoUrl: data.logoUrl,
            signatureUrl: data.signatureUrl,
            conversionRate: data.conversionRate ? {
              ...data.conversionRate,
              timestamp: data.conversionRate.timestamp?.toDate?.() || new Date()
            } : undefined,
            issueDate: data.issueDate?.toDate(),
            dueDate: data.dueDate?.toDate(),
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          };
        }) as Invoice[];
        
        // Sort in memory instead of using orderBy to avoid composite index
        invoiceData.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
        
        setInvoices(invoiceData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching invoices:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.companyId]);

  const addInvoice = async (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'companyCountry' | 'clientCountry' | 'companyId' | 'companyName' | 'companyEmail' | 'companyWebsite' | 'companyLogoUrl' | 'companyPhone' | 'companyCity' | 'companyTaxInfo' | 'companyBankDetails' | 'companyAddress' | 'ownerSignatureUrl' | 'clientAddress' | 'clientPhone' | 'clientPincode' | 'clientTaxInfo' | 'bankInfo' | 'logoUrl' | 'signatureUrl' | 'clientName' | 'clientEmail' | 'clientState'>) => {
    if (!currentUser?.companyId) {
      throw new Error('User company ID not found');
    }

    try {
      console.log('Fetching company and client data for invoice creation...');
      
      // Fetch company document to get all required company fields
      const companyDoc = await getDoc(doc(db, 'companies', currentUser.companyId));
      if (!companyDoc.exists()) {
        throw new Error('Company document not found');
      }
      
      const companyData = companyDoc.data();
      // Map company fields as requested
      const companyCountry = companyData?.country || 'IN';
      const companyName = companyData?.companyName || companyData?.name || '';
      const companyEmail = companyData?.email;
      const companyWebsite = companyData?.website;
      const companyCurrency = companyData?.companyCurrency || 'INR';
      const companyAddress = companyData?.streetAddress || companyData?.address || '';
      const companyPhone = companyData?.phone;
      const companyCity = companyData?.city;
      const companyTaxInfo = companyData?.taxInfo;
      const companyBankDetails = companyData?.bankDetails;
      const bankInfo = companyData?.bankInfo;
      const logoUrl = companyData?.logoUrl;
      const signatureUrl = companyData?.signatureUrl;
      const ownerSignatureUrl = companyData?.ownerSignatureUrl;
      const companyLogoUrl = companyData?.logo;
      
      // Fetch client document to get all required client fields
      const clientDoc = await getDoc(doc(db, 'clients', invoice.clientId));
      if (!clientDoc.exists()) {
        throw new Error('Client document not found');
      }
      
      const clientData = clientDoc.data();
      // Map client fields as requested
      const clientCountry = clientData?.country || 'IN';
      const clientAddress = clientData?.address || '';
      const clientCurrency = clientData?.clientCurrency || 'INR';
      const clientPhone = clientData?.phone;
      const clientPincode = clientData?.pincode;
      const clientTaxInfo = clientData?.taxInfo;
      const clientState = clientData?.state || '';
      const clientName = clientData?.name || '';
      const clientEmail = clientData?.email || '';
      
      console.log('Company and client data fetched successfully');

      // Prepare the invoice data, only including fields that have values
      const invoiceData: any = {
        ...invoice,
        companyId: currentUser.companyId,
        // Company fields
        companyCountry,
        companyName,
        companyCurrency,
        companyAddress,
        // Client fields
        clientCountry,
        clientAddress,
        clientCurrency,
        clientState,
        clientName,
        clientEmail,
        issueDate: Timestamp.fromDate(invoice.issueDate),
        dueDate: Timestamp.fromDate(invoice.dueDate),
        conversionRate: invoice.conversionRate ? {
          ...invoice.conversionRate,
          timestamp: Timestamp.fromDate(invoice.conversionRate.timestamp)
        } : undefined,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Only add optional fields if they have values
      if (companyEmail) {
        invoiceData.companyEmail = companyEmail;
      }
      if (companyWebsite) {
        invoiceData.companyWebsite = companyWebsite;
      }
      if (companyPhone) {
        invoiceData.companyPhone = companyPhone;
      }
      if (companyCity) {
        invoiceData.companyCity = companyCity;
      }
      if (companyTaxInfo) {
        invoiceData.companyTaxInfo = companyTaxInfo;
      }
      if (companyBankDetails) {
        invoiceData.companyBankDetails = companyBankDetails;
      }
      if (bankInfo) {
        invoiceData.bankInfo = bankInfo;
      }
      if (logoUrl) {
        invoiceData.logoUrl = logoUrl;
      }
      if (signatureUrl) {
        invoiceData.signatureUrl = signatureUrl;
      }
      if (ownerSignatureUrl) {
        invoiceData.ownerSignatureUrl = ownerSignatureUrl;
      }
      if (companyLogoUrl) {
        invoiceData.companyLogoUrl = companyLogoUrl;
      }
      if (clientPhone) {
        invoiceData.clientPhone = clientPhone;
      }
      if (clientPincode) {
        invoiceData.clientPincode = clientPincode;
      }
      if (clientTaxInfo) {
        invoiceData.clientTaxInfo = clientTaxInfo;
      }

      const docRef = await addDoc(collection(db, 'invoices'), invoiceData);
      
      console.log('Invoice created with complete company and client snapshot data including email and website');
      return docRef.id;
    } catch (err) {
      console.error('Error adding invoice:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to add invoice');
    }
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
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

  const deleteInvoice = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'invoices', id));
    } catch (err) {
      console.error('Error deleting invoice:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to delete invoice');
    }
  };

  return { invoices, loading, error, addInvoice, updateInvoice, deleteInvoice };
};

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser?.companyId) {
      setClients([]);
      setLoading(false);
      return;
    }

    console.log('Setting up clients listener for company:', currentUser.companyId);
    
    const q = query(
      collection(db, 'clients'), 
      where('companyId', '==', currentUser.companyId)
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('Clients snapshot received:', snapshot.docs.length, 'documents');
        const clientData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as Client[];
        
        // Sort in memory instead of using orderBy to avoid composite index
        clientData.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
        
        setClients(clientData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching clients:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.companyId]);

  const addClient = async (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser?.companyId) {
      throw new Error('User company ID not found');
    }

    try {
      const docRef = await addDoc(collection(db, 'clients'), {
        ...client,
        companyId: currentUser.companyId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (err) {
      console.error('Error adding client:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to add client');
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    try {
      const docRef = doc(db, 'clients', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (err) {
      console.error('Error updating client:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to update client');
    }
  };

  const deleteClient = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'clients', id));
    } catch (err) {
      console.error('Error deleting client:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to delete client');
    }
  };

  return { clients, loading, error, addClient, updateClient, deleteClient };
};

export const usePayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser?.companyId) {
      setPayments([]);
      setLoading(false);
      return;
    }

    console.log('Setting up payments listener for company:', currentUser.companyId);
    
    const q = query(
      collection(db, 'payments'), 
      where('companyId', '==', currentUser.companyId)
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('Payments snapshot received:', snapshot.docs.length, 'documents');
        const paymentData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          paymentDate: doc.data().paymentDate?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
        })) as Payment[];
        
        // Sort in memory instead of using orderBy to avoid composite index
        paymentData.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
        
        setPayments(paymentData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching payments:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.companyId]);

  const addPayment = async (payment: Omit<Payment, 'id' | 'createdAt'>) => {
    if (!currentUser?.companyId) {
      throw new Error('User company ID not found');
    }

    try {
      const docRef = await addDoc(collection(db, 'payments'), {
        ...payment,
        companyId: currentUser.companyId,
        paymentDate: Timestamp.fromDate(payment.paymentDate),
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (err) {
      console.error('Error adding payment:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to add payment');
    }
  };

  return { payments, loading, error, addPayment };
};

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser?.companyId) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    console.log('Setting up expenses listener for company:', currentUser.companyId);
    
    const q = query(
      collection(db, 'expenses'), 
      where('companyId', '==', currentUser.companyId)
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('Expenses snapshot received:', snapshot.docs.length, 'documents');
        const expenseData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          expenseDate: doc.data().expenseDate?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as Expense[];
        
        // Sort in memory instead of using orderBy to avoid composite index
        expenseData.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
        
        setExpenses(expenseData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching expenses:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.companyId]);

  const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser?.companyId) {
      throw new Error('User company ID not found');
    }

    try {
      const docRef = await addDoc(collection(db, 'expenses'), {
        ...expense,
        companyId: currentUser.companyId,
        expenseDate: Timestamp.fromDate(expense.expenseDate),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (err) {
      console.error('Error adding expense:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to add expense');
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    try {
      const docRef = doc(db, 'expenses', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (err) {
      console.error('Error updating expense:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to update expense');
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (err) {
      console.error('Error deleting expense:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to delete expense');
    }
  };

  return { expenses, loading, error, addExpense, updateExpense, deleteExpense };
};

export const useInventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser?.companyId) {
      setInventory([]);
      setLoading(false);
      return;
    }

    console.log('Setting up inventory listener for company:', currentUser.companyId);
    
    const q = query(
      collection(db, 'inventory'), 
      where('companyId', '==', currentUser.companyId)
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('Inventory snapshot received:', snapshot.docs.length, 'documents');
        const inventoryData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as InventoryItem[];
        
        // Sort by name in memory instead of using orderBy to avoid composite index
        inventoryData.sort((a, b) => a.name.localeCompare(b.name));
        
        setInventory(inventoryData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching inventory:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.companyId]);

  const addInventoryItem = async (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser?.companyId) {
      throw new Error('User company ID not found');
    }

    try {
      const docRef = await addDoc(collection(db, 'inventory'), {
        ...item,
        companyId: currentUser.companyId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (err) {
      console.error('Error adding inventory item:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to add inventory item');
    }
  };

  const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      const docRef = doc(db, 'inventory', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (err) {
      console.error('Error updating inventory item:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to update inventory item');
    }
  };

  const deleteInventoryItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'inventory', id));
    } catch (err) {
      console.error('Error deleting inventory item:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to delete inventory item');
    }
  };

  return { inventory, loading, error, addInventoryItem, updateInventoryItem, deleteInventoryItem };
};

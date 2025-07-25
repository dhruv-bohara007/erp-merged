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
import { PurchaseStockService } from '@/services/purchaseStockService';
import type { Supplier, Purchase, Expense, InventoryItem, Payment } from '@/types/firestore';

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
  amountPaidByClient: number; // New field with default 0
  // Payment tracking fields
  paidUSD?: number; // Total paid in company currency
  paidINR?: number; // Total paid in INR
  pendingINR?: number; // Pending amount in INR
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
  companyLogoUrl?: string;
  companyEmail?: string;
  companyWebsite?: string;
  companyPhone?: string;
  companyCity?: string;
  companyTaxInfo?: {
    primaryType: string;
    primaryId: string;
    secondaryId?: string;
    gstin?: string;
  };
  companyBankDetails?: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountHolderName: string;
  };
  companyAddress: string;
  ownerSignatureUrl?: string;
  // Business owner fields
  businessOwnerName?: string;
  businessOwnerPosition?: string;
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
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'pending' | 'partially-paid' | 'paid-after-due';
  issueDate: Date;
  dueDate: Date;
  notes?: string;
  terms?: string;
  partialPayments?: Array<{
    paymentDate: Date;
    originalPaymentAmount: number;
    paymentMethod: 'neft' | 'rtgs' | 'imps' | 'upi' | 'cash' | 'credit_card' | 'debit_card' | 'cheque';
    amountPaidByClient: number;
    amount: number;
    conversionRate: {
      companyToINR: number;
      INRToClient: number;
      timestamp: Date;
    };
    pendingPaymentInINR: number;
    clientCurrency: string;
    companyCurrency: string;
    referenceNumber?: string;
    bankDetails?: {
      fromAccount?: string;
      toAccount?: string;
      ifscCode?: string;
    };
    notes?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  // Product details for enhanced invoice management
  productCategory?: string;
  itemName?: string;
  productVersion?: string;
  discount?: string;
  productRate?: number;
  sourceType?: 'manual' | 'stock' | 'inventory';
  unit?: string;
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


// Note: Using imported types from @/types/firestore for Expense and InventoryItem

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
          
          // Determine status based on amountPaidByClient and due date
          const amountPaidByClient = data.amountPaidByClient || 0;
          const clientAmount = data.clientAmount || data.totalAmount || 0;
          const dueDate = data.dueDate?.toDate() || new Date();
          const isOverdue = new Date() > dueDate;
          
          let status = data.status || 'draft';
          
          // Apply status determination logic only if not draft
          if (status !== 'draft') {
            if (amountPaidByClient === 0 && !isOverdue) {
              status = 'sent';
            } else if (amountPaidByClient > 0 && !isOverdue && amountPaidByClient < clientAmount) {
              status = 'pending';
            } else if (amountPaidByClient < clientAmount && isOverdue) {
              status = 'overdue';
            } else if (amountPaidByClient >= clientAmount) {
              status = 'paid';
            }
          }
          
          return {
            id: doc.id,
            ...data,
            // Handle currency fields with fallbacks
            totalAmountINR: data.totalAmountINR || data.totalAmount || 0,
            companyCurrency: data.companyCurrency || 'INR',
            companyAmount: data.companyAmount || data.totalAmount || 0,
            clientCurrency: data.clientCurrency || 'INR',
            clientAmount: data.clientAmount || data.totalAmount || 0,
            amountPaidByClient: amountPaidByClient, // New field
            // Handle country fields with fallbacks
            companyCountry: data.companyCountry || 'IN',
            clientCountry: data.clientCountry || 'IN',
            // Handle company snapshot fields with fallbacks
            companyName: data.companyName || '',
            companyLogoUrl: data.companyLogoUrl,
            companyEmail: data.companyEmail,
            companyWebsite: data.companyWebsite,
            companyPhone: data.companyPhone,
            companyCity: data.companyCity,
            companyTaxInfo: data.companyTaxInfo,
            companyBankDetails: data.companyBankDetails,
            companyAddress: data.companyAddress || '',
            ownerSignatureUrl: data.ownerSignatureUrl,
            // Handle business owner fields with fallbacks
            businessOwnerName: data.businessOwnerName,
            businessOwnerPosition: data.businessOwnerPosition,
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
            partialPayments: (data.partialPayments || []).map((pp: any) => ({
              ...pp,
              paymentDate: pp.paymentDate?.toDate?.() || new Date(pp.paymentDate) || new Date(),
              conversionRate: {
                ...pp.conversionRate,
                timestamp: pp.conversionRate?.timestamp?.toDate?.() || new Date(pp.conversionRate?.timestamp) || new Date()
              }
            })),
            status, // Use determined status
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

  const addInvoice = async (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'companyCountry' | 'clientCountry' | 'companyId' | 'companyName' | 'companyLogoUrl' | 'companyEmail' | 'companyWebsite' | 'companyPhone' | 'companyCity' | 'companyTaxInfo' | 'companyBankDetails' | 'companyAddress' | 'ownerSignatureUrl' | 'businessOwnerName' | 'businessOwnerPosition' | 'clientAddress' | 'clientPhone' | 'clientPincode' | 'clientTaxInfo' | 'bankInfo' | 'logoUrl' | 'signatureUrl' | 'clientName' | 'clientEmail' | 'clientState'>) => {
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
      const companyCurrency = companyData?.companyCurrency || 'INR';
      const companyAddress = companyData?.streetAddress || companyData?.address || '';
      const companyEmail = companyData?.email;
      const companyWebsite = companyData?.website;
      const companyPhone = companyData?.phone;
      const companyCity = companyData?.city;
      const companyTaxInfo = companyData?.taxInfo ? {
        primaryType: companyData.taxInfo.primaryType,
        primaryId: companyData.taxInfo.primaryId,
        secondaryId: companyData.taxInfo.secondaryId
      } : undefined;
      const companyBankDetails = companyData?.bankDetails;
      const bankInfo = companyData?.bankInfo;
      const logoUrl = companyData?.logoUrl;
      const signatureUrl = companyData?.signatureUrl;
      const ownerSignatureUrl = companyData?.ownerSignatureUrl;
      const companyLogoUrl = companyData?.logo;
      // Business owner fields
      const businessOwnerName = companyData?.businessOwnerName;
      const businessOwnerPosition = companyData?.businessOwnerPosition;
      
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
      if (businessOwnerName) {
        invoiceData.businessOwnerName = businessOwnerName;
      }
      if (businessOwnerPosition) {
        invoiceData.businessOwnerPosition = businessOwnerPosition;
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
      
      console.log('Invoice created with complete company and client snapshot data including business owner information');
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
      console.log('Starting invoice deletion process for ID:', id);
      
      // First, get the invoice data to restore stock
      const invoiceDoc = await getDoc(doc(db, 'invoices', id));
      if (invoiceDoc.exists()) {
        const invoiceData = invoiceDoc.data() as Invoice;
        console.log('Invoice data found:', invoiceData);
        console.log('Invoice items:', invoiceData.items);
        
        // Restore stock for items sourced from stock
        if (invoiceData.items && invoiceData.companyId) {
          console.log('Attempting to restore stock for company:', invoiceData.companyId);
          const stockItems = invoiceData.items.filter(item => item.sourceType === 'stock');
          console.log('Stock items to restore:', stockItems);
          
          if (stockItems.length > 0) {
            const { InvoiceStockService } = await import('@/services/invoiceStockService');
            await InvoiceStockService.restoreStockOnInvoiceDeletion(
              invoiceData.companyId, 
              invoiceData.items
            );
            console.log('Stock restoration completed');
          } else {
            console.log('No stock items found to restore');
          }
        } else {
          console.log('No items or companyId found in invoice');
        }
      } else {
        console.log('Invoice document not found');
      }
      
      // Then delete the invoice
      await deleteDoc(doc(db, 'invoices', id));
      console.log('Invoice deleted successfully');
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
        const paymentData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            invoiceId: data.invoiceId,
            invoiceNumber: data.invoiceNumber,
            clientId: data.clientId,
            clientName: data.clientName,
            companyId: data.companyId,
            totalPaidUSD: data.totalPaidUSD || 0,
            totalPaidINR: data.totalPaidINR || 0,
            pendingINR: data.pendingINR || 0,
            status: data.status || 'pending',
            partialPayments: (data.partialPayments || []).map((pp: any) => ({
              ...pp,
              paymentDate: pp.paymentDate?.toDate() || new Date(),
              conversionRate: {
                ...pp.conversionRate,
                timestamp: pp.conversionRate?.timestamp?.toDate() || new Date()
              }
            })),
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          };
        }) as Payment[];
        
        // Sort in memory instead of using orderBy to avoid composite index
        paymentData.sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
        
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
        updatedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (err) {
      console.error('Error adding payment:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to add payment');
    }
  };

  const updatePayment = async (paymentId: string, updates: Partial<Payment>) => {
    if (!currentUser?.companyId) {
      throw new Error('User company ID not found');
    }

    try {
      await updateDoc(doc(db, 'payments', paymentId), {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (err) {
      console.error('Error updating payment:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to update payment');
    }
  };

  return { payments, loading, error, addPayment, updatePayment };
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

    console.log('Setting up purchase records listener for company:', currentUser.companyId);
    
    const q = query(
      collection(db, 'purchase_records'), 
      where('companyId', '==', currentUser.companyId),
      where('supplierName', '==', null)  // This excludes purchase records
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('Purchase records snapshot received:', snapshot.docs.length, 'documents');
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
        console.error('Error fetching purchase records:', err);
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
      const docRef = await addDoc(collection(db, 'purchase_records'), {
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
      const docRef = doc(db, 'purchase_records', id);
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
      await deleteDoc(doc(db, 'purchase_records', id));
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
        inventoryData.sort((a, b) => (a.itemName || '').localeCompare(b.itemName || ''));
        
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

  const addInventoryItem = async (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'companyId'>) => {
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

export const usePurchases = () => {
  const [purchases, setPurchases] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser?.companyId) {
      setPurchases([]);
      setLoading(false);
      return;
    }

    console.log('Setting up purchases listener for company:', currentUser.companyId);
    
    // Query purchase_records collection but filter for purchase-type entries
    // Remove the composite query to avoid index requirement
    const q = query(
      collection(db, 'purchase_records'), 
      where('companyId', '==', currentUser.companyId)
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('Purchases snapshot received:', snapshot.docs.length, 'documents');
        const expenseData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          expenseDate: doc.data().expenseDate?.toDate(),
          purchaseDate: doc.data().purchaseDate?.toDate() || doc.data().expenseDate?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as Expense[];
        
        // Filter purchases in memory instead of in the query
        const purchaseData = expenseData.filter(expense => expense.supplierName);
        
        // Sort in memory instead of using orderBy to avoid composite index
        purchaseData.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
        
        setPurchases(purchaseData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching purchases:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.companyId]);

  const addPurchase = async (purchase: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'companyId'>) => {
    if (!currentUser?.companyId) {
      throw new Error('User company ID not found');
    }

    try {
      const docRef = await addDoc(collection(db, 'purchase_records'), {
        ...purchase,
        companyId: currentUser.companyId,
        // Ensure purchase-specific fields are set
        supplierName: purchase.supplierName || purchase.title,
        expenseDate: Timestamp.fromDate(purchase.expenseDate || purchase.purchaseDate || new Date()),
        purchaseDate: purchase.purchaseDate ? Timestamp.fromDate(purchase.purchaseDate) : Timestamp.fromDate(purchase.expenseDate || new Date()),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (err) {
      console.error('Error adding purchase:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to add purchase');
    }
  };

  const updatePurchase = async (id: string, updates: Partial<Expense>) => {
    try {
      const docRef = doc(db, 'purchase_records', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (err) {
      console.error('Error updating purchase:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to update purchase');
    }
  };

  const deletePurchase = async (id: string) => {
    if (!currentUser?.companyId) {
      throw new Error('User company ID not found');
    }

    try {
      // First get the purchase record to update stock
      const purchaseDoc = await getDoc(doc(db, 'purchase_records', id));
      if (purchaseDoc.exists()) {
        const purchaseRecord = { id: purchaseDoc.id, ...purchaseDoc.data() } as Expense;
        
        // Update stock before deleting the record
        await PurchaseStockService.updateStockOnPurchaseDelete(
          purchaseRecord,
          currentUser.companyId
        );
      }

      // Delete the purchase record
      await deleteDoc(doc(db, 'purchase_records', id));
    } catch (err) {
      console.error('Error deleting purchase:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to delete purchase');
    }
  };

  return { purchases, loading, error, addPurchase, updatePurchase, deletePurchase };
};

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser?.companyId) {
      setSuppliers([]);
      setLoading(false);
      return;
    }

    console.log('Setting up suppliers listener for company:', currentUser.companyId);
    
    const q = query(
      collection(db, 'suppliers'), 
      where('companyId', '==', currentUser.companyId)
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('Suppliers snapshot received:', snapshot.docs.length, 'documents');
        const supplierData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as Supplier[];
        
        // Sort in memory instead of using orderBy to avoid composite index
        supplierData.sort((a, b) => {
          const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
          const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
          return bTime - aTime;
        });
        
        setSuppliers(supplierData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching suppliers:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.companyId]);

  const addSupplier = async (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser?.companyId) {
      throw new Error('User company ID not found');
    }

    try {
      const docRef = await addDoc(collection(db, 'suppliers'), {
        ...supplier,
        companyId: currentUser.companyId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (err) {
      console.error('Error adding supplier:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to add supplier');
    }
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    try {
      const docRef = doc(db, 'suppliers', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (err) {
      console.error('Error updating supplier:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to update supplier');
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'suppliers', id));
    } catch (err) {
      console.error('Error deleting supplier:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to delete supplier');
    }
  };

  return { suppliers, loading, error, addSupplier, updateSupplier, deleteSupplier };
};

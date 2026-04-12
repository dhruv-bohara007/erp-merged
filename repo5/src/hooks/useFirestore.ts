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
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientState: string;
  items: InvoiceItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  totalAmount: number;
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
  gstin?: string;
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

  useEffect(() => {
    const q = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const invoiceData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          issueDate: doc.data().issueDate?.toDate(),
          dueDate: doc.data().dueDate?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as Invoice[];
        setInvoices(invoiceData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addInvoice = async (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const docRef = await addDoc(collection(db, 'invoices'), {
        ...invoice,
        issueDate: Timestamp.fromDate(invoice.issueDate),
        dueDate: Timestamp.fromDate(invoice.dueDate),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (err) {
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
      throw new Error(err instanceof Error ? err.message : 'Failed to update invoice');
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'invoices', id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete invoice');
    }
  };

  return { invoices, loading, error, addInvoice, updateInvoice, deleteInvoice };
};

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'clients'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const clientData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as Client[];
        setClients(clientData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addClient = async (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const docRef = await addDoc(collection(db, 'clients'), {
        ...client,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (err) {
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
      throw new Error(err instanceof Error ? err.message : 'Failed to update client');
    }
  };

  const deleteClient = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'clients', id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete client');
    }
  };

  return { clients, loading, error, addClient, updateClient, deleteClient };
};

export const usePayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const paymentData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          paymentDate: doc.data().paymentDate?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
        })) as Payment[];
        setPayments(paymentData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addPayment = async (payment: Omit<Payment, 'id' | 'createdAt'>) => {
    try {
      const docRef = await addDoc(collection(db, 'payments'), {
        ...payment,
        paymentDate: Timestamp.fromDate(payment.paymentDate),
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add payment');
    }
  };

  return { payments, loading, error, addPayment };
};

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'expenses'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const expenseData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          expenseDate: doc.data().expenseDate?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as Expense[];
        setExpenses(expenseData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const docRef = await addDoc(collection(db, 'expenses'), {
        ...expense,
        expenseDate: Timestamp.fromDate(expense.expenseDate),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (err) {
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
      throw new Error(err instanceof Error ? err.message : 'Failed to update expense');
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete expense');
    }
  };

  return { expenses, loading, error, addExpense, updateExpense, deleteExpense };
};

export const useInventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'inventory'), orderBy('name', 'asc'));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const inventoryData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as InventoryItem[];
        setInventory(inventoryData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addInventoryItem = async (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const docRef = await addDoc(collection(db, 'inventory'), {
        ...item,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (err) {
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
      throw new Error(err instanceof Error ? err.message : 'Failed to update inventory item');
    }
  };

  const deleteInventoryItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'inventory', id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete inventory item');
    }
  };

  return { inventory, loading, error, addInventoryItem, updateInventoryItem, deleteInventoryItem };
};

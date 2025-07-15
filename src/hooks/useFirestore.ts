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
import { useAuth } from '@/contexts/AuthContext';

// Re-export types from firestore.ts
export type { Client, Invoice, Payment, Supplier, Expense, Purchase, InvoiceItem } from '@/types/firestore';

// Generic Firestore hook for basic operations
export const useFirestore = () => {
  const addDocument = async (collectionName: string, data: any) => {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  };

  const updateDocument = async (collectionName: string, id: string, data: any) => {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  };

  const deleteDocument = async (collectionName: string, id: string) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  };

  return {
    addDocument,
    updateDocument,
    deleteDocument
  };
};

// Clients hook
export const useClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser?.companyId) {
      setClients([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'clients'),
      where('companyId', '==', currentUser.companyId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const clientsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        }));
        setClients(clientsData);
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

  const addClient = async (clientData: any) => {
    if (!currentUser?.companyId) throw new Error('Company ID not found');
    
    try {
      const docRef = await addDoc(collection(db, 'clients'), {
        ...clientData,
        companyId: currentUser.companyId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding client:', error);
      throw error;
    }
  };

  const updateClient = async (id: string, updates: any) => {
    try {
      const docRef = doc(db, 'clients', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'clients', id));
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  };

  return { clients, loading, error, addClient, updateClient, deleteClient };
};

// Invoices hook
export const useInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser?.companyId) {
      setInvoices([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'invoices'),
      where('companyId', '==', currentUser.companyId)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const invoicesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          issueDate: doc.data().issueDate?.toDate(),
          dueDate: doc.data().dueDate?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        }));
        
        // Sort by createdAt in descending order
        invoicesData.sort((a, b) => {
          const aTime = a.createdAt?.getTime() || 0;
          const bTime = b.createdAt?.getTime() || 0;
          return bTime - aTime;
        });
        
        setInvoices(invoicesData);
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

  const addInvoice = async (invoiceData: any) => {
    if (!currentUser?.companyId) throw new Error('Company ID not found');
    
    try {
      const docRef = await addDoc(collection(db, 'invoices'), {
        ...invoiceData,
        companyId: currentUser.companyId,
        issueDate: Timestamp.fromDate(invoiceData.issueDate),
        dueDate: Timestamp.fromDate(invoiceData.dueDate),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding invoice:', error);
      throw error;
    }
  };

  const updateInvoice = async (id: string, updates: any) => {
    try {
      const docRef = doc(db, 'invoices', id);
      const updateData = { ...updates, updatedAt: Timestamp.now() };
      
      // Handle date fields
      if (updateData.issueDate && updateData.issueDate instanceof Date) {
        updateData.issueDate = Timestamp.fromDate(updateData.issueDate);
      }
      if (updateData.dueDate && updateData.dueDate instanceof Date) {
        updateData.dueDate = Timestamp.fromDate(updateData.dueDate);
      }
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'invoices', id));
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  };

  return { invoices, loading, error, addInvoice, updateInvoice, deleteInvoice };
};

// Payments hook
export const usePayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser?.companyId) {
      setPayments([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'payments'),
      where('companyId', '==', currentUser.companyId),
      orderBy('paymentDate', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const paymentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          paymentDate: doc.data().paymentDate?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        }));
        setPayments(paymentsData);
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

  const addPayment = async (paymentData: any) => {
    if (!currentUser?.companyId) throw new Error('Company ID not found');
    
    try {
      const docRef = await addDoc(collection(db, 'payments'), {
        ...paymentData,
        companyId: currentUser.companyId,
        paymentDate: Timestamp.fromDate(paymentData.paymentDate),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding payment:', error);
      throw error;
    }
  };

  const updatePayment = async (id: string, updates: any) => {
    try {
      const docRef = doc(db, 'payments', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  };

  const deletePayment = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'payments', id));
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  };

  return { payments, loading, error, addPayment, updatePayment, deletePayment };
};

// Expenses hook
export const useExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser?.companyId) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'expenses'),
      where('companyId', '==', currentUser.companyId),
      orderBy('expenseDate', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const expensesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          expenseDate: doc.data().expenseDate?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        }));
        setExpenses(expensesData);
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

  const addExpense = async (expenseData: any) => {
    if (!currentUser?.companyId) throw new Error('Company ID not found');
    
    try {
      const docRef = await addDoc(collection(db, 'expenses'), {
        ...expenseData,
        companyId: currentUser.companyId,
        expenseDate: Timestamp.fromDate(expenseData.expenseDate),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  };

  const updateExpense = async (id: string, updates: any) => {
    try {
      const docRef = doc(db, 'expenses', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  };

  return { expenses, loading, error, addExpense, updateExpense, deleteExpense };
};

// Inventory hook
export const useInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser?.companyId) {
      setInventory([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'inventory'),
      where('companyId', '==', currentUser.companyId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const inventoryData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        }));
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

  const addInventoryItem = async (itemData: any) => {
    if (!currentUser?.companyId) throw new Error('Company ID not found');
    
    try {
      const docRef = await addDoc(collection(db, 'inventory'), {
        ...itemData,
        companyId: currentUser.companyId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding inventory item:', error);
      throw error;
    }
  };

  const updateInventoryItem = async (id: string, updates: any) => {
    try {
      const docRef = doc(db, 'inventory', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  };

  const deleteInventoryItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'inventory', id));
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  };

  return { 
    inventory, 
    loading, 
    error, 
    addInventoryItem, 
    updateInventoryItem, 
    deleteInventoryItem 
  };
};

// Purchases hook
export const usePurchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser?.companyId) {
      setPurchases([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'purchases'),
      where('companyId', '==', currentUser.companyId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const purchasesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          purchaseDate: doc.data().purchaseDate?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        }));
        setPurchases(purchasesData);
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

  const addPurchase = async (purchaseData: any) => {
    if (!currentUser?.companyId) throw new Error('Company ID not found');
    
    try {
      const docRef = await addDoc(collection(db, 'purchases'), {
        ...purchaseData,
        companyId: currentUser.companyId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding purchase:', error);
      throw error;
    }
  };

  const updatePurchase = async (id: string, updates: any) => {
    try {
      const docRef = doc(db, 'purchases', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating purchase:', error);
      throw error;
    }
  };

  const deletePurchase = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'purchases', id));
    } catch (error) {
      console.error('Error deleting purchase:', error);
      throw error;
    }
  };

  return { purchases, loading, error, addPurchase, updatePurchase, deletePurchase };
};

// Suppliers hook
export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser?.companyId) {
      setSuppliers([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'suppliers'),
      where('companyId', '==', currentUser.companyId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const suppliersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        }));
        setSuppliers(suppliersData);
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

  const addSupplier = async (supplierData: any) => {
    if (!currentUser?.companyId) throw new Error('Company ID not found');
    
    try {
      const docRef = await addDoc(collection(db, 'suppliers'), {
        ...supplierData,
        companyId: currentUser.companyId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding supplier:', error);
      throw error;
    }
  };

  const updateSupplier = async (id: string, updates: any) => {
    try {
      const docRef = doc(db, 'suppliers', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'suppliers', id));
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  };

  return { suppliers, loading, error, addSupplier, updateSupplier, deleteSupplier };
};
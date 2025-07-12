import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs
} from 'firebase/firestore';
import { useAuth } from './useAuth';

interface Expense {
  id: string;
  companyId: string;
  supplierName: string;
  itemName: string;
  productCategory?: string;
  productVersion?: string;
  quantity: number;
  unit: string;
  totalAmountINR: number;
  amount: number;
  purchaseDate: string;
  expenseDate: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface InventoryItem {
  id: string;
  companyId: string;
  productCategory: string;
  itemName: string;
  productVersion: string;
  quantity: number;
  unit: string;
  createdAt: Date;
  updatedAt: Date;
}

export const usePurchases = () => {
  const [purchases, setPurchases] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.companyId) return;

    const fetchPurchases = async () => {
      try {
        setLoading(true);
        
        // Simple query without compound index requirement
        const expensesRef = collection(db, 'expenses');
        const q = query(
          expensesRef,
          where('companyId', '==', user.companyId),
          orderBy('__name__')
        );
        
        const querySnapshot = await getDocs(q);
        const expensesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Expense[];
        
        // Filter and sort in memory to avoid compound index requirement
        const purchaseData = expensesData
          .filter(expense => expense.supplierName)
          .sort((a, b) => {
            const dateA = new Date(a.purchaseDate || a.expenseDate);
            const dateB = new Date(b.purchaseDate || b.expenseDate);
            return dateB.getTime() - dateA.getTime();
          });
        
        setPurchases(purchaseData);
      } catch (error) {
        console.error('Error fetching purchases:', error);
        setPurchases([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, [user?.companyId]);

  const addPurchase = async (purchaseData: Partial<Expense>) => {
    if (!user?.companyId) throw new Error('No company ID');

    const expenseRef = collection(db, 'expenses');
    const docRef = await addDoc(expenseRef, {
      ...purchaseData,
      companyId: user.companyId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return docRef.id;
  };

  const updatePurchase = async (id: string, updates: Partial<Expense>) => {
    const expenseRef = doc(db, 'expenses', id);
    await updateDoc(expenseRef, {
      ...updates,
      updatedAt: new Date()
    });
    
    // Refresh the purchases list
    setPurchases(prev => prev.map(purchase => 
      purchase.id === id ? { ...purchase, ...updates } : purchase
    ));
  };

  const deletePurchase = async (id: string) => {
    await deleteDoc(doc(db, 'expenses', id));
    setPurchases(prev => prev.filter(purchase => purchase.id !== id));
  };

  return {
    purchases,
    loading,
    addPurchase,
    updatePurchase,
    deletePurchase
  };
};

export const useInventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.companyId) return;

    const fetchInventory = async () => {
      try {
        setLoading(true);
        const inventoryRef = collection(db, 'inventory');
        const q = query(
          inventoryRef,
          where('companyId', '==', user.companyId),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const inventoryData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as InventoryItem[];
        setInventory(inventoryData);
      } catch (error) {
        console.error('Error fetching inventory:', error);
        setInventory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();

    // Cleanup function (optional in this case, but good practice)
    return () => {
      // Any cleanup logic here
    };
  }, [user?.companyId]);

  const addInventoryItem = async (itemData: Partial<InventoryItem>) => {
    if (!user?.companyId) throw new Error('No company ID');

    const inventoryRef = collection(db, 'inventory');
    const docRef = await addDoc(inventoryRef, {
      ...itemData,
      companyId: user.companyId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return docRef.id;
  };

  const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
    const inventoryRef = doc(db, 'inventory', id);
    await updateDoc(inventoryRef, {
      ...updates,
      updatedAt: new Date()
    });
  };

   const deleteInventoryItem = async (id: string) => {
    await deleteDoc(doc(db, 'inventory', id));
    setInventory(prev => prev.filter(item => item.id !== id));
  };

  return {
    inventory,
    loading,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem
  };
};

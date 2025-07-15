
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
import type { Supplier } from '@/types/firestore';

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
      where('companyId', '==', currentUser.companyId),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('Suppliers snapshot received:', snapshot.docs.length, 'documents');
        
        const suppliersData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          } as Supplier;
        });
        
        setSuppliers(suppliersData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error in suppliers listener:', err);
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
      console.log('Adding supplier:', supplier);
      const supplierData = {
        ...supplier,
        companyId: currentUser.companyId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'suppliers'), supplierData);
      console.log('Supplier added with ID:', docRef.id);
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


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
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export interface ProductDefinition {
  id: string;
  category: string;
  name: string;
  version: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export const useProductDefinitions = () => {
  const [productDefinitions, setProductDefinitions] = useState<ProductDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser?.companyId) {
      setProductDefinitions([]);
      setLoading(false);
      return;
    }

    console.log('Setting up product definitions listener for company:', currentUser.companyId);
    
    const q = query(
      collection(db, 'productDefinitions'), 
      where('companyId', '==', currentUser.companyId)
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('Product definitions snapshot received:', snapshot.docs.length, 'documents');
        const definitionData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as ProductDefinition[];
        
        // Sort by category, then name, then version
        definitionData.sort((a, b) => {
          if (a.category !== b.category) return a.category.localeCompare(b.category);
          if (a.name !== b.name) return a.name.localeCompare(b.name);
          return a.version.localeCompare(b.version);
        });
        
        setProductDefinitions(definitionData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching product definitions:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.companyId]);

  const addProductDefinition = async (definition: Omit<ProductDefinition, 'id' | 'createdAt' | 'updatedAt' | 'companyId'>) => {
    if (!currentUser?.companyId) {
      throw new Error('User company ID not found');
    }

    try {
      const docRef = await addDoc(collection(db, 'productDefinitions'), {
        ...definition,
        companyId: currentUser.companyId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (err) {
      console.error('Error adding product definition:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to add product definition');
    }
  };

  const updateProductDefinition = async (id: string, updates: Partial<ProductDefinition>) => {
    try {
      const docRef = doc(db, 'productDefinitions', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (err) {
      console.error('Error updating product definition:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to update product definition');
    }
  };

  const deleteProductDefinition = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'productDefinitions', id));
    } catch (err) {
      console.error('Error deleting product definition:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to delete product definition');
    }
  };

  return { 
    productDefinitions, 
    loading, 
    error, 
    addProductDefinition, 
    updateProductDefinition, 
    deleteProductDefinition 
  };
};

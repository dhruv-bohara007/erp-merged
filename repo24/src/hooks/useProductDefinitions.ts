
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
    console.log('useProductDefinitions: currentUser:', currentUser);
    console.log('useProductDefinitions: currentUser.companyId:', currentUser?.companyId);
    console.log('useProductDefinitions: currentUser.role:', currentUser?.role);

    if (!currentUser) {
      console.log('useProductDefinitions: No current user, clearing data');
      setProductDefinitions([]);
      setLoading(false);
      setError('No authenticated user');
      return;
    }

    if (!currentUser.companyId) {
      console.log('useProductDefinitions: No company ID found for user');
      setProductDefinitions([]);
      setLoading(false);
      setError('User has no company ID');
      return;
    }

    if (currentUser.role !== 'company_admin' && currentUser.role !== 'super_admin') {
      console.log('useProductDefinitions: User does not have required role:', currentUser.role);
      setProductDefinitions([]);
      setLoading(false);
      setError('Insufficient permissions');
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
        const definitionData = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Product definition document:', doc.id, data);
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          };
        }) as ProductDefinition[];
        
        // Sort by category, then name, then version
        definitionData.sort((a, b) => {
          if (a.category !== b.category) return a.category.localeCompare(b.category);
          if (a.name !== b.name) return a.name.localeCompare(b.name);
          return a.version.localeCompare(b.version);
        });
        
        console.log('Final sorted product definitions:', definitionData);
        setProductDefinitions(definitionData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching product definitions:', err);
        console.error('Error code:', err.code);
        console.error('Error message:', err.message);
        console.error('Current user when error occurred:', currentUser);
        setError(`${err.code}: ${err.message}`);
        setLoading(false);
      }
    );

    return () => {
      console.log('Cleaning up product definitions listener');
      unsubscribe();
    };
  }, [currentUser?.companyId, currentUser?.role, currentUser?.uid]);

  const addProductDefinition = async (definition: Omit<ProductDefinition, 'id' | 'createdAt' | 'updatedAt' | 'companyId'>) => {
    if (!currentUser?.companyId) {
      throw new Error('User company ID not found');
    }

    console.log('Adding product definition:', definition, 'for company:', currentUser.companyId);

    try {
      const docRef = await addDoc(collection(db, 'productDefinitions'), {
        ...definition,
        companyId: currentUser.companyId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      console.log('Product definition added with ID:', docRef.id);
      return docRef.id;
    } catch (err) {
      console.error('Error adding product definition:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to add product definition');
    }
  };

  const updateProductDefinition = async (id: string, updates: Partial<ProductDefinition>) => {
    console.log('Updating product definition:', id, 'with updates:', updates);
    try {
      const docRef = doc(db, 'productDefinitions', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      console.log('Product definition updated successfully');
    } catch (err) {
      console.error('Error updating product definition:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to update product definition');
    }
  };

  const deleteProductDefinition = async (id: string) => {
    console.log('Deleting product definition:', id);
    try {
      await deleteDoc(doc(db, 'productDefinitions', id));
      console.log('Product definition deleted successfully');
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

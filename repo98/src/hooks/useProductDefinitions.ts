
import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  orderBy,
  DocumentData 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export interface ProductDefinition {
  id: string;
  productCategory: string;
  itemName: string;
  productVersion: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export const useProductDefinitions = () => {
  const [productDefinitions, setProductDefinitions] = useState<ProductDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const fetchProductDefinitions = useCallback(async () => {
    console.log('=== fetchProductDefinitions called ===');
    console.log('Current user companyId:', currentUser?.companyId);
    
    if (!currentUser?.companyId) {
      console.log('No companyId found, stopping fetch');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Querying product_definitions with companyId:', currentUser.companyId);
      
      // Simplified query without multiple orderBy to avoid index requirements
      const q = query(
        collection(db, 'product_definitions'),
        where('companyId', '==', currentUser.companyId)
      );
      
      const snapshot = await getDocs(q);
      console.log('Query snapshot size:', snapshot.size);
      console.log('Raw documents:', snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      const definitions = snapshot.docs.map(doc => {
        const data = doc.data();
        const definition = {
          id: doc.id,
          productCategory: data.productCategory,
          itemName: data.itemName,
          productVersion: data.productVersion,
          companyId: data.companyId,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
        console.log('Processed definition:', definition);
        return definition;
      }) as ProductDefinition[];

      // Sort the definitions on the frontend to avoid Firestore index requirements
      const sortedDefinitions = definitions.sort((a, b) => {
        const categoryCompare = (a.productCategory || '').localeCompare(b.productCategory || '');
        if (categoryCompare !== 0) return categoryCompare;
        
        const nameCompare = (a.itemName || '').localeCompare(b.itemName || '');
        if (nameCompare !== 0) return nameCompare;
        
        return (a.productVersion || '').localeCompare(b.productVersion || '');
      });

      console.log('Final definitions array:', sortedDefinitions);
      setProductDefinitions(sortedDefinitions);
      setError(null);
    } catch (err) {
      console.error('Error fetching product definitions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch product definitions');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.companyId]);

  useEffect(() => {
    fetchProductDefinitions();
  }, [fetchProductDefinitions]);

  const addProductDefinition = async (definition: Omit<ProductDefinition, 'id' | 'createdAt' | 'updatedAt' | 'companyId'>) => {
    if (!currentUser?.companyId) {
      throw new Error('No company ID found');
    }

    try {
      // Check if this exact combination already exists
      const existing = productDefinitions.find(pd => 
        pd.productCategory === definition.productCategory &&
        pd.itemName === definition.itemName &&
        pd.productVersion === definition.productVersion
      );

      if (existing) {
        console.log('Product definition already exists, skipping creation');
        return;
      }

      const newDefinition = {
        productCategory: definition.productCategory,
        itemName: definition.itemName,
        productVersion: definition.productVersion,
        companyId: currentUser.companyId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, 'product_definitions'), newDefinition);
      await fetchProductDefinitions(); // Refresh the list
    } catch (err) {
      console.error('Error creating product definition:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to create product definition');
    }
  };

  const updateProductDefinition = async (id: string, updates: Partial<Omit<ProductDefinition, 'id' | 'companyId' | 'createdAt'>>) => {
    try {
      const docRef = doc(db, 'product_definitions', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date(),
      });
      await fetchProductDefinitions(); // Refresh the list
    } catch (err) {
      console.error('Error updating product definition:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to update product definition');
    }
  };

  const deleteProductDefinition = async (id: string) => {
    try {
      const docRef = doc(db, 'product_definitions', id);
      await deleteDoc(docRef);
      await fetchProductDefinitions(); // Refresh the list
    } catch (err) {
      console.error('Error deleting product definition:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to delete product definition');
    }
  };

  const deleteCategoryAndAllRelated = async (categoryName: string) => {
    if (!currentUser?.companyId) {
      throw new Error('No company ID found');
    }

    try {
      // Find all documents with this category
      const relatedDefinitions = productDefinitions.filter(def => 
        def.productCategory === categoryName && def.companyId === currentUser.companyId
      );

      // Delete all related documents
      const deletePromises = relatedDefinitions.map(def => 
        deleteDoc(doc(db, 'product_definitions', def.id))
      );

      await Promise.all(deletePromises);
      await fetchProductDefinitions(); // Refresh the list
    } catch (err) {
      console.error('Error deleting category and related definitions:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to delete category and related definitions');
    }
  };

  const deleteItemNameAndAllVersions = async (categoryName: string, itemName: string) => {
    if (!currentUser?.companyId) {
      throw new Error('No company ID found');
    }

    try {
      // Find all documents with this category and item name
      const relatedDefinitions = productDefinitions.filter(def => 
        def.productCategory === categoryName && 
        def.itemName === itemName && 
        def.companyId === currentUser.companyId
      );

      // Delete all related documents
      const deletePromises = relatedDefinitions.map(def => 
        deleteDoc(doc(db, 'product_definitions', def.id))
      );

      await Promise.all(deletePromises);
      await fetchProductDefinitions(); // Refresh the list
    } catch (err) {
      console.error('Error deleting item name and all versions:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to delete item name and all versions');
    }
  };

  const updateCategoryForAllRelated = async (oldCategoryName: string, newCategoryName: string) => {
    if (!currentUser?.companyId) {
      throw new Error('No company ID found');
    }

    try {
      // Find all documents with this category
      const relatedDefinitions = productDefinitions.filter(def => 
        def.productCategory === oldCategoryName && def.companyId === currentUser.companyId
      );

      // Update all related documents
      const updatePromises = relatedDefinitions.map(def => 
        updateDoc(doc(db, 'product_definitions', def.id), { 
          productCategory: newCategoryName.trim(),
          updatedAt: new Date()
        })
      );

      await Promise.all(updatePromises);
      await fetchProductDefinitions(); // Refresh the list
    } catch (err) {
      console.error('Error updating category for all related definitions:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to update category for all related definitions');
    }
  };

  const updateItemNameForAllVersions = async (categoryName: string, oldItemName: string, newItemName: string) => {
    if (!currentUser?.companyId) {
      throw new Error('No company ID found');
    }

    try {
      // Find all documents with this category and item name
      const relatedDefinitions = productDefinitions.filter(def => 
        def.productCategory === categoryName && 
        def.itemName === oldItemName && 
        def.companyId === currentUser.companyId
      );

      // Update all related documents
      const updatePromises = relatedDefinitions.map(def => 
        updateDoc(doc(db, 'product_definitions', def.id), { 
          itemName: newItemName.trim(),
          updatedAt: new Date()
        })
      );

      await Promise.all(updatePromises);
      await fetchProductDefinitions(); // Refresh the list
    } catch (err) {
      console.error('Error updating item name for all versions:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to update item name for all versions');
    }
  };

  return { 
    productDefinitions, 
    loading, 
    error, 
    addProductDefinition, 
    updateProductDefinition, 
    deleteProductDefinition,
    deleteCategoryAndAllRelated,
    deleteItemNameAndAllVersions,
    updateCategoryForAllRelated,
    updateItemNameForAllVersions,
    refreshDefinitions: fetchProductDefinitions
  };
};

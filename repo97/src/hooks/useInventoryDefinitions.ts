import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export interface InventoryDefinition {
  id: string;
  productCategory: string;
  itemName: string;
  productVersion: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export const useInventoryDefinitions = () => {
  const [inventoryDefinitions, setInventoryDefinitions] = useState<InventoryDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const fetchInventoryDefinitions = useCallback(async () => {
    if (!currentUser?.companyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const q = query(
        collection(db, 'inventory_definitions'),
        where('companyId', '==', currentUser.companyId)
      );
      
      const snapshot = await getDocs(q);
      
      const definitions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          productCategory: data.productCategory,
          itemName: data.itemName,
          productVersion: data.productVersion,
          companyId: data.companyId,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      }) as InventoryDefinition[];

      // Sort definitions on frontend
      const sortedDefinitions = definitions.sort((a, b) => {
        const categoryCompare = (a.productCategory || '').localeCompare(b.productCategory || '');
        if (categoryCompare !== 0) return categoryCompare;
        
        const nameCompare = (a.itemName || '').localeCompare(b.itemName || '');
        if (nameCompare !== 0) return nameCompare;
        
        return (a.productVersion || '').localeCompare(b.productVersion || '');
      });

      setInventoryDefinitions(sortedDefinitions);
      setError(null);
    } catch (err) {
      console.error('Error fetching inventory definitions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory definitions');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.companyId]);

  useEffect(() => {
    fetchInventoryDefinitions();
  }, [fetchInventoryDefinitions]);

  const addInventoryDefinition = async (definition: Omit<InventoryDefinition, 'id' | 'createdAt' | 'updatedAt' | 'companyId'>) => {
    if (!currentUser?.companyId) {
      throw new Error('No company ID found');
    }

    try {
      // Check if this exact combination already exists
      const existing = inventoryDefinitions.find(id => 
        id.productCategory === definition.productCategory &&
        id.itemName === definition.itemName &&
        id.productVersion === definition.productVersion
      );

      if (existing) {
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

      await addDoc(collection(db, 'inventory_definitions'), newDefinition);
      await fetchInventoryDefinitions();
    } catch (err) {
      console.error('Error creating inventory definition:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to create inventory definition');
    }
  };

  const updateInventoryDefinition = async (id: string, updates: Partial<Omit<InventoryDefinition, 'id' | 'companyId' | 'createdAt'>>) => {
    try {
      const docRef = doc(db, 'inventory_definitions', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date(),
      });
      await fetchInventoryDefinitions();
    } catch (err) {
      console.error('Error updating inventory definition:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to update inventory definition');
    }
  };

  const deleteInventoryDefinition = async (id: string) => {
    try {
      const docRef = doc(db, 'inventory_definitions', id);
      await deleteDoc(docRef);
      await fetchInventoryDefinitions();
    } catch (err) {
      console.error('Error deleting inventory definition:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to delete inventory definition');
    }
  };

  const deleteCategoryAndAllRelated = async (categoryName: string) => {
    if (!currentUser?.companyId) {
      throw new Error('No company ID found');
    }

    try {
      const relatedDefinitions = inventoryDefinitions.filter(def => 
        def.productCategory === categoryName && def.companyId === currentUser.companyId
      );

      const deletePromises = relatedDefinitions.map(def => 
        deleteDoc(doc(db, 'inventory_definitions', def.id))
      );

      await Promise.all(deletePromises);
      await fetchInventoryDefinitions();
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
      const relatedDefinitions = inventoryDefinitions.filter(def => 
        def.productCategory === categoryName && 
        def.itemName === itemName && 
        def.companyId === currentUser.companyId
      );

      const deletePromises = relatedDefinitions.map(def => 
        deleteDoc(doc(db, 'inventory_definitions', def.id))
      );

      await Promise.all(deletePromises);
      await fetchInventoryDefinitions();
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
      const relatedDefinitions = inventoryDefinitions.filter(def => 
        def.productCategory === oldCategoryName && def.companyId === currentUser.companyId
      );

      const updatePromises = relatedDefinitions.map(def => 
        updateDoc(doc(db, 'inventory_definitions', def.id), { 
          productCategory: newCategoryName.trim(),
          updatedAt: new Date()
        })
      );

      await Promise.all(updatePromises);
      await fetchInventoryDefinitions();
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
      const relatedDefinitions = inventoryDefinitions.filter(def => 
        def.productCategory === categoryName && 
        def.itemName === oldItemName && 
        def.companyId === currentUser.companyId
      );

      const updatePromises = relatedDefinitions.map(def => 
        updateDoc(doc(db, 'inventory_definitions', def.id), { 
          itemName: newItemName.trim(),
          updatedAt: new Date()
        })
      );

      await Promise.all(updatePromises);
      await fetchInventoryDefinitions();
    } catch (err) {
      console.error('Error updating item name for all versions:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to update item name for all versions');
    }
  };

  return { 
    inventoryDefinitions, 
    loading, 
    error, 
    addInventoryDefinition, 
    updateInventoryDefinition, 
    deleteInventoryDefinition,
    deleteCategoryAndAllRelated,
    deleteItemNameAndAllVersions,
    updateCategoryForAllRelated,
    updateItemNameForAllVersions,
    refreshDefinitions: fetchInventoryDefinitions
  };
};
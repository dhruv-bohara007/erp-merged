
import { useState, useEffect } from 'react';
import { useInventory } from './useFirestore';

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
  const { inventory, loading: inventoryLoading, updateInventoryItem, deleteInventoryItem } = useInventory();

  useEffect(() => {
    console.log('useProductDefinitions: Deriving from inventory data');
    
    if (inventoryLoading) {
      setLoading(true);
      return;
    }

    try {
      // Extract unique combinations of category, name, and version from inventory
      const uniqueDefinitions = new Map();
      
      inventory.forEach(item => {
        if (item.productCategory && item.itemName && item.productVersion) {
          const key = `${item.productCategory}-${item.itemName}-${item.productVersion}`;
          if (!uniqueDefinitions.has(key)) {
            uniqueDefinitions.set(key, {
              id: `${item.productCategory}-${item.itemName}-${item.productVersion}`.replace(/\s+/g, '-').toLowerCase(),
              category: item.productCategory,
              name: item.itemName,
              version: item.productVersion,
              companyId: item.companyId || '',
              createdAt: item.createdAt || new Date(),
              updatedAt: item.updatedAt || new Date(),
            });
          }
        }
      });

      const definitionData = Array.from(uniqueDefinitions.values());
      
      // Sort by category, then name, then version
      definitionData.sort((a, b) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        if (a.name !== b.name) return a.name.localeCompare(b.name);
        return a.version.localeCompare(b.version);
      });
      
      console.log('Final sorted product definitions from inventory:', definitionData);
      setProductDefinitions(definitionData);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error processing inventory data:', err);
      setError(err instanceof Error ? err.message : 'Failed to process inventory data');
      setLoading(false);
    }
  }, [inventory, inventoryLoading]);

  const addProductDefinition = async (definition: Omit<ProductDefinition, 'id' | 'createdAt' | 'updatedAt' | 'companyId'>) => {
    console.log('Product definition added to local state only:', definition);
    // Note: This no longer creates inventory items automatically
    // Products will only be added to inventory when explicitly added through the Add Product form
    return Promise.resolve();
  };

  const updateProductDefinition = async (id: string, updates: Partial<ProductDefinition>) => {
    console.log('Updating product definition:', id, 'with updates:', updates);
    
    try {
      // Find inventory items that match the old definition
      const matchingItems = inventory.filter(item => 
        `${item.productCategory}-${item.itemName}-${item.productVersion}`.replace(/\s+/g, '-').toLowerCase() === id
      );

      // Update all matching inventory items
      const updatePromises = matchingItems.map(item => 
        updateInventoryItem(item.id, {
          productCategory: updates.category || item.productCategory,
          itemName: updates.name || item.itemName,
          productVersion: updates.version || item.productVersion,
        })
      );

      await Promise.all(updatePromises);
      console.log('Product definition updated successfully');
    } catch (err) {
      console.error('Error updating product definition:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to update product definition');
    }
  };

  const deleteProductDefinition = async (id: string) => {
    console.log('Deleting product definition:', id);
    
    try {
      // Find inventory items that match the definition
      const matchingItems = inventory.filter(item => 
        `${item.productCategory}-${item.itemName}-${item.productVersion}`.replace(/\s+/g, '-').toLowerCase() === id
      );

      // Delete all matching inventory items
      const deletePromises = matchingItems.map(item => deleteInventoryItem(item.id));
      await Promise.all(deletePromises);
      
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

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import type { StockDetailsData } from '@/types/firestore';
import type { InvoiceItem } from '@/hooks/useFirestore';

export interface StockValidationResult {
  isValid: boolean;
  insufficientStockItems: Array<{
    itemName: string;
    productCategory: string;
    productVersion: string;
    requiredQuantity: number;
    availableStock: number;
    unit: string;
  }>;
  message?: string;
}

export class InvoiceStockService {
  
  /**
   * Validates if all stock items have sufficient quantity for the invoice
   */
  static async validateStockAvailability(
    companyId: string, 
    items: InvoiceItem[]
  ): Promise<StockValidationResult> {
    try {
      const insufficientStockItems: StockValidationResult['insufficientStockItems'] = [];
      
      // Get all stock items that are used in the invoice
      const stockItemsToCheck = items.filter(item => item.sourceType === 'stock');
      
      if (stockItemsToCheck.length === 0) {
        return {
          isValid: true,
          insufficientStockItems: []
        };
      }
      
      // Query stock details for validation
      const stockDetailsRef = collection(db, 'stock_details');
      const stockQuery = query(
        stockDetailsRef,
        where('companyId', '==', companyId)
      );
      
      const stockSnapshot = await getDocs(stockQuery);
      const stockDetails = stockSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StockDetailsData[];
      
      // Check each stock item
      for (const item of stockItemsToCheck) {
        const stockItem = stockDetails.find(stock => 
          stock.productCategory === item.productCategory &&
          stock.itemName === item.itemName &&
          stock.productVersion === item.productVersion
        );
        
        if (!stockItem) {
          insufficientStockItems.push({
            itemName: item.itemName || '',
            productCategory: item.productCategory || '',
            productVersion: item.productVersion || '',
            requiredQuantity: item.quantity || 0,
            availableStock: 0,
            unit: item.unit || 'pcs'
          });
          continue;
        }
        
        const availableStock = stockItem.currentStock || 0;
        const requiredQuantity = item.quantity || 0;
        
        if (availableStock < requiredQuantity) {
          insufficientStockItems.push({
            itemName: item.itemName || '',
            productCategory: item.productCategory || '',
            productVersion: item.productVersion || '',
            requiredQuantity,
            availableStock,
            unit: stockItem.unit || 'pcs'
          });
        }
      }
      
      const isValid = insufficientStockItems.length === 0;
      
      return {
        isValid,
        insufficientStockItems,
        message: isValid 
          ? 'All stock items have sufficient quantity' 
          : 'Some items have insufficient stock'
      };
      
    } catch (error) {
      console.error('Error validating stock availability:', error);
      return {
        isValid: false,
        insufficientStockItems: [],
        message: 'Failed to validate stock availability'
      };
    }
  }
  
  /**
   * Updates stock quantities when an invoice is created
   */
  static async updateStockOnInvoiceCreation(
    companyId: string, 
    items: InvoiceItem[]
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Get stock items that need to be updated
      const stockItemsToUpdate = items.filter(item => item.sourceType === 'stock');
      
      if (stockItemsToUpdate.length === 0) {
        return;
      }
      
      // Query all relevant stock details
      const stockDetailsRef = collection(db, 'stock_details');
      const stockQuery = query(
        stockDetailsRef,
        where('companyId', '==', companyId)
      );
      
      const stockSnapshot = await getDocs(stockQuery);
      const stockDetails = stockSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StockDetailsData[];
      
      // Update each stock item
      for (const item of stockItemsToUpdate) {
        const stockItem = stockDetails.find(stock => 
          stock.productCategory === item.productCategory &&
          stock.itemName === item.itemName &&
          stock.productVersion === item.productVersion
        );
        
        if (stockItem) {
          const currentStock = stockItem.currentStock || 0;
          const quantityUsed = item.quantity || 0;
          const newStock = Math.max(0, currentStock - quantityUsed);
          
          const stockRef = doc(db, 'stock_details', stockItem.id);
          batch.update(stockRef, {
            currentStock: newStock,
            updatedAt: new Date()
          });
        }
      }
      
      await batch.commit();
      console.log('Stock updated successfully for invoice creation');
      
    } catch (error) {
      console.error('Error updating stock on invoice creation:', error);
      throw error;
    }
  }
  
  /**
   * Restores stock quantities when an invoice is deleted
   */
  static async restoreStockOnInvoiceDeletion(
    companyId: string, 
    items: InvoiceItem[]
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Get stock items that need to be restored
      const stockItemsToRestore = items.filter(item => item.sourceType === 'stock');
      
      if (stockItemsToRestore.length === 0) {
        return;
      }
      
      // Query all relevant stock details
      const stockDetailsRef = collection(db, 'stock_details');
      const stockQuery = query(
        stockDetailsRef,
        where('companyId', '==', companyId)
      );
      
      const stockSnapshot = await getDocs(stockQuery);
      const stockDetails = stockSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StockDetailsData[];
      
      // Restore each stock item
      for (const item of stockItemsToRestore) {
        const stockItem = stockDetails.find(stock => 
          stock.productCategory === item.productCategory &&
          stock.itemName === item.itemName &&
          stock.productVersion === item.productVersion
        );
        
        if (stockItem) {
          const currentStock = stockItem.currentStock || 0;
          const quantityToRestore = item.quantity || 0;
          const newStock = currentStock + quantityToRestore;
          
          const stockRef = doc(db, 'stock_details', stockItem.id);
          batch.update(stockRef, {
            currentStock: newStock,
            updatedAt: new Date()
          });
        }
      }
      
      await batch.commit();
      console.log('Stock restored successfully for invoice deletion');
      
    } catch (error) {
      console.error('Error restoring stock on invoice deletion:', error);
      throw error;
    }
  }

  /**
   * Gets the current stock information for a specific product
   */
  static async getStockInfo(
    companyId: string,
    productCategory: string,
    itemName: string,
    productVersion: string
  ): Promise<StockDetailsData | null> {
    try {
      const stockDetailsRef = collection(db, 'stock_details');
      const stockQuery = query(
        stockDetailsRef,
        where('companyId', '==', companyId),
        where('productCategory', '==', productCategory),
        where('itemName', '==', itemName),
        where('productVersion', '==', productVersion)
      );
      
      const stockSnapshot = await getDocs(stockQuery);
      
      if (stockSnapshot.empty) {
        return null;
      }
      
      const stockDoc = stockSnapshot.docs[0];
      return {
        id: stockDoc.id,
        ...stockDoc.data()
      } as StockDetailsData;
      
    } catch (error) {
      console.error('Error getting stock info:', error);
      return null;
    }
  }
}
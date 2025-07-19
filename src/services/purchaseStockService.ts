import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import type { StockDetailsData, Expense } from '@/types/firestore';

export class PurchaseStockService {
  
  /**
   * Updates stock when a purchase record is added
   */
  static async updateStockOnPurchase(purchaseRecord: Expense, companyId: string): Promise<void> {
    if (!purchaseRecord.productCategory || !purchaseRecord.itemName || !purchaseRecord.productVersion) {
      console.warn('Missing product details for stock update');
      return;
    }

    try {
      const stockDetailsRef = collection(db, 'stock_details');
      const q = query(
        stockDetailsRef,
        where('companyId', '==', companyId),
        where('productCategory', '==', purchaseRecord.productCategory),
        where('itemName', '==', purchaseRecord.itemName),
        where('productVersion', '==', purchaseRecord.productVersion)
      );

      const snapshot = await getDocs(q);
      const quantity = purchaseRecord.quantity || 0;

      if (snapshot.empty) {
        // Create new stock record if none exists
        await addDoc(stockDetailsRef, {
          companyId,
          productCategory: purchaseRecord.productCategory,
          itemName: purchaseRecord.itemName,
          productVersion: purchaseRecord.productVersion,
          currentStock: quantity,
          lastPurchaseDate: purchaseRecord.purchaseDate || new Date(),
          unit: purchaseRecord.unit || 'pcs',
          pricePerUnit: purchaseRecord.pricePerUnit || 0,
          minRequired: 0,
          safeQuantityLimit: 0,
          displayStatus: 'displayed',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        // Update existing stock record
        const stockDoc = snapshot.docs[0];
        const currentData = stockDoc.data() as StockDetailsData;
        
        await updateDoc(doc(db, 'stock_details', stockDoc.id), {
          currentStock: currentData.currentStock + quantity,
          lastPurchaseDate: purchaseRecord.purchaseDate || new Date(),
          pricePerUnit: purchaseRecord.pricePerUnit || currentData.pricePerUnit || 0,
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error updating stock on purchase:', error);
      throw error;
    }
  }

  /**
   * Updates stock when a purchase record is deleted
   */
  static async updateStockOnPurchaseDelete(purchaseRecord: Expense, companyId: string): Promise<void> {
    if (!purchaseRecord.productCategory || !purchaseRecord.itemName || !purchaseRecord.productVersion) {
      console.warn('Missing product details for stock update');
      return;
    }

    try {
      const stockDetailsRef = collection(db, 'stock_details');
      const q = query(
        stockDetailsRef,
        where('companyId', '==', companyId),
        where('productCategory', '==', purchaseRecord.productCategory),
        where('itemName', '==', purchaseRecord.itemName),
        where('productVersion', '==', purchaseRecord.productVersion)
      );

      const snapshot = await getDocs(q);
      const quantity = purchaseRecord.quantity || 0;

      if (!snapshot.empty) {
        const stockDoc = snapshot.docs[0];
        const currentData = stockDoc.data() as StockDetailsData;
        
        // Subtract quantity but ensure stock doesn't go below 0
        const newStock = Math.max(0, currentData.currentStock - quantity);
        
        await updateDoc(doc(db, 'stock_details', stockDoc.id), {
          currentStock: newStock,
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error updating stock on purchase delete:', error);
      throw error;
    }
  }

  /**
   * Recalculates stock based on all purchase records for a specific product
   */
  static async recalculateStock(
    companyId: string, 
    productCategory: string, 
    itemName: string, 
    productVersion: string
  ): Promise<void> {
    try {
      // Get all purchase records for this product
      const purchasesRef = collection(db, 'purchase_records');
      const purchasesQuery = query(
        purchasesRef,
        where('companyId', '==', companyId),
        where('productCategory', '==', productCategory),
        where('itemName', '==', itemName),
        where('productVersion', '==', productVersion)
      );

      const purchasesSnapshot = await getDocs(purchasesQuery);
      
      // Calculate total quantity from all purchase records
      let totalStock = 0;
      purchasesSnapshot.docs.forEach(doc => {
        const purchase = doc.data() as Expense;
        totalStock += purchase.quantity || 0;
      });

      // Update or create stock record
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
        // Create new stock record
        await addDoc(stockDetailsRef, {
          companyId,
          productCategory,
          itemName,
          productVersion,
          currentStock: totalStock,
          lastPurchaseDate: new Date(),
          unit: 'pcs',
          minRequired: 0,
          safeQuantityLimit: 0,
          displayStatus: 'displayed',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        // Update existing stock record
        const stockDoc = stockSnapshot.docs[0];
        await updateDoc(doc(db, 'stock_details', stockDoc.id), {
          currentStock: totalStock,
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error recalculating stock:', error);
      throw error;
    }
  }
}
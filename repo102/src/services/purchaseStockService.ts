import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import type { StockDetailsData, Expense } from '@/types/firestore';

export class PurchaseStockService {
  
  /**
   * Updates stock when a purchase record is added
   */
  static async updateStockOnPurchase(purchaseRecord: Expense, companyId: string): Promise<void> {
    try {
      console.log('=== PURCHASE STOCK UPDATE START ===');
      console.log('Purchase record ID:', purchaseRecord.id);
      console.log('Company ID:', companyId);
      console.log('Total items in purchase:', purchaseRecord.items?.length || 0);
      
      // Handle purchase records with items array (multiple items)
      if (purchaseRecord.items && purchaseRecord.items.length > 0) {
        console.log('Processing items array with', purchaseRecord.items.length, 'items');
        for (let i = 0; i < purchaseRecord.items.length; i++) {
          const item = purchaseRecord.items[i];
          console.log(`Processing item ${i + 1}/${purchaseRecord.items.length}:`, {
            itemName: item.itemName,
            productCategory: item.productCategory,
            productVersion: item.productVersion,
            quantity: item.quantity
          });
          
          await this.updateStockForPurchaseItem(companyId, {
            productCategory: item.productCategory,
            itemName: item.itemName,
            productVersion: item.productVersion,
            quantity: item.quantity,
            unit: item.unit || 'pcs',
            pricePerUnit: item.pricePerUnit || 0,
            purchaseDate: purchaseRecord.purchaseDate || new Date()
          });
        }
      }
      // Handle single-item purchase records (backwards compatibility)
      else if (purchaseRecord.productCategory && purchaseRecord.itemName && purchaseRecord.productVersion) {
        await this.updateStockForPurchaseItem(companyId, {
          productCategory: purchaseRecord.productCategory,
          itemName: purchaseRecord.itemName,
          productVersion: purchaseRecord.productVersion,
          quantity: purchaseRecord.quantity || 0,
          unit: purchaseRecord.unit || 'pcs',
          pricePerUnit: purchaseRecord.pricePerUnit || 0,
          purchaseDate: purchaseRecord.purchaseDate || new Date()
        });
      } else {
        console.warn('Missing product details for stock update');
      }
    } catch (error) {
      console.error('Error updating stock on purchase:', error);
      throw error;
    }
  }

  /**
   * Helper method to update stock for a single purchase item
   */
  private static async updateStockForPurchaseItem(
    companyId: string,
    item: {
      productCategory: string;
      itemName: string;
      productVersion: string;
      quantity: number;
      unit: string;
      pricePerUnit: number;
      purchaseDate: Date;
    }
  ): Promise<void> {
    console.log(`--- Updating stock for item: ${item.itemName} ---`);
    console.log('Item details:', item);
    
    const stockDetailsRef = collection(db, 'stock_details');
    const q = query(
      stockDetailsRef,
      where('companyId', '==', companyId),
      where('productCategory', '==', item.productCategory),
      where('itemName', '==', item.itemName),
      where('productVersion', '==', item.productVersion)
    );

    const snapshot = await getDocs(q);
    console.log('Found existing stock records:', snapshot.docs.length);

    if (snapshot.empty) {
      console.log('Creating new stock record with quantity:', item.quantity);
      // Create new stock record if none exists
      await addDoc(stockDetailsRef, {
        companyId,
        productCategory: item.productCategory,
        itemName: item.itemName,
        productVersion: item.productVersion,
        currentStock: item.quantity,
        lastPurchaseDate: item.purchaseDate,
        unit: item.unit,
        pricePerUnit: item.pricePerUnit,
        minRequired: 0,
        safeQuantityLimit: 0,
        displayStatus: 'displayed',
        lastRequestStatus: 'Order Recorded',
        lastRecordedOrderQuantity: item.quantity,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('New stock record created');
    } else {
      // Update existing stock record
      const stockDoc = snapshot.docs[0];
      const currentData = stockDoc.data() as StockDetailsData;
      
      console.log('Current stock before update:', currentData.currentStock);
      console.log('Adding quantity:', item.quantity);
      console.log('New stock will be:', currentData.currentStock + item.quantity);
      
      await updateDoc(doc(db, 'stock_details', stockDoc.id), {
        currentStock: currentData.currentStock + item.quantity,
        lastPurchaseDate: item.purchaseDate,
        pricePerUnit: item.pricePerUnit,
        lastRequestStatus: 'Order Recorded',
        lastRecordedOrderQuantity: item.quantity,
        updatedAt: new Date()
      });
      console.log('Stock record updated successfully');
    }
    console.log(`--- Finished updating stock for item: ${item.itemName} ---`);
  }

  /**
   * Updates stock when a purchase record is deleted
   */
  static async updateStockOnPurchaseDelete(purchaseRecord: Expense, companyId: string): Promise<void> {
    try {
      // Handle purchase records with items array (multiple items)
      if (purchaseRecord.items && purchaseRecord.items.length > 0) {
        for (const item of purchaseRecord.items) {
          await this.updateStockForItem(companyId, {
            productCategory: item.productCategory,
            itemName: item.itemName,
            productVersion: item.productVersion,
            quantity: item.quantity
          });
        }
      } 
      // Handle single-item purchase records (backwards compatibility)
      else if (purchaseRecord.productCategory && purchaseRecord.itemName && purchaseRecord.productVersion) {
        await this.updateStockForItem(companyId, {
          productCategory: purchaseRecord.productCategory,
          itemName: purchaseRecord.itemName,
          productVersion: purchaseRecord.productVersion,
          quantity: purchaseRecord.quantity || 0
        });
      } else {
        console.warn('Missing product details for stock update');
      }
    } catch (error) {
      console.error('Error updating stock on purchase delete:', error);
      throw error;
    }
  }

  /**
   * Helper method to update stock for a single item
   */
  private static async updateStockForItem(
    companyId: string, 
    item: { productCategory: string; itemName: string; productVersion: string; quantity: number }
  ): Promise<void> {
    const stockDetailsRef = collection(db, 'stock_details');
    const q = query(
      stockDetailsRef,
      where('companyId', '==', companyId),
      where('productCategory', '==', item.productCategory),
      where('itemName', '==', item.itemName),
      where('productVersion', '==', item.productVersion)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const stockDoc = snapshot.docs[0];
      const currentData = stockDoc.data() as StockDetailsData;
      
      // Subtract quantity but ensure stock doesn't go below 0
      const newStock = Math.max(0, currentData.currentStock - item.quantity);
      
      await updateDoc(doc(db, 'stock_details', stockDoc.id), {
        currentStock: newStock,
        updatedAt: new Date()
      });
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
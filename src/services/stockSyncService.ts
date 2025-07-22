
import { collection, getDocs, query, where, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface StockSyncResult {
  success: boolean;
  message: string;
  processedProducts: number;
  errors?: string[];
}

// Sync stock details with purchase records
export const syncStockDetails = async (companyId: string): Promise<StockSyncResult> => {
  try {
    const batch = writeBatch(db);
    let processedProducts = 0;

    // Get all purchase records for the company
    const purchaseRecordsQuery = query(
      collection(db, 'purchase_records'),
      where('companyId', '==', companyId)
    );
    const purchaseRecordsSnapshot = await getDocs(purchaseRecordsQuery);

    // Get all stock details for the company
    const stockDetailsQuery = query(
      collection(db, 'stock_details'),
      where('companyId', '==', companyId)
    );
    const stockDetailsSnapshot = await getDocs(stockDetailsQuery);

    // Process each purchase record
    purchaseRecordsSnapshot.docs.forEach(purchaseDoc => {
      const purchaseData = purchaseDoc.data();
      
      // Find matching stock detail
      const matchingStockDoc = stockDetailsSnapshot.docs.find(stockDoc => {
        const stockData = stockDoc.data();
        return stockData.productCategory === purchaseData.productCategory &&
               stockData.itemName === purchaseData.itemName &&
               stockData.productVersion === purchaseData.productVersion;
      });

      if (matchingStockDoc) {
        const stockData = matchingStockDoc.data();
        const newStock = (stockData.currentStock || 0) + (purchaseData.quantity || 0);
        
        const stockRef = doc(db, 'stock_details', matchingStockDoc.id);
        batch.update(stockRef, {
          currentStock: newStock,
          lastPurchaseDate: purchaseData.purchaseDate || new Date(),
          pricePerUnit: purchaseData.pricePerUnit || stockData.pricePerUnit,
          updatedAt: new Date(),
          // Clear request status fields after stock update
          lastRequestStatus: null,
          pendingQuantity: 0,
          approvedQuantity: 0,
          poCreatedQuantity: 0,
          rejectedQuantity: 0
        });
        
        processedProducts++;
      }
    });

    await batch.commit();

    return {
      success: true,
      message: `Successfully synced ${processedProducts} products with stock details`,
      processedProducts
    };
  } catch (error) {
    console.error('Error syncing stock details:', error);
    return {
      success: false,
      message: 'Failed to sync stock details',
      processedProducts: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
};

// Sync purchase request status with stock details
export const syncPurchaseRequestStatus = async (
  companyId: string,
  productCategory: string,
  itemName: string,
  productVersion: string,
  status: string,
  quantityRequired: number,
  oldQuantityRequired?: number
): Promise<void> => {
  try {
    // Find the matching stock detail
    const stockDetailsQuery = query(
      collection(db, 'stock_details'),
      where('companyId', '==', companyId),
      where('productCategory', '==', productCategory),
      where('itemName', '==', itemName),
      where('productVersion', '==', productVersion)
    );
    
    const stockDetailsSnapshot = await getDocs(stockDetailsQuery);
    
    if (!stockDetailsSnapshot.empty) {
      const stockDoc = stockDetailsSnapshot.docs[0];
      const stockData = stockDoc.data();
      
      // Calculate new pending quantity
      let newPendingQuantity = stockData.pendingQuantity || 0;
      
      // If quantity changed, update pending quantity
      if (oldQuantityRequired !== undefined && oldQuantityRequired !== quantityRequired) {
        newPendingQuantity = newPendingQuantity - oldQuantityRequired + quantityRequired;
      }
      
      // Update quantities based on status
      let approvedQuantity = stockData.approvedQuantity || 0;
      let poCreatedQuantity = stockData.poCreatedQuantity || 0;
      let rejectedQuantity = stockData.rejectedQuantity || 0;
      
      // If status changed from pending to approved/rejected/po_created
      if (status === 'approved') {
        newPendingQuantity = Math.max(0, newPendingQuantity - quantityRequired);
        approvedQuantity += quantityRequired;
      } else if (status === 'rejected') {
        newPendingQuantity = Math.max(0, newPendingQuantity - quantityRequired);
        rejectedQuantity += quantityRequired;
      } else if (status === 'PO Created') {
        // Set poCreatedQuantity to current approvedQuantity when PO is created
        poCreatedQuantity = approvedQuantity;
      }
      
      const stockRef = doc(db, 'stock_details', stockDoc.id);
      await updateDoc(stockRef, {
        lastRequestStatus: status,
        pendingQuantity: newPendingQuantity,
        approvedQuantity: approvedQuantity,
        poCreatedQuantity: poCreatedQuantity,
        rejectedQuantity: rejectedQuantity,
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error syncing purchase request status:', error);
    throw error;
  }
};

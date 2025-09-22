import { db } from '@/lib/firebase';
import { doc, getDoc, deleteDoc, collection, query, where, getDocs, updateDoc, writeBatch } from 'firebase/firestore';

export interface PurchaseOrderItem {
  productCategory: string;
  itemName: string;
  productVersion: string;
  quantityRequired: number;
  pricePerUnit: number;
  unit: string;
}

export interface PurchaseOrderData {
  id: string;
  companyId: string;
  items: PurchaseOrderItem[];
  // ... other PO fields
}

/**
 * Deletes a purchase order and rolls back related data in purchase_requests and stock_details
 */
export const deletePurchaseOrderWithRollback = async (orderId: string): Promise<void> => {
  try {
    // Step 1: Get the PO document to access its items
    const poDoc = await getDoc(doc(db, 'purchase_orders', orderId));
    
    if (!poDoc.exists()) {
      throw new Error('Purchase order not found');
    }
    
    const poData = poDoc.data() as PurchaseOrderData;
    const batch = writeBatch(db);
    
    // Step 2: Process each item in the PO for rollback
    for (const item of poData.items || []) {
      // Update purchase_requests: Set status back to "approved"
      const purchaseRequestsQuery = query(
        collection(db, 'purchase_requests'),
        where('companyId', '==', poData.companyId),
        where('productCategory', '==', item.productCategory),
        where('itemName', '==', item.itemName),
        where('productVersion', '==', item.productVersion)
      );
      
      const purchaseRequestsSnapshot = await getDocs(purchaseRequestsQuery);
      purchaseRequestsSnapshot.docs.forEach(requestDoc => {
        const requestRef = doc(db, 'purchase_requests', requestDoc.id);
        batch.update(requestRef, {
          status: 'approved',
          updatedAt: new Date()
        });
      });
      
      // Update stock_details: Reset lastRequestStatus and poCreatedQuantity
      const stockDetailsQuery = query(
        collection(db, 'stock_details'),
        where('companyId', '==', poData.companyId),
        where('productCategory', '==', item.productCategory),
        where('itemName', '==', item.itemName),
        where('productVersion', '==', item.productVersion)
      );
      
      const stockDetailsSnapshot = await getDocs(stockDetailsQuery);
      stockDetailsSnapshot.docs.forEach(stockDoc => {
        const stockRef = doc(db, 'stock_details', stockDoc.id);
        batch.update(stockRef, {
          lastRequestStatus: 'approved',
          poCreatedQuantity: 0,
          updatedAt: new Date()
        });
      });
    }
    
    // Step 3: Delete the PO document
    const poRef = doc(db, 'purchase_orders', orderId);
    batch.delete(poRef);
    
    // Commit all changes
    await batch.commit();
    
    console.log('Purchase order deleted and rollback completed successfully');
  } catch (error) {
    console.error('Error deleting purchase order with rollback:', error);
    throw error;
  }
};

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';

export interface StockSyncResult {
  success: boolean;
  message: string;
  processedProducts: number;
  errors?: string[];
}

export interface ProductKey {
  productCategory: string;
  itemName: string;
  productVersion: string;
  unit: string;
}

export interface StockData {
  productCategory: string;
  itemName: string;
  productVersion: string;
  unit: string;
  totalQuantity: number;
  inventoryQuantity: number;
  purchaseQuantity: number;
  lastUpdated: Date;
}

export const syncStockDetails = async (companyId: string): Promise<StockSyncResult> => {
  try {
    // Query inventory collection
    const inventoryQuery = query(
      collection(db, 'inventory'),
      where('companyId', '==', companyId)
    );
    const inventorySnapshot = await getDocs(inventoryQuery);

    // Query purchase_records collection
    const purchaseQuery = query(
      collection(db, 'purchase_records'),
      where('companyId', '==', companyId)
    );
    const purchaseSnapshot = await getDocs(purchaseQuery);

    // Create a map to aggregate quantities by product key
    const productMap = new Map<string, StockData>();

    // Process inventory records
    inventorySnapshot.forEach((doc) => {
      const data = doc.data();
      const key = `${data.productCategory}|${data.itemName}|${data.productVersion}|${data.unit}`;
      
      if (productMap.has(key)) {
        const existing = productMap.get(key)!;
        existing.inventoryQuantity += data.quantity || 0;
        existing.totalQuantity += data.quantity || 0;
      } else {
        productMap.set(key, {
          productCategory: data.productCategory,
          itemName: data.itemName,
          productVersion: data.productVersion,
          unit: data.unit,
          totalQuantity: data.quantity || 0,
          inventoryQuantity: data.quantity || 0,
          purchaseQuantity: 0,
          lastUpdated: new Date()
        });
      }
    });

    // Process purchase records
    purchaseSnapshot.forEach((doc) => {
      const data = doc.data();
      const key = `${data.productCategory}|${data.itemName}|${data.productVersion}|${data.unit}`;
      
      if (productMap.has(key)) {
        const existing = productMap.get(key)!;
        existing.purchaseQuantity += data.quantity || 0;
        existing.totalQuantity += data.quantity || 0;
      } else {
        productMap.set(key, {
          productCategory: data.productCategory,
          itemName: data.itemName,
          productVersion: data.productVersion,
          unit: data.unit,
          totalQuantity: data.quantity || 0,
          inventoryQuantity: 0,
          purchaseQuantity: data.quantity || 0,
          lastUpdated: new Date()
        });
      }
    });

    // Batch write to stock_details collection
    const batch = writeBatch(db);
    let processedProducts = 0;

    productMap.forEach((stockData, key) => {
      const docId = `${companyId}_${key}`;
      const stockRef = doc(db, 'stock_details', docId);
      
      batch.set(stockRef, {
        ...stockData,
        companyId,
        id: docId
      });
      
      processedProducts++;
    });

    await batch.commit();

    return {
      success: true,
      message: `Successfully synchronized ${processedProducts} products`,
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
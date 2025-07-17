import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, setDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { StockDetailsData, InventoryItem, Expense } from '../types/firestore';

export const useStockAggregation = () => {
  const [stockDetails, setStockDetails] = useState<StockDetailsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser?.companyId) {
      setStockDetails([]);
      setLoading(false);
      return;
    }

    const inventoryQuery = query(
      collection(db, 'inventory'),
      where('companyId', '==', currentUser.companyId)
    );

    const purchaseRecordsQuery = query(
      collection(db, 'purchase_records'),
      where('companyId', '==', currentUser.companyId)
    );

    const stockDetailsQuery = query(
      collection(db, 'stock_details'),
      where('companyId', '==', currentUser.companyId)
    );

    let inventoryData: InventoryItem[] = [];
    let purchaseRecordsData: Expense[] = [];
    let currentStockDetails: StockDetailsData[] = [];

    // Listen to inventory changes
    const unsubscribeInventory = onSnapshot(inventoryQuery, (snapshot) => {
      inventoryData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as InventoryItem[];
      
      aggregateStockData();
    });

    // Listen to purchase records changes
    const unsubscribePurchaseRecords = onSnapshot(purchaseRecordsQuery, (snapshot) => {
      purchaseRecordsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        expenseDate: doc.data().expenseDate?.toDate(),
        purchaseDate: doc.data().purchaseDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Expense[];
      
      aggregateStockData();
    });

    // Listen to stock details changes
    const unsubscribeStockDetails = onSnapshot(stockDetailsQuery, (snapshot) => {
      currentStockDetails = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as StockDetailsData[];
      
      setStockDetails(currentStockDetails);
    });

    const aggregateStockData = async () => {
      try {
        const stockData: Record<string, StockDetailsData> = {};

        // Process inventory items
        inventoryData.forEach(item => {
          if (item.status === 'active' && item.quantity && item.quantity > 0) {
            const key = `${item.productCategory || 'Uncategorized'}-${item.itemName || 'Unknown'}-${item.productVersion || 'N/A'}`;
            
            if (!stockData[key]) {
              stockData[key] = {
                id: key,
                companyId: currentUser.companyId,
                productCategory: item.productCategory || 'Uncategorized',
                itemName: item.itemName || 'Unknown',
                productVersion: item.productVersion || 'N/A',
                currentStock: 0,
                unit: item.unit || 'pcs',
                minRequired: 0,
                safeQuantityLimit: 0,
                displayStatus: 'displayed',
                createdAt: new Date(),
                updatedAt: new Date()
              };
            }

            stockData[key].currentStock += item.quantity || 0;
            stockData[key].updatedAt = new Date();
          }
        });

        // Process purchase records items
        purchaseRecordsData.forEach(purchase => {
          if (purchase.supplierName && purchase.productCategory && purchase.itemName && purchase.quantity && purchase.quantity > 0) {
            const key = `${purchase.productCategory || 'Uncategorized'}-${purchase.itemName || 'Unknown'}-${purchase.productVersion || 'N/A'}`;
            
            if (!stockData[key]) {
              stockData[key] = {
                id: key,
                companyId: currentUser.companyId,
                productCategory: purchase.productCategory || 'Uncategorized',
                itemName: purchase.itemName || 'Unknown',
                productVersion: purchase.productVersion || 'N/A',
                currentStock: 0,
                unit: purchase.unit || 'pcs',
                minRequired: 0,
                safeQuantityLimit: 0,
                displayStatus: 'displayed',
                createdAt: new Date(),
                updatedAt: new Date()
              };
            }

            stockData[key].currentStock += purchase.quantity || 0;
            
            // Update last purchase date if this purchase is more recent
            if (purchase.purchaseDate) {
              if (!stockData[key].lastPurchaseDate || purchase.purchaseDate > stockData[key].lastPurchaseDate!) {
                stockData[key].lastPurchaseDate = purchase.purchaseDate;
              }
            }
            
            stockData[key].updatedAt = new Date();
          }
        });

        // Preserve existing min_required and safe_quantity_limit values from current stock details
        currentStockDetails.forEach(existingStock => {
          const key = `${existingStock.productCategory}-${existingStock.itemName}-${existingStock.productVersion}`;
          if (stockData[key]) {
            stockData[key].minRequired = existingStock.minRequired || 0;
            stockData[key].safeQuantityLimit = existingStock.safeQuantityLimit || 0;
          }
        });

        // Batch update stock_details collection
        const batch = writeBatch(db);
        const stockDetailsCollection = collection(db, 'stock_details');
        
        for (const stockItem of Object.values(stockData)) {
          const docRef = doc(stockDetailsCollection, stockItem.id);
          batch.set(docRef, stockItem, { merge: true });
        }
        
        await batch.commit();
        
        setError(null);
      } catch (err) {
        console.error('Error aggregating stock data:', err);
        setError(err instanceof Error ? err.message : 'Failed to aggregate stock data');
      } finally {
        setLoading(false);
      }
    };

    return () => {
      unsubscribeInventory();
      unsubscribePurchaseRecords();
      unsubscribeStockDetails();
    };
  }, [currentUser?.companyId]);

  const manualRefresh = async () => {
    setLoading(true);
    // The aggregation will be triggered automatically by the listeners
    setLoading(false);
  };

  return { stockDetails, loading, error, manualRefresh };
};
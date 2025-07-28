import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import type { StockDetailsData } from '@/types/firestore';

export const useStockDetails = () => {
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

    console.log('Setting up stock details listener for company:', currentUser.companyId);
    
    const q = query(
      collection(db, 'stock_details'), 
      where('companyId', '==', currentUser.companyId)
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('Stock details snapshot received:', snapshot.docs.length, 'documents');
        const stockData = snapshot.docs.map(doc => {
          const data = doc.data();
          const currentStock = data.currentStock || 0;
          const minRequired = data.minRequired || 0;
          const safeQuantityLimit = data.safeQuantityLimit || 0;
          
          // Calculate stock_status based on current stock levels
          let stock_status: 'normal' | 'low' | 'critical' = 'normal';
          if (currentStock < safeQuantityLimit) {
            stock_status = 'critical';
          } else if (currentStock < minRequired) {
            stock_status = 'low';
          }
          
          return {
            id: doc.id,
            ...data,
            stock_status,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            lastPurchaseDate: data.lastPurchaseDate?.toDate(),
          };
        }) as StockDetailsData[];
        
        // Sort by category and name
        stockData.sort((a, b) => {
          const categoryCompare = a.productCategory.localeCompare(b.productCategory);
          if (categoryCompare !== 0) return categoryCompare;
          return a.itemName.localeCompare(b.itemName);
        });
        
        setStockDetails(stockData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching stock details:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.companyId]);

  return { stockDetails, loading, error };
};
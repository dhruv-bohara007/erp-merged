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
        const stockData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          lastPurchaseDate: doc.data().lastPurchaseDate?.toDate(),
        })) as StockDetailsData[];
        
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
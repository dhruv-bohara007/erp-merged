import { useState } from 'react';
import { syncStockDetails, StockSyncResult } from '@/services/stockSyncService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useStockSync = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth();

  const performSync = async (): Promise<StockSyncResult> => {
    if (!currentUser?.companyId) {
      const result = {
        success: false,
        message: 'No company ID found',
        processedProducts: 0
      };
      toast.error(result.message);
      return result;
    }

    setIsLoading(true);
    
    try {
      const result = await syncStockDetails(currentUser.companyId);
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      
      return result;
    } catch (error) {
      const result = {
        success: false,
        message: 'Failed to sync stock details',
        processedProducts: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
      
      toast.error(result.message);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    performSync,
    isLoading
  };
};
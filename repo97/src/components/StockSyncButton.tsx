import { Button } from '@/components/ui/button';
import { useStockSync } from '@/hooks/useStockSync';
import { RefreshCw } from 'lucide-react';

export const StockSyncButton = () => {
  const { performSync, isLoading } = useStockSync();

  return (
    <Button
      onClick={performSync}
      disabled={isLoading}
      variant="outline"
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      {isLoading ? 'Syncing...' : 'Sync Stock Details'}
    </Button>
  );
};
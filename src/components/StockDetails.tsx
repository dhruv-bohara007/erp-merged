
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2 } from 'lucide-react';
import { usePurchases, useInventory } from '@/hooks/useFirestore';

interface StockItem {
  productCategory: string;
  itemName: string;
  productVersion: string;
  totalQuantity: number;
  unit: string;
}

const StockDetails = () => {
  const { purchases } = usePurchases();
  const { deleteInventoryItem } = useInventory();

  // Calculate total stock for each unique product combination
  const calculateStockItems = (): StockItem[] => {
    const stockMap = new Map<string, StockItem>();

    purchases.forEach(purchase => {
      if (purchase.itemName && purchase.quantity) {
        const key = `${purchase.productCategory || ''}-${purchase.itemName}-${purchase.productVersion || ''}`;
        
        if (stockMap.has(key)) {
          const existing = stockMap.get(key)!;
          existing.totalQuantity += purchase.quantity;
        } else {
          stockMap.set(key, {
            productCategory: purchase.productCategory || 'N/A',
            itemName: purchase.itemName,
            productVersion: purchase.productVersion || 'N/A',
            totalQuantity: purchase.quantity,
            unit: purchase.unit || 'pcs'
          });
        }
      }
    });

    return Array.from(stockMap.values()).sort((a, b) => 
      a.productCategory.localeCompare(b.productCategory) || 
      a.itemName.localeCompare(b.itemName)
    );
  };

  const stockItems = calculateStockItems();

  const handleDeleteStock = async (item: StockItem) => {
    if (window.confirm(`Are you sure you want to delete ${item.itemName} from stock?`)) {
      try {
        // This would need proper implementation to delete from inventory
        console.log('Delete stock item:', item);
        // For now, just log the action
      } catch (error) {
        console.error('Error deleting stock item:', error);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Details</CardTitle>
      </CardHeader>
      <CardContent>
        {stockItems.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Category</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Product Version</TableHead>
                <TableHead>Total Stock Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.productCategory}</TableCell>
                  <TableCell className="font-medium">{item.itemName}</TableCell>
                  <TableCell>{item.productVersion}</TableCell>
                  <TableCell className="font-medium">{item.totalQuantity}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteStock(item)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No stock items found.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StockDetails;

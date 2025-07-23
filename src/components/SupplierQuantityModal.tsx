import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Package } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SupplierQuantity {
  supplierName: string;
  totalQuantity: number;
}

interface SupplierQuantityModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockItem: {
    itemName: string;
    productVersion: string;
    productCategory: string;
    unit: string;
  } | null;
}

const SupplierQuantityModal = ({ isOpen, onClose, stockItem }: SupplierQuantityModalProps) => {
  const [supplierQuantities, setSupplierQuantities] = useState<SupplierQuantity[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const fetchSupplierQuantities = async () => {
    if (!stockItem || !currentUser?.companyId) return;

    setLoading(true);
    try {
      // Query purchase_records collection for documents containing matching items
      const purchaseRecordsCollection = collection(db, 'purchase_records');
      const q = query(purchaseRecordsCollection, where('companyId', '==', currentUser.companyId));
      const snapshot = await getDocs(q);

      const supplierData: Record<string, number> = {};

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Check if this is the new structure with items array
        if (data.items && Array.isArray(data.items)) {
          data.items.forEach((item: any) => {
            if (item.itemName === stockItem.itemName && 
                item.productVersion === stockItem.productVersion) {
              const supplierName = data.supplierName || 'Unknown Supplier';
              const quantity = item.quantity || 0;
              supplierData[supplierName] = (supplierData[supplierName] || 0) + quantity;
            }
          });
        } else {
          // Handle old structure for backward compatibility
          if (data.itemName === stockItem.itemName && 
              data.productVersion === stockItem.productVersion) {
            const supplierName = data.supplierName || 'Unknown Supplier';
            const quantity = data.quantity || 0;
            supplierData[supplierName] = (supplierData[supplierName] || 0) + quantity;
          }
        }
      });

      // Convert to array and sort by quantity (descending)
      const supplierArray = Object.entries(supplierData).map(([supplierName, totalQuantity]) => ({
        supplierName,
        totalQuantity
      })).sort((a, b) => b.totalQuantity - a.totalQuantity);

      setSupplierQuantities(supplierArray);
    } catch (error) {
      console.error('Error fetching supplier quantities:', error);
      toast({
        title: "Error",
        description: "Failed to fetch supplier quantities",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && stockItem) {
      fetchSupplierQuantities();
    }
  }, [isOpen, stockItem]);

  const totalQuantity = supplierQuantities.reduce((sum, item) => sum + item.totalQuantity, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Supplier Purchase History
          </DialogTitle>
        </DialogHeader>

        {stockItem && (
          <div className="space-y-4">
            {/* Stock Item Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Stock Item Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Product Category:</span>
                    <p className="font-semibold">{stockItem.productCategory}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Item Name:</span>
                    <p className="font-semibold">{stockItem.itemName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Product Version:</span>
                    <p className="font-semibold">{stockItem.productVersion}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Total Purchased:</span>
                    <p className="font-semibold">{totalQuantity} {stockItem.unit}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Supplier Quantities */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Purchase History by Supplier</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading supplier data...</span>
                  </div>
                ) : supplierQuantities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No purchase records found for this item
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Supplier Name</TableHead>
                          <TableHead className="text-right">Total Quantity</TableHead>
                          <TableHead className="text-right">Percentage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {supplierQuantities.map((supplier, index) => {
                          const percentage = totalQuantity > 0 ? (supplier.totalQuantity / totalQuantity * 100).toFixed(1) : '0.0';
                          return (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                {supplier.supplierName}
                              </TableCell>
                              <TableCell className="text-right">
                                {supplier.totalQuantity} {stockItem.unit}
                              </TableCell>
                              <TableCell className="text-right">
                                {percentage}%
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end">
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SupplierQuantityModal;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  IndianRupee, 
  Calendar, 
  TrendingDown,
  Trash2,
  Edit,
  Save,
  X
} from 'lucide-react';
import { usePurchases } from '@/hooks/useFirestore';
import { format } from 'date-fns';

interface EditingPurchase {
  id: string;
  supplierName: string;
  itemName: string;
  productCategory?: string;
  productVersion?: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalAmountINR: number;
  purchaseDate: string;
}

interface StockItem {
  productCategory: string;
  itemName: string;
  productVersion: string;
  totalQuantity: number;
  unit: string;
}

const PurchaseManagement = () => {
  const navigate = useNavigate();
  const { purchases, loading, deletePurchase, updatePurchase } = usePurchases();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditingPurchase | null>(null);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this purchase?')) {
      try {
        await deletePurchase(id);
      } catch (error) {
        console.error('Error deleting purchase:', error);
      }
    }
  };

  const handleEdit = (purchase: any) => {
    setEditingId(purchase.id);
    setEditForm({
      id: purchase.id,
      supplierName: purchase.supplierName || '',
      itemName: purchase.itemName || '',
      productCategory: purchase.productCategory || '',
      productVersion: purchase.productVersion || '',
      quantity: purchase.quantity || 0,
      unit: purchase.unit || '',
      pricePerUnit: Math.round((purchase.totalAmountINR || 0) / (purchase.quantity || 1) * 100) / 100,
      totalAmountINR: Math.round((purchase.totalAmountINR || 0) * 100) / 100,
      purchaseDate: format(new Date(purchase.purchaseDate || purchase.expenseDate), 'yyyy-MM-dd')
    });
  };

  const handleSaveEdit = async () => {
    if (!editForm) return;

    try {
      const totalAmountINR = Math.round(editForm.quantity * editForm.pricePerUnit * 100) / 100;
      
      await updatePurchase(editForm.id, {
        supplierName: editForm.supplierName,
        itemName: editForm.itemName,
        productCategory: editForm.productCategory,
        productVersion: editForm.productVersion,
        quantity: editForm.quantity,
        unit: editForm.unit,
        totalAmountINR: totalAmountINR,
        amount: totalAmountINR,
        purchaseDate: new Date(editForm.purchaseDate),
        expenseDate: new Date(editForm.purchaseDate)
      });
      
      setEditingId(null);
      setEditForm(null);
    } catch (error) {
      console.error('Error updating purchase:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  // Calculate total purchases and display as whole number
  const totalPurchases = Math.round(purchases.reduce((sum, purchase) => sum + (purchase.totalAmountINR || purchase.amount), 0));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(Math.round(amount));
  };

  // Helper function to combine item name with product details
  const getFullItemName = (purchase: any) => {
    const parts = [];
    if (purchase.productCategory) parts.push(purchase.productCategory);
    if (purchase.itemName) parts.push(purchase.itemName);
    if (purchase.productVersion) parts.push(purchase.productVersion);
    
    return parts.length > 0 ? parts.join(' - ') : purchase.itemName || 'Unknown Item';
  };

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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading purchases...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Purchase Management</h1>
        <Button onClick={() => navigate('/add-purchase')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Purchase
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPurchases)}</div>
            <p className="text-xs text-muted-foreground">
              {purchases.length} purchase{purchases.length !== 1 ? 's' : ''} recorded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                Math.round(purchases
                  .filter(purchase => {
                    const purchaseDate = new Date(purchase.purchaseDate || purchase.expenseDate);
                    const currentDate = new Date();
                    return purchaseDate.getMonth() === currentDate.getMonth() && 
                           purchaseDate.getFullYear() === currentDate.getFullYear();
                  })
                  .reduce((sum, purchase) => sum + (purchase.totalAmountINR || purchase.amount), 0))
              )}
            </div>
            <p className="text-xs text-muted-foreground">Current month purchases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Purchase</CardTitle>
            <IndianRupee className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(purchases.length > 0 ? Math.round(totalPurchases / purchases.length) : 0)}
            </div>
            <p className="text-xs text-muted-foreground">Per purchase record</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Recent Purchases and Stock Details */}
      <Tabs defaultValue="recent-purchases" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recent-purchases">Recent Purchases</TabsTrigger>
          <TabsTrigger value="stock-details">Stock Details</TabsTrigger>
        </TabsList>

        <TabsContent value="recent-purchases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Purchases</CardTitle>
            </CardHeader>
            <CardContent>
              {purchases.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier Name</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Quantity Bought</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Price per Unit (INR)</TableHead>
                      <TableHead>Total Amount (INR)</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>
                          {editingId === purchase.id ? (
                            <Input
                              value={editForm?.supplierName || ''}
                              onChange={(e) => setEditForm(prev => prev ? {...prev, supplierName: e.target.value} : null)}
                            />
                          ) : (
                            <div className="font-medium">{purchase.supplierName}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === purchase.id ? (
                            <div className="space-y-2">
                              <Input
                                placeholder="Product Category"
                                value={editForm?.productCategory || ''}
                                onChange={(e) => setEditForm(prev => prev ? {...prev, productCategory: e.target.value} : null)}
                              />
                              <Input
                                placeholder="Item Name"
                                value={editForm?.itemName || ''}
                                onChange={(e) => setEditForm(prev => prev ? {...prev, itemName: e.target.value} : null)}
                              />
                              <Input
                                placeholder="Product Version"
                                value={editForm?.productVersion || ''}
                                onChange={(e) => setEditForm(prev => prev ? {...prev, productVersion: e.target.value} : null)}
                              />
                            </div>
                          ) : (
                            <div>
                              <div className="font-medium">{getFullItemName(purchase)}</div>
                              {purchase.description && (
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {purchase.description}
                                </div>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === purchase.id ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={editForm?.quantity || 0}
                              onChange={(e) => setEditForm(prev => prev ? {...prev, quantity: parseFloat(e.target.value) || 0} : null)}
                            />
                          ) : (
                            purchase.quantity || 0
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === purchase.id ? (
                            <Input
                              value={editForm?.unit || ''}
                              onChange={(e) => setEditForm(prev => prev ? {...prev, unit: e.target.value} : null)}
                            />
                          ) : (
                            <Badge variant="outline">{purchase.unit}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {editingId === purchase.id ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={editForm?.pricePerUnit || 0}
                              onChange={(e) => setEditForm(prev => prev ? {...prev, pricePerUnit: parseFloat(e.target.value) || 0} : null)}
                            />
                          ) : (
                            formatCurrency(Math.round((purchase.totalAmountINR || 0) / (purchase.quantity || 1)))
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(Math.round(purchase.totalAmountINR || purchase.amount))}
                        </TableCell>
                        <TableCell>
                          {editingId === purchase.id ? (
                            <Input
                              type="date"
                              value={editForm?.purchaseDate || ''}
                              onChange={(e) => setEditForm(prev => prev ? {...prev, purchaseDate: e.target.value} : null)}
                            />
                          ) : (
                            format(new Date(purchase.purchaseDate || purchase.expenseDate), 'MMM dd, yyyy')
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {editingId === purchase.id ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleSaveEdit}
                                >
                                  <Save className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCancelEdit}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(purchase)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(purchase.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No purchases recorded yet. Click "Add Purchase" to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock-details" className="space-y-4">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PurchaseManagement;

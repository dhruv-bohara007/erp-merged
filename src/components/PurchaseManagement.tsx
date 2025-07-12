import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  IndianRupee, 
  Calendar, 
  ShoppingCart,
  Trash2,
  Edit,
  TrendingDown
} from 'lucide-react';
import { usePurchases, useInventory } from '@/hooks/useFirestore';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { useCompanyData } from '@/hooks/useCompanyData';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

const PurchaseManagement = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { purchases, loading, addPurchase, deletePurchase } = usePurchases();
  const { inventory, updateInventoryItem, addInventoryItem } = useInventory();
  const { convertToINR, getCurrencyInfo } = useCurrencyConverter();
  const { currentUser } = useAuth();
  const { companyData } = useCompanyData();
  
  const [formData, setFormData] = useState({
    supplierName: '',
    itemName: '',
    quantity: '',
    unit: '',
    pricePerUnit: '',
    discount: '',
    totalAmount: '',
    description: '',
    purchaseDate: format(new Date(), 'yyyy-MM-dd')
  });

  // Get company currency info
  const companyCountry = companyData?.country || 'US';
  const companyCurrency = getCurrencyInfo(companyCountry);

  // Auto-calculate total amount
  useEffect(() => {
    const quantity = parseFloat(formData.quantity) || 0;
    const pricePerUnit = parseFloat(formData.pricePerUnit) || 0;
    const discount = parseFloat(formData.discount) || 0;
    
    if (quantity > 0 && pricePerUnit > 0) {
      const subtotal = quantity * pricePerUnit;
      const total = subtotal - discount;
      setFormData(prev => ({
        ...prev,
        totalAmount: total.toFixed(2)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        totalAmount: ''
      }));
    }
  }, [formData.quantity, formData.pricePerUnit, formData.discount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplierName || !formData.itemName || !formData.quantity || !formData.pricePerUnit || !formData.totalAmount) {
      alert('Please fill in all required fields');
      return;
    }

    const quantityValue = parseFloat(formData.quantity);
    const pricePerUnitValue = parseFloat(formData.pricePerUnit);
    const totalAmountValue = parseFloat(formData.totalAmount);

    if (isNaN(quantityValue) || quantityValue <= 0 || isNaN(pricePerUnitValue) || pricePerUnitValue <= 0 || isNaN(totalAmountValue) || totalAmountValue <= 0) {
      alert('Please enter valid amounts');
      return;
    }
    
    try {
      // Convert total amount to INR
      const { amountInINR, rate } = await convertToINR(totalAmountValue, companyCountry);
      
      // Add purchase record
      await addPurchase({
        supplierName: formData.supplierName,
        itemName: formData.itemName,
        quantity: quantityValue,
        unit: formData.unit || 'pcs',
        pricePerUnit: pricePerUnitValue,
        discount: formData.discount,
        totalAmount: totalAmountValue,
        totalAmountINR: amountInINR,
        companyCurrency: companyCurrency.code,
        exchangeRateUsed: rate,
        description: formData.description,
        purchaseDate: new Date(formData.purchaseDate),
        status: 'completed'
      });

      // Check if item exists in inventory and update/add accordingly
      const existingItem = inventory.find(item => 
        item.itemName.toLowerCase() === formData.itemName.toLowerCase()
      );

      if (existingItem) {
        // Convert price per unit to INR for inventory
        const { amountInINR: priceInINR } = await convertToINR(pricePerUnitValue, companyCountry);
        
        // Update existing inventory item
        await updateInventoryItem(existingItem.id, {
          unitPrice: priceInINR,
          rate: priceInINR,
          rateInInr: priceInINR,
          exchangeRateUsed: rate,
          updatedAt: new Date()
        });
      } else {
        // Convert price per unit to INR for new inventory item
        const { amountInINR: priceInINR } = await convertToINR(pricePerUnitValue, companyCountry);
        
        // Add new inventory item
        await addInventoryItem({
          itemName: formData.itemName,
          unitPrice: priceInINR,
          rate: priceInINR,
          rateInInr: priceInINR,
          exchangeRateUsed: rate,
          companyCurrency: companyCurrency.code,
          companyCountry: companyCountry,
          status: 'active'
        });
      }
      
      setFormData({
        supplierName: '',
        itemName: '',
        quantity: '',
        unit: '',
        pricePerUnit: '',
        discount: '',
        totalAmount: '',
        description: '',
        purchaseDate: format(new Date(), 'yyyy-MM-dd')
      });
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding purchase:', error);
      alert('Failed to add purchase. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this purchase?')) {
      try {
        await deletePurchase(id);
      } catch (error) {
        console.error('Error deleting purchase:', error);
      }
    }
  };

  const totalPurchases = purchases.reduce((sum, purchase) => sum + purchase.totalAmountINR, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
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
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Purchase
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Purchase</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="supplierName">Supplier Name</Label>
                  <Input
                    id="supplierName"
                    value={formData.supplierName}
                    onChange={(e) => setFormData({...formData, supplierName: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="itemName">Item Name</Label>
                  <Input
                    id="itemName"
                    value={formData.itemName}
                    onChange={(e) => setFormData({...formData, itemName: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="text"
                    inputMode="decimal"
                    value={formData.quantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setFormData({...formData, quantity: value});
                      }
                    }}
                    placeholder="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    placeholder="pcs, kg, ltr, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="pricePerUnit">Price per Unit ({companyCurrency.symbol})</Label>
                  <Input
                    id="pricePerUnit"
                    type="text"
                    inputMode="decimal"
                    value={formData.pricePerUnit}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setFormData({...formData, pricePerUnit: value});
                      }
                    }}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount ({companyCurrency.symbol})</Label>
                  <Input
                    id="discount"
                    type="text"
                    inputMode="decimal"
                    value={formData.discount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setFormData({...formData, discount: value});
                      }
                    }}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalAmount">Total Amount ({companyCurrency.symbol})</Label>
                  <Input
                    id="totalAmount"
                    type="text"
                    value={formData.totalAmount}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Purchase description..."
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Purchase</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
                purchases
                  .filter(purchase => {
                    const purchaseDate = new Date(purchase.purchaseDate);
                    const currentDate = new Date();
                    return purchaseDate.getMonth() === currentDate.getMonth() && 
                           purchaseDate.getFullYear() === currentDate.getFullYear();
                  })
                  .reduce((sum, purchase) => sum + purchase.totalAmountINR, 0)
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
              {formatCurrency(purchases.length > 0 ? totalPurchases / purchases.length : 0)}
            </div>
            <p className="text-xs text-muted-foreground">Per purchase record</p>
          </CardContent>
        </Card>
      </div>

      {/* Purchases Table */}
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
                  <TableHead>Quantity</TableHead>
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
                      <div className="font-medium">{purchase.supplierName}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{purchase.itemName}</div>
                        {purchase.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {purchase.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {purchase.quantity || 0}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{purchase.unit}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency((purchase.totalAmountINR || 0) / (purchase.quantity || 1))}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(purchase.totalAmountINR || 0)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(purchase.purchaseDate), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(purchase.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
    </div>
  );
};

export default PurchaseManagement;


import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Package, 
  AlertCircle, 
  TrendingUp,
  Trash2,
  Search
} from 'lucide-react';
import { useInventory } from '@/hooks/useFirestore';
import { useCompanyData } from '@/hooks/useCompanyData';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { useToast } from '@/hooks/use-toast';

const InventoryManagement = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { inventory, loading, addInventoryItem, deleteInventoryItem } = useInventory();
  const { companyData, loading: companyLoading } = useCompanyData();
  const { convertToINR, getCurrencyInfo } = useCurrencyConverter();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    itemName: '',
    rate: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.itemName || !formData.rate) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (!companyData) {
      toast({
        title: 'Company Data Error',
        description: 'Unable to load company information',
        variant: 'destructive',
      });
      return;
    }

    const rateValue = parseFloat(formData.rate);
    if (isNaN(rateValue) || rateValue <= 0) {
      toast({
        title: 'Invalid Rate',
        description: 'Please enter a valid rate',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert to INR using the exchange rate service
      const { amountInINR, rate: exchangeRate } = await convertToINR(rateValue, companyData.country);
      
      // Prepare the inventory item data
      const inventoryItem = {
        itemName: formData.itemName,
        unitPrice: rateValue,
        rate: rateValue,
        rateInInr: Math.round(amountInINR * 100) / 100, // Round to 2 decimal places
        exchangeRateUsed: exchangeRate,
        companyCurrency: companyData.companyCurrency,
        companyCountry: companyData.country,
        // Legacy fields for compatibility
        name: formData.itemName,
        description: '',
        category: 'Products',
        sku: `ITEM-${Date.now()}`,
        currentStock: 0,
        minStock: 0,
        maxStock: 1000,
        unitCost: 0,
        unit: 'pieces',
        supplier: '',
        location: '',
        status: 'active' as const
      };

      await addInventoryItem(inventoryItem);
      
      // Reset form
      setFormData({ itemName: '', rate: '' });
      setIsAddModalOpen(false);
      
      toast({
        title: 'Product Added',
        description: 'Product has been successfully added to inventory',
      });
    } catch (error) {
      console.error('Error adding inventory item:', error);
      toast({
        title: 'Error',
        description: 'Failed to add product. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        await deleteInventoryItem(id);
        toast({
          title: 'Product Deleted',
          description: 'Product has been removed from inventory',
        });
      } catch (error) {
        console.error('Error deleting inventory item:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete product',
          variant: 'destructive',
        });
      }
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = inventory.length;
  const totalValue = inventory.reduce((sum, item) => {
    const price = item.unitPrice || item.rate || 0;
    const stock = item.currentStock || 0;
    return sum + (price * stock);
  }, 0);

  const formatCurrency = (amount: number, currency?: string) => {
    const currencyCode = currency || companyData?.companyCurrency || 'USD';
    const currencyInfo = getCurrencyInfo(companyData?.country || 'US');
    return `${currencyInfo.symbol}${amount.toFixed(2)}`;
  };

  const formatINR = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  if (loading || companyLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading inventory...</div>
        </div>
      </div>
    );
  }

  const currencyInfo = getCurrencyInfo(companyData?.country || 'US');

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="itemName">Item Name</Label>
                <Input
                  id="itemName"
                  value={formData.itemName}
                  onChange={(e) => setFormData({...formData, itemName: e.target.value})}
                  placeholder="Enter product name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="rate">Rate ({currencyInfo.symbol})</Label>
                <Input
                  id="rate"
                  type="text"
                  inputMode="decimal"
                  value={formData.rate}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setFormData({...formData, rate: value});
                    }
                  }}
                  placeholder={`0.00 ${currencyInfo.code}`}
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Product'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">Products in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">Total inventory value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currency</CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencyInfo.code}</div>
            <p className="text-xs text-muted-foreground">{currencyInfo.name}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Product Inventory</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredInventory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Rate ({currencyInfo.code})</TableHead>
                  <TableHead>Rate (INR)</TableHead>
                  <TableHead>Exchange Rate</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.itemName || item.name}</div>
                        {item.sku && (
                          <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(item.unitPrice || item.rate || 0)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.rateInInr ? formatINR(item.rateInInr) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {item.exchangeRateUsed ? item.exchangeRateUsed.toFixed(4) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
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
              {searchTerm ? 'No products match your search.' : 'No products yet. Click "Add Product" to get started.'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryManagement;

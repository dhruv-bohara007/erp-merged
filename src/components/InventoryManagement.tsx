
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { getCurrencyInfo } from '@/hooks/useCurrencyConverter';
import AddProductModal from './AddProductModal';

const InventoryManagement = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { inventory, loading, deleteInventoryItem } = useInventory();
  const { companyData } = useCompanyData();

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        await deleteInventoryItem(id);
      } catch (error) {
        console.error('Error deleting inventory item:', error);
      }
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = inventory.length;
  const lowStockItems = inventory.filter(item => item.currentStock <= item.minStock).length;
  
  // Calculate total value using unitPrice (in company currency) and rateInInr
  const totalValueCompanyCurrency = inventory.reduce((sum, item) => {
    const price = item.unitPrice || item.rate || 0;
    const stock = item.currentStock || 0;
    return sum + (price * stock);
  }, 0);

  const totalValueINR = inventory.reduce((sum, item) => {
    const priceInINR = item.rateInInr || item.unitPrice || item.rate || 0;
    const stock = item.currentStock || 0;
    return sum + (priceInINR * stock);
  }, 0);

  // Get currency symbol for company currency
  const companyCurrencyInfo = companyData ? getCurrencyInfo(companyData.country) : { symbol: '$', code: 'USD' };

  const formatCurrency = (amount: number, currencyCode: string = 'INR') => {
    if (currencyCode === 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(amount);
    }
    
    const currencyInfo = getCurrencyInfo(companyData?.country || 'US');
    return `${currencyInfo.symbol}${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading inventory...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">Items in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Items need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Value ({companyCurrencyInfo.code})</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValueCompanyCurrency, companyCurrencyInfo.code)}</div>
            <p className="text-xs text-muted-foreground">Total stock value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Value (INR)</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValueINR)}</div>
            <p className="text-xs text-muted-foreground">For reporting</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Inventory Items</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search items, SKU, or category..."
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
                  <TableHead>Item Details</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Unit Price ({companyCurrencyInfo.code})</TableHead>
                  <TableHead>Price (INR)</TableHead>
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
                        <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                        {item.location && (
                          <div className="text-xs text-gray-400">📍 {item.location}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {item.currentStock} {item.unit}
                        </div>
                        <div className="text-xs text-gray-500">
                          Min: {item.minStock} | Max: {item.maxStock}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(item.unitPrice || item.rate || 0, companyCurrencyInfo.code)}
                    </TableCell>
                    <TableCell className="font-medium text-blue-600">
                      {item.rateInInr ? formatCurrency(item.rateInInr) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {item.exchangeRateUsed ? `1 ${companyCurrencyInfo.code} = ${item.exchangeRateUsed.toFixed(4)} INR` : 'N/A'}
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
              {searchTerm ? 'No items match your search.' : 'No inventory items yet. Click "Add Product" to get started.'}
            </div>
          )}
        </CardContent>
      </Card>

      <AddProductModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </div>
  );
};

export default InventoryManagement;

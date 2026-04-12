
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Package, 
  TrendingUp,
  Trash2,
  Search,
  Settings,
  ArrowUpDown
} from 'lucide-react';
import { useInventory } from '@/hooks/useFirestore';
import { useCompanyData } from '@/hooks/useCompanyData';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import AddProductModalWrapper from './AddProductModalWrapper';
import ManageProductCategoryModal from './ManageProductCategoryModal';

type SortBy = 'category' | 'name' | 'version' | 'none';

const InventoryManagement = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageCategoryModalOpen, setIsManageCategoryModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('none');
  const { inventory, loading, deleteInventoryItem } = useInventory();
  const { companyData } = useCompanyData();

  // Get currency symbol based on company currency
  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'INR': '₹',
      'JPY': '¥',
      'CAD': 'C$',
      'AUD': 'A$',
      'CHF': 'CHF',
      'CNY': '¥',
      'SEK': 'kr',
      'NZD': 'NZ$'
    };
    return symbols[currency] || currency;
  };

  const formatCurrency = (amount: number) => {
    const currency = companyData?.companyCurrency || 'USD';
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${amount.toLocaleString()}`;
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        await deleteInventoryItem(id);
      } catch (error) {
        console.error('Error deleting inventory item:', error);
      }
    }
  };

  // Filter to only show active products (products with rates > 0 and status = 'active')
  // Also prevent duplicates based on itemName, productVersion, productCategory, and rate
  const activeInventory = inventory.filter(item => 
    item.status === 'active' && (item.rate || 0) > 0
  );

  // Remove duplicates based on itemName, productVersion, productCategory, and rate
  const uniqueInventory = activeInventory.filter((item, index, self) => 
    index === self.findIndex(t => 
      t.itemName === item.itemName &&
      t.productVersion === item.productVersion &&
      t.productCategory === item.productCategory &&
      t.rate === item.rate
    )
  );

  const filteredInventory = uniqueInventory.filter(item =>
    item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.productCategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.productVersion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedInventory = [...filteredInventory].sort((a, b) => {
    switch (sortBy) {
      case 'category':
        return (a.productCategory || '').localeCompare(b.productCategory || '');
      case 'name':
        return (a.itemName || '').localeCompare(b.itemName || '');
      case 'version':
        return (a.productVersion || '').localeCompare(b.productVersion || '');
      default:
        return 0;
    }
  });

  const totalItems = uniqueInventory.length;
  const totalValue = uniqueInventory.reduce((sum, item) => sum + (item.rate || 0), 0);

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
        <h1 className="text-3xl font-bold">Product Management</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsManageCategoryModalOpen(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Manage Product Category
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">Active products in inventory</p>
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
      </div>

      {/* Search and Product List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Products</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-gray-400" />
                <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No sorting</SelectItem>
                    <SelectItem value="category">Product Category</SelectItem>
                    <SelectItem value="name">Product Name</SelectItem>
                    <SelectItem value="version">Product Version</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
          </div>
        </CardHeader>
        <CardContent>
          {sortedInventory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Product Version</TableHead>
                  <TableHead>Product Category</TableHead>
                  <TableHead>Rate per Unit</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">
                        {item.itemName || 'Unknown Item'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.productVersion || '-'}
                    </TableCell>
                    <TableCell>
                      {item.productCategory || '-'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(item.unitPrice || item.rate || 0)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-700"
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
              {searchTerm ? 'No active products match your search.' : 'No active products yet. Click "Add Product" to get started.'}
            </div>
          )}
        </CardContent>
      </Card>

      <AddProductModalWrapper 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />

      <ManageProductCategoryModal
        isOpen={isManageCategoryModalOpen}
        onClose={() => setIsManageCategoryModalOpen(false)}
      />
    </div>
  );
};

export default InventoryManagement;

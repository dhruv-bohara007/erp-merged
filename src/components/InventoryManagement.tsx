
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Package, 
  AlertCircle, 
  TrendingUp,
  Edit,
  Trash2,
  Search
} from 'lucide-react';
import { useInventory } from '@/hooks/useFirestore';

const InventoryManagement = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { inventory, loading, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useInventory();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    sku: '',
    currentStock: '',
    minStock: '',
    maxStock: '',
    unitPrice: '',
    unitCost: '',
    unit: 'pieces',
    supplier: '',
    location: ''
  });

  const categories = [
    'Raw Materials',
    'Finished Goods',
    'Services',
    'Office Supplies',
    'Equipment',
    'Software',
    'Other'
  ];

  const units = [
    'pieces', 'kg', 'grams', 'liters', 'meters', 'hours', 'licenses', 'boxes'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.currentStock || !formData.unitPrice) {
      alert('Please fill in all required fields');
      return;
    }

    const currentStockValue = parseInt(formData.currentStock);
    const minStockValue = parseInt(formData.minStock);
    const maxStockValue = parseInt(formData.maxStock);
    const unitPriceValue = parseFloat(formData.unitPrice);
    const unitCostValue = parseFloat(formData.unitCost);

    if (isNaN(currentStockValue) || currentStockValue < 0) {
      alert('Please enter a valid current stock');
      return;
    }
    if (isNaN(unitPriceValue) || unitPriceValue < 0) {
      alert('Please enter a valid unit price');
      return;
    }
    
    try {
      await addInventoryItem({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        sku: formData.sku,
        currentStock: currentStockValue,
        minStock: minStockValue || 0,
        maxStock: maxStockValue || 1000,
        unitPrice: unitPriceValue,
        unitCost: unitCostValue || 0,
        unit: formData.unit,
        supplier: formData.supplier,
        location: formData.location,
        status: 'active'
      });
      
      setFormData({
        name: '',
        description: '',
        category: '',
        sku: '',
        currentStock: '',
        minStock: '',
        maxStock: '',
        unitPrice: '',
        unitCost: '',
        unit: 'pieces',
        supplier: '',
        location: ''
      });
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding inventory item:', error);
      alert('Failed to add inventory item. Please try again.');
    }
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

  const getStockStatus = (item: any) => {
    if (item.currentStock <= item.minStock) return 'low';
    if (item.currentStock >= item.maxStock) return 'high';
    return 'normal';
  };

  const getStockBadge = (status: string) => {
    switch (status) {
      case 'low':
        return <Badge variant="destructive">Low Stock</Badge>;
      case 'high':
        return <Badge variant="secondary">High Stock</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = inventory.length;
  const lowStockItems = inventory.filter(item => getStockStatus(item) === 'low').length;
  const totalValue = inventory.reduce((sum, item) => sum + (item.currentStock * item.unitPrice), 0);

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
          <div className="text-lg">Loading inventory...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Inventory Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    placeholder="e.g., ITEM-001"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Item description..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={formData.unit} onValueChange={(value) => setFormData({...formData, unit: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Warehouse A, Shelf 1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="currentStock">Current Stock</Label>
                  <Input
                    id="currentStock"
                    type="text"
                    inputMode="numeric"
                    value={formData.currentStock}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d+$/.test(value)) {
                        setFormData({...formData, currentStock: value});
                      }
                    }}
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="minStock">Minimum Stock</Label>
                  <Input
                    id="minStock"
                    type="text"
                    inputMode="numeric"
                    value={formData.minStock}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d+$/.test(value)) {
                        setFormData({...formData, minStock: value});
                      }
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="maxStock">Maximum Stock</Label>
                  <Input
                    id="maxStock"
                    type="text"
                    inputMode="numeric"
                    value={formData.maxStock}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d+$/.test(value)) {
                        setFormData({...formData, maxStock: value});
                      }
                    }}
                    placeholder="1000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="unitCost">Unit Cost (₹)</Label>
                  <Input
                    id="unitCost"
                    type="text"
                    inputMode="decimal"
                    value={formData.unitCost}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setFormData({...formData, unitCost: value});
                      }
                    }}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="unitPrice">Unit Price (₹)</Label>
                  <Input
                    id="unitPrice"
                    type="text"
                    inputMode="decimal"
                    value={formData.unitPrice}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setFormData({...formData, unitPrice: value});
                      }
                    }}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                    placeholder="Supplier name"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Item</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">Total stock value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(inventory.map(item => item.category)).size}
            </div>
            <p className="text-xs text-muted-foreground">Product categories</p>
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
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Stock Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.name}</div>
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
                      {formatCurrency(item.unitPrice)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(item.currentStock * item.unitPrice)}
                    </TableCell>
                    <TableCell>
                      {getStockBadge(getStockStatus(item))}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
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
              {searchTerm ? 'No items match your search.' : 'No inventory items yet. Click "Add Item" to get started.'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryManagement;

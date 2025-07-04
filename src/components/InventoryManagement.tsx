
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Filter, Edit, AlertTriangle, Package, TrendingUp, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import SampleDataToggle from '@/components/SampleDataToggle';
import { useSampleData } from '@/contexts/SampleDataContext';

const InventoryManagement = () => {
  const { showSampleData } = useSampleData();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Sample data for when toggle is enabled
  const sampleInventory = [
    {
      id: 'PROD-001',
      name: 'Web Development Package',
      category: 'Services',
      quantity: 15,
      price: 2500,
      cost: 1500,
      status: 'in_stock',
      lastUpdated: '2024-01-20'
    },
    {
      id: 'PROD-002',
      name: 'Mobile App Development',
      category: 'Services',
      quantity: 8,
      price: 5000,
      cost: 3000,
      status: 'low_stock',
      lastUpdated: '2024-01-18'
    },
    {
      id: 'PROD-003',
      name: 'SEO Optimization',
      category: 'Marketing',
      quantity: 25,
      price: 800,
      cost: 400,
      status: 'in_stock',
      lastUpdated: '2024-01-22'
    },
    {
      id: 'PROD-004',
      name: 'Hosting Service',
      category: 'Services',
      quantity: 0,
      price: 100,
      cost: 50,
      status: 'out_of_stock',
      lastUpdated: '2024-01-15'
    },
    {
      id: 'PROD-005',
      name: 'Design Consultation',
      category: 'Consulting',
      quantity: 12,
      price: 150,
      cost: 75,
      status: 'in_stock',
      lastUpdated: '2024-01-21'
    }
  ];

  const sampleInventoryStats = [
    { category: 'Services', count: 23, value: 115000 },
    { category: 'Marketing', count: 25, value: 20000 },
    { category: 'Consulting', count: 12, value: 1800 },
    { category: 'Products', count: 8, value: 4500 }
  ];

  const sampleCategoryData = [
    { name: 'Services', value: 115000, color: '#3b82f6' },
    { name: 'Marketing', value: 20000, color: '#10b981' },
    { name: 'Consulting', value: 1800, color: '#f59e0b' },
    { name: 'Products', value: 4500, color: '#ef4444' }
  ];

  const sampleSummary = {
    totalItems: 68,
    totalValue: 141300,
    lowStockItems: 3,
    outOfStockItems: 1
  };

  // Real data would come from your hooks here
  const inventory = showSampleData ? sampleInventory : [];
  const inventoryStats = showSampleData ? sampleInventoryStats : [];
  const categoryData = showSampleData ? sampleCategoryData : [];
  const summary = showSampleData ? sampleSummary : {
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-800';
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-600">Manage your products and services inventory</p>
      </div>

      <SampleDataToggle />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Items in inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Inventory value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summary.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              Items running low
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.outOfStockItems}</div>
            <p className="text-xs text-muted-foreground">
              Items out of stock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Inventory by Category</CardTitle>
            <CardDescription>Item count and value by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={inventoryStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value, name) => [
                  name === 'count' ? value : `$${value}`,
                  name === 'count' ? 'Items' : 'Value'
                ]} />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Value Distribution</CardTitle>
            <CardDescription>Inventory value by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value}`, 'Value']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Inventory Items</CardTitle>
              <CardDescription>Manage your products and services</CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Services">Services</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Consulting">Consulting</SelectItem>
                <SelectItem value="Products">Products</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      {showSampleData ? 'No inventory items match your search criteria' : 'No inventory items found. Add your first item to get started.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${item.price.toLocaleString()}</TableCell>
                      <TableCell>${item.cost.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status.replace('_', ' ').charAt(0).toUpperCase() + item.status.replace('_', ' ').slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.lastUpdated}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryManagement;

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Package, 
  Search,
  AlertTriangle,
  Eye,
  Flag
} from 'lucide-react';

// Mock inventory data - replace with real hooks later
const mockInventoryData = [
  { id: '1', name: 'Office Chairs', category: 'Furniture', currentStock: 15, minThreshold: 10, status: 'normal', location: 'Warehouse A' },
  { id: '2', name: 'Laptops', category: 'Electronics', currentStock: 3, minThreshold: 5, status: 'low', location: 'IT Storage' },
  { id: '3', name: 'Printers', category: 'Electronics', currentStock: 2, minThreshold: 3, status: 'low', location: 'Office Floor 2' },
  { id: '4', name: 'Paper Reams', category: 'Stationery', currentStock: 25, minThreshold: 20, status: 'normal', location: 'Supply Room' },
  { id: '5', name: 'USB Drives', category: 'Electronics', currentStock: 1, minThreshold: 8, status: 'critical', location: 'IT Storage' },
  { id: '6', name: 'Desk Lamps', category: 'Furniture', currentStock: 12, minThreshold: 8, status: 'normal', location: 'Warehouse A' },
  { id: '7', name: 'Whiteboard Markers', category: 'Stationery', currentStock: 4, minThreshold: 10, status: 'low', location: 'Supply Room' },
];

const EmployeeInventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', ...Array.from(new Set(mockInventoryData.map(item => item.category)))];

  const filteredInventory = mockInventoryData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600';
      case 'low': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'normal': return 'default';
      case 'low': return 'secondary';
      case 'critical': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleFlagLowStock = (itemId: string, itemName: string) => {
    alert(`Low stock alert sent to admin for: ${itemName}`);
    // TODO: Implement actual alert functionality
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Overview</h1>
            <p className="text-gray-600 mt-2">View current stock levels and flag low stock items</p>
          </div>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search inventory items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInventory.map((item) => (
            <Card key={item.id} className={`border-l-4 ${
              item.status === 'critical' ? 'border-l-red-500' :
              item.status === 'low' ? 'border-l-yellow-500' : 'border-l-green-500'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <p className="text-sm text-gray-500">{item.category}</p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(item.status)}>
                    {item.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Stock:</span>
                    <span className={`font-semibold ${getStatusColor(item.status)}`}>
                      {item.currentStock}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Min Required:</span>
                    <span className="font-medium">{item.minThreshold}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Location:</span>
                    <span className="text-sm">{item.location}</span>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="w-3 h-3 mr-1" />
                      Details
                    </Button>
                    {(item.status === 'low' || item.status === 'critical') && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleFlagLowStock(item.id, item.name)}
                        className="flex-1"
                      >
                        <Flag className="w-3 h-3 mr-1" />
                        Flag Low
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredInventory.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Items</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockInventoryData.length}</div>
              <p className="text-xs text-gray-500">Across all categories</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {mockInventoryData.filter(item => item.status === 'low').length}
              </div>
              <p className="text-xs text-gray-500">Items need restocking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Critical Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {mockInventoryData.filter(item => item.status === 'critical').length}
              </div>
              <p className="text-xs text-gray-500">Immediate attention needed</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmployeeInventory;
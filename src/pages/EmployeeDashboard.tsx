import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  ShoppingCart, 
  AlertTriangle, 
  TrendingDown,
  Plus,
  Eye,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import EmployeeInventory from '@/components/EmployeeInventory';

// Mock data - replace with real data hooks later
const mockInventoryData = [
  { id: '1', name: 'Office Chairs', currentStock: 15, minThreshold: 10, status: 'normal' },
  { id: '2', name: 'Laptops', currentStock: 3, minThreshold: 5, status: 'low' },
  { id: '3', name: 'Printers', currentStock: 2, minThreshold: 3, status: 'low' },
  { id: '4', name: 'Paper Reams', currentStock: 25, minThreshold: 20, status: 'normal' },
  { id: '5', name: 'USB Drives', currentStock: 1, minThreshold: 8, status: 'critical' },
];

const mockPurchaseRequests = [
  { id: '1', itemName: 'USB Drives', quantity: 10, reason: 'Stock depleted', status: 'pending', requestDate: '2024-01-15' },
  { id: '2', itemName: 'Laptops', quantity: 3, reason: 'New hires', status: 'approved', requestDate: '2024-01-14' },
  { id: '3', itemName: 'Office Supplies', quantity: 1, reason: 'Monthly refill', status: 'rejected', requestDate: '2024-01-13' },
];

const mockPurchaseHistory = [
  { id: '1', itemName: 'Office Chairs', quantity: 5, purchaseDate: '2024-01-10' },
  { id: '2', itemName: 'Printer Paper', quantity: 20, purchaseDate: '2024-01-08' },
  { id: '3', itemName: 'Stationery Kit', quantity: 10, purchaseDate: '2024-01-05' },
];

const EmployeeDashboard = () => {
  const { currentUser } = useAuth();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const lowStockItems = mockInventoryData.filter(item => item.status === 'low' || item.status === 'critical');
  const criticalStockItems = mockInventoryData.filter(item => item.status === 'critical');
  
  const pendingRequests = mockPurchaseRequests.filter(req => req.status === 'pending');
  const approvedRequests = mockPurchaseRequests.filter(req => req.status === 'approved');

  // Stock level data for chart
  const stockChartData = mockInventoryData.map(item => ({
    name: item.name.split(' ')[0], // Shortened name for chart
    current: item.currentStock,
    minimum: item.minThreshold
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600';
      case 'low': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRequestStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employee Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back! Monitor inventory and manage purchase requests.</p>
          </div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowPurchaseModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Request Purchase
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Items</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockInventoryData.length}</div>
              <p className="text-xs text-gray-500">In inventory</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Low Stock</CardTitle>
              <TrendingDown className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lowStockItems.length}</div>
              <p className="text-xs text-gray-500">Items need restocking</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Critical Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{criticalStockItems.length}</div>
              <p className="text-xs text-gray-500">Immediate attention</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingRequests.length}</div>
              <p className="text-xs text-gray-500">Awaiting approval</p>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Overview */}
        <EmployeeInventory />
      </div>
    </div>
  );
};

export default EmployeeDashboard;
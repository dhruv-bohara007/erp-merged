import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingCart, 
  Clock,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';

// Mock data - replace with real hooks later
const mockPurchaseRequests = [
  { 
    id: '1', 
    itemName: 'USB Drives', 
    quantity: 10, 
    reason: 'Stock depleted - urgent requirement for new project', 
    status: 'pending', 
    requestDate: '2024-01-15',
    estimatedCost: 500,
    priority: 'high'
  },
  { 
    id: '2', 
    itemName: 'Laptops', 
    quantity: 3, 
    reason: 'New hires joining next week', 
    status: 'approved', 
    requestDate: '2024-01-14',
    estimatedCost: 150000,
    priority: 'high',
    approvedDate: '2024-01-16'
  },
  { 
    id: '3', 
    itemName: 'Office Supplies', 
    quantity: 1, 
    reason: 'Monthly refill for stationery', 
    status: 'rejected', 
    requestDate: '2024-01-13',
    estimatedCost: 2000,
    priority: 'low',
    rejectedDate: '2024-01-15',
    rejectionReason: 'Budget constraints this month'
  },
  { 
    id: '4', 
    itemName: 'Printer Paper', 
    quantity: 20, 
    reason: 'Current stock running low', 
    status: 'sent', 
    requestDate: '2024-01-12',
    estimatedCost: 1000,
    priority: 'medium',
    sentDate: '2024-01-17'
  },
  { 
    id: '5', 
    itemName: 'Monitors', 
    quantity: 2, 
    reason: 'Additional screens for developers', 
    status: 'approved', 
    requestDate: '2024-01-11',
    estimatedCost: 30000,
    priority: 'medium',
    approvedDate: '2024-01-13'
  },
  { 
    id: '6', 
    itemName: 'Keyboards', 
    quantity: 5, 
    reason: 'Replacement for damaged keyboards', 
    status: 'pending', 
    requestDate: '2024-01-10',
    estimatedCost: 2500,
    priority: 'low'
  },
];

const mockPurchaseHistory = [
  { id: '1', itemName: 'Office Chairs', quantity: 5, purchaseDate: '2024-01-10', cost: 25000, status: 'delivered' },
  { id: '2', itemName: 'Printer Paper', quantity: 20, purchaseDate: '2024-01-08', cost: 1000, status: 'delivered' },
  { id: '3', itemName: 'Stationery Kit', quantity: 10, purchaseDate: '2024-01-05', cost: 3000, status: 'delivered' },
  { id: '4', itemName: 'Desk Lamps', quantity: 8, purchaseDate: '2024-01-03', cost: 4000, status: 'delivered' },
  { id: '5', itemName: 'Whiteboards', quantity: 3, purchaseDate: '2024-01-01', cost: 15000, status: 'delivered' },
  { id: '6', itemName: 'Coffee Machine', quantity: 1, purchaseDate: '2023-12-28', cost: 12000, status: 'delivered' },
];

const EmployeePurchases = () => {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'sent': return 'default';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'sent': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  // Filter and limit functions
  const filterRequestsByStatus = (status: string) => {
    return mockPurchaseRequests.filter(req => req.status === status).slice(0, 5);
  };

  const limitedPurchaseHistory = mockPurchaseHistory.slice(0, 5);

  const renderRequestItem = (request: any) => (
    <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-medium text-gray-900">{request.itemName}</h4>
          <p className="text-sm text-gray-500">Qty: {request.quantity} | ₹{request.estimatedCost.toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${getPriorityColor(request.priority)}`}>
            {request.priority.toUpperCase()}
          </span>
          <Badge variant={getStatusBadgeVariant(request.status)}>
            {getStatusIcon(request.status)}
            <span className="ml-1">{request.status}</span>
          </Badge>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-2">{request.reason}</p>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Requested: {request.requestDate}</span>
        <Button size="sm" variant="outline">
          <Eye className="w-3 h-3 mr-1" />
          Details
        </Button>
      </div>
    </div>
  );

  const renderHistoryItem = (purchase: any) => (
    <div key={purchase.id} className="border rounded-lg p-4 hover:bg-gray-50">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-medium text-gray-900">{purchase.itemName}</h4>
          <p className="text-sm text-gray-500">Qty: {purchase.quantity} | ₹{purchase.cost.toLocaleString()}</p>
        </div>
        <Badge variant="default">
          <CheckCircle className="w-3 h-3 mr-1" />
          {purchase.status}
        </Badge>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Delivered: {purchase.purchaseDate}</span>
        <Button size="sm" variant="outline">
          <Eye className="w-3 h-3 mr-1" />
          View
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Summary Cards - Moved to top */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Requests</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockPurchaseRequests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {mockPurchaseRequests.filter(req => req.status === 'pending').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {mockPurchaseRequests.filter(req => req.status === 'approved').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {mockPurchaseRequests.filter(req => req.status === 'rejected').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Requests and History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Purchase Requests with Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-4 mt-4">
                {mockPurchaseRequests.slice(0, 5).map(renderRequestItem)}
              </TabsContent>
              
              <TabsContent value="pending" className="space-y-4 mt-4">
                {filterRequestsByStatus('pending').map(renderRequestItem)}
              </TabsContent>
              
              <TabsContent value="approved" className="space-y-4 mt-4">
                {filterRequestsByStatus('approved').map(renderRequestItem)}
              </TabsContent>
              
              <TabsContent value="rejected" className="space-y-4 mt-4">
                {filterRequestsByStatus('rejected').map(renderRequestItem)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Purchase History with Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase History</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="recent" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
              
              <TabsContent value="recent" className="space-y-4 mt-4">
                {limitedPurchaseHistory.map(renderHistoryItem)}
              </TabsContent>
              
              <TabsContent value="all" className="space-y-4 mt-4">
                {mockPurchaseHistory.slice(0, 5).map(renderHistoryItem)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeePurchases;
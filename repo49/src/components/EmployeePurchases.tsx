import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ShoppingCart, 
  Plus,
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
];

const mockPurchaseHistory = [
  { id: '1', itemName: 'Office Chairs', quantity: 5, purchaseDate: '2024-01-10', cost: 25000, status: 'delivered' },
  { id: '2', itemName: 'Printer Paper', quantity: 20, purchaseDate: '2024-01-08', cost: 1000, status: 'delivered' },
  { id: '3', itemName: 'Stationery Kit', quantity: 10, purchaseDate: '2024-01-05', cost: 3000, status: 'delivered' },
];

const EmployeePurchases = () => {
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [formData, setFormData] = useState({
    itemName: '',
    quantity: '',
    reason: '',
    priority: 'medium',
    estimatedCost: ''
  });

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

  const handleSubmitRequest = () => {
    // TODO: Implement actual request submission
    console.log('Submitting request:', formData);
    setIsNewRequestOpen(false);
    setFormData({
      itemName: '',
      quantity: '',
      reason: '',
      priority: 'medium',
      estimatedCost: ''
    });
    alert('Purchase request submitted successfully!');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Purchase Requests</h1>
            <p className="text-gray-600 mt-2">Manage your purchase requests and track their status</p>
          </div>
          <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Submit Purchase Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="itemName">Item Name</Label>
                  <Input
                    id="itemName"
                    value={formData.itemName}
                    onChange={(e) => handleInputChange('itemName', e.target.value)}
                    placeholder="Enter item name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="estimatedCost">Estimated Cost (₹)</Label>
                    <Input
                      id="estimatedCost"
                      type="number"
                      value={formData.estimatedCost}
                      onChange={(e) => handleInputChange('estimatedCost', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="reason">Reason for Request</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    placeholder="Explain why this purchase is needed..."
                    rows={3}
                  />
                </div>
                <Button onClick={handleSubmitRequest} className="w-full">
                  Submit Request
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
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
          {/* Active Requests */}
          <Card>
            <CardHeader>
              <CardTitle>My Purchase Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockPurchaseRequests.map((request) => (
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
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Purchase History */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockPurchaseHistory.map((purchase) => (
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
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmployeePurchases;
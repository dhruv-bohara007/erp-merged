
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, 
  Plus, 
  Calendar, 
  Package,
  Truck,
  TrendingUp,
  IndianRupee
} from 'lucide-react';
import { usePurchases } from '@/hooks/useFirestore';
import { useNavigate } from 'react-router-dom';

const PurchaseManagement = () => {
  const navigate = useNavigate();
  const { purchases, loading, error } = usePurchases();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = (purchase.supplierName || purchase.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (purchase.itemName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || purchase.purchaseStatus === statusFilter;
    const matchesCategory = categoryFilter === 'all' || purchase.productCategory === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate totals using totalAmountINR and ensure 2 decimal places
  const totalAmount = filteredPurchases.reduce((sum, purchase) => {
    const amount = purchase.totalAmountINR || purchase.amount || 0;
    return sum + Math.round(amount * 100) / 100;
  }, 0);
  
  const completedAmount = filteredPurchases
    .filter(p => p.purchaseStatus === 'completed')
    .reduce((sum, purchase) => {
      const amount = purchase.totalAmountINR || purchase.amount || 0;
      return sum + Math.round(amount * 100) / 100;
    }, 0);
  
  const pendingAmount = filteredPurchases
    .filter(p => p.purchaseStatus === 'pending')
    .reduce((sum, purchase) => {
      const amount = purchase.totalAmountINR || purchase.amount || 0;
      return sum + Math.round(amount * 100) / 100;
    }, 0);

  // Get unique categories for filter
  const categories = [...new Set(purchases.map(p => p.productCategory).filter(Boolean))];

  // Group purchases by product for stock details
  const stockDetails = purchases.reduce((acc, purchase) => {
    if (purchase.itemName) {
      const key = `${purchase.productCategory}-${purchase.itemName}-${purchase.productVersion}`;
      if (!acc[key]) {
        acc[key] = {
          productCategory: purchase.productCategory || 'N/A',
          itemName: purchase.itemName,
          productVersion: purchase.productVersion || 'N/A',
          totalQuantity: 0,
          totalValue: 0,
          lastPurchaseDate: purchase.purchaseDate || purchase.expenseDate,
          unit: purchase.unit || 'pcs'
        };
      }
      acc[key].totalQuantity += purchase.quantity || 0;
      acc[key].totalValue += Math.round((purchase.totalAmountINR || purchase.amount || 0) * 100) / 100;
      
      const purchaseDate = purchase.purchaseDate || purchase.expenseDate;
      if (purchaseDate && purchaseDate > acc[key].lastPurchaseDate) {
        acc[key].lastPurchaseDate = purchaseDate;
      }
    }
    return acc;
  }, {} as Record<string, any>);

  // Format currency as whole numbers for display
  const formatINR = (amount: number) => {
    return `₹${Math.round(amount).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading purchases...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Purchase Management</h1>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => navigate('/purchases/new')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Purchase
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                <p className="text-2xl font-bold">{formatINR(totalAmount)}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <IndianRupee className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{formatINR(completedAmount)}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <Package className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{formatINR(pendingAmount)}</p>
              </div>
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Truck className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{Object.keys(stockDetails).length}</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Purchases */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Recent Purchases ({filteredPurchases.length})</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search purchases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Amount (INR)</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Purchase Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No purchases found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPurchases.map((purchase) => {
                    const displayItemName = purchase.productCategory && purchase.itemName && purchase.productVersion
                      ? `${purchase.productCategory} - ${purchase.itemName} ${purchase.productVersion}`
                      : purchase.itemName || purchase.title || 'N/A';
                    
                    return (
                      <TableRow key={purchase.id}>
                        <TableCell>
                          <div className="font-medium">{purchase.supplierName || 'N/A'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{displayItemName}</div>
                        </TableCell>
                        <TableCell>
                          <div>{purchase.quantity || 'N/A'} {purchase.unit || ''}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{formatINR(purchase.totalAmountINR || purchase.amount || 0)}</div>
                        </TableCell>
                        <TableCell>
                          <div>{purchase.productCategory || 'N/A'}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(purchase.purchaseStatus)}>
                            {(purchase.purchaseStatus || 'completed').charAt(0).toUpperCase() + (purchase.purchaseStatus || 'completed').slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                            {(purchase.purchaseDate || purchase.expenseDate)?.toLocaleDateString() || 'N/A'}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Stock Details */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Category</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Product Version</TableHead>
                  <TableHead>Total Quantity</TableHead>
                  <TableHead>Total Value (INR)</TableHead>
                  <TableHead>Last Purchase</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.keys(stockDetails).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No stock items found
                    </TableCell>
                  </TableRow>
                ) : (
                  Object.values(stockDetails).map((item: any, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="font-medium">{item.productCategory}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{item.itemName}</div>
                      </TableCell>
                      <TableCell>
                        <div>{item.productVersion}</div>
                      </TableCell>
                      <TableCell>
                        <div>{item.totalQuantity} {item.unit}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatINR(item.totalValue)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                          {item.lastPurchaseDate?.toLocaleDateString() || 'N/A'}
                        </div>
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

export default PurchaseManagement;

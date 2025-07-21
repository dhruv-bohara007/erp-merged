import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Package, 
  ShoppingCart, 
  AlertTriangle, 
  TrendingDown,
  Plus,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Search
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const EmployeeDashboard = () => {
  const { currentUser } = useAuth();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [inventoryData, setInventoryData] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  // Fetch inventory/stock data
  useEffect(() => {
    if (!currentUser?.companyId) {
      setLoading(false);
      return;
    }

    console.log('Fetching inventory data for company:', currentUser.companyId);

    const q = query(
      collection(db, 'stock_details'),
      where('companyId', '==', currentUser.companyId)
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        console.log('Inventory snapshot received:', snapshot.docs.length, 'documents');
        const inventory = snapshot.docs.map(doc => {
          const data = doc.data();
          const currentStock = data.currentStock || 0;
          const minThreshold = data.minThreshold || data.reorderLevel || 5;
          let status = 'normal';
          
          if (currentStock === 0) {
            status = 'critical';
          } else if (currentStock <= minThreshold) {
            status = 'low';
          }

          return {
            id: doc.id,
            name: `${data.productCategory || 'Item'}-${data.itemName || 'Unknown'} ${data.productVersion || ''}`.trim(),
            currentStock,
            minThreshold,
            status
          };
        });
        setInventoryData(inventory);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching inventory:', err);
        setError('Failed to load inventory data');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.companyId]);

  // Fetch employee's purchase requests
  useEffect(() => {
    if (!currentUser?.companyId || !currentUser?.email) {
      return;
    }

    console.log('Fetching purchase requests for employee:', currentUser.email);

    const q = query(
      collection(db, 'purchase_requests'),
      where('companyId', '==', currentUser.companyId),
      where('employeeEmail', '==', currentUser.email),
      limit(10)
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        console.log('Purchase requests snapshot received:', snapshot.docs.length, 'documents');
        const requests = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            itemName: data.itemName || data.productName || 'N/A',
            quantity: data.quantity || 0,
            reason: data.reason || data.notes || 'No reason provided',
            status: data.status || 'pending',
            requestDate: data.createdAt?.toDate()?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
          };
        }).sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));
        setPurchaseRequests(requests);
      },
      (err) => {
        console.error('Error fetching purchase requests:', err);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.companyId, currentUser?.email]);

  // Fetch recent purchase history for the company
  useEffect(() => {
    if (!currentUser?.companyId) {
      return;
    }

    console.log('Fetching purchase history for company:', currentUser.companyId);

    const q = query(
      collection(db, 'purchase_records'),
      where('companyId', '==', currentUser.companyId),
      limit(5)
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        console.log('Purchase history snapshot received:', snapshot.docs.length, 'documents');
        const history = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            itemName: data.itemName || data.productName || 'N/A',
            quantity: data.quantity || 0,
            purchaseDate: data.purchaseDate?.toDate()?.toISOString().split('T')[0] || 
                          data.createdAt?.toDate()?.toISOString().split('T')[0] || 
                          new Date().toISOString().split('T')[0]
          };
        }).sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
        setPurchaseHistory(history);
      },
      (err) => {
        console.error('Error fetching purchase history:', err);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.companyId]);

  const lowStockItems = inventoryData.filter(item => item.status === 'low' || item.status === 'critical');
  const criticalStockItems = inventoryData.filter(item => item.status === 'critical');
  
  const pendingRequests = purchaseRequests.filter(req => req.status === 'pending');
  const approvedRequests = purchaseRequests.filter(req => req.status === 'approved');

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

  // Filter and sort inventory data
  const filteredAndSortedInventory = inventoryData
    .filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'stock':
          return b.currentStock - a.currentStock;
        case 'status':
          const statusOrder = { 'critical': 0, 'low': 1, 'normal': 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        default:
          return 0;
      }
    })
    .slice(0, 5); // Display only 5 items

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              <div className="text-2xl font-bold">{inventoryData.length}</div>
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

        {/* Low Stock Alerts and Purchase Requests Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        item.status === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">Stock: {item.currentStock} (Min: {item.minThreshold})</p>
                      </div>
                    </div>
                  </div>
                ))}
                {lowStockItems.length === 0 && (
                  <p className="text-center text-gray-500 py-4">All items are well stocked!</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* My Purchase Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-green-500" />
                My Purchase Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {purchaseRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        {request.status === 'pending' && <Clock className="w-4 h-4 text-blue-600" />}
                        {request.status === 'approved' && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {request.status === 'rejected' && <XCircle className="w-4 h-4 text-red-600" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{request.itemName}</p>
                        <p className="text-sm text-gray-500">Qty: {request.quantity} | {request.requestDate}</p>
                      </div>
                    </div>
                    <Badge variant={getRequestStatusBadge(request.status)}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                  </div>
                ))}
                {purchaseRequests.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No purchase requests yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Purchase History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Purchase History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {purchaseHistory.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{purchase.itemName}</p>
                      <p className="text-sm text-gray-500">Qty: {purchase.quantity} | {purchase.purchaseDate}</p>
                    </div>
                  </div>
                  <Badge variant="default">Delivered</Badge>
                </div>
              ))}
              {purchaseHistory.length === 0 && (
                <p className="text-center text-gray-500 py-4">No purchase history</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Updated Inventory Overview Table */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Overview</CardTitle>
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="name">Sort by Name</option>
                <option value="stock">Sort by Stock</option>
                <option value="status">Sort by Status</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {filteredAndSortedInventory.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Item Name</th>
                      <th className="text-left p-2">Current Stock</th>
                      <th className="text-left p-2">Min Threshold</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedInventory.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{item.name}</td>
                        <td className="p-2">{item.currentStock}</td>
                        <td className="p-2">{item.minThreshold}</td>
                        <td className="p-2">
                          <span className={`capitalize ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center text-gray-500 py-8">No inventory data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboard;

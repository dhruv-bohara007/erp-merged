
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
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, onSnapshot, limit, doc, deleteDoc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

const EmployeeDashboard = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [inventoryData, setInventoryData] = useState([]);
  const [stockDetailsData, setStockDetailsData] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(0);
  
  // New state for purchase requests pagination and filtering
  const [requestsSearchTerm, setRequestsSearchTerm] = useState('');
  const [requestsSortBy, setRequestsSortBy] = useState('date');
  const [requestsCurrentPage, setRequestsCurrentPage] = useState(0);
  
  // New state for purchase history pagination and filtering
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historySortBy, setHistorySortBy] = useState('date');
  const [historyCurrentPage, setHistoryCurrentPage] = useState(0);

  // Fetch stock details from Firestore
  useEffect(() => {
    if (!currentUser?.companyId) {
      setLoading(false);
      return;
    }

    console.log('Fetching stock details for company:', currentUser.companyId);

    const q = query(
      collection(db, 'stock_details'),
      where('companyId', '==', currentUser.companyId)
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        console.log('Stock details snapshot received:', snapshot.docs.length, 'documents');
        const stockDetails = snapshot.docs.map(doc => {
          const data = doc.data();
          const currentStock = data.currentStock || 0;
          const minRequired = data.minRequired || data.reorderLevel || 5;
          const safeQuantityLimit = data.safeQuantityLimit || data.maxThreshold || 100;
          
          let status = 'normal';
          if (currentStock === 0) {
            status = 'critical';
          } else if (currentStock <= minRequired) {
            status = 'low';
          }

          return {
            id: doc.id,
            name: `${data.productCategory || 'Item'}-${data.itemName || 'Unknown'} ${data.productVersion || ''}`.trim(),
            currentStock,
            minRequired,
            safeQuantityLimit,
            status: data.stock_status || status
          };
        });
        setStockDetailsData(stockDetails);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching stock details:', err);
        setError('Failed to load stock details data');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.companyId]);

  // Fetch inventory/stock data for backward compatibility
  useEffect(() => {
    if (!currentUser?.companyId) {
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
      },
      (err) => {
        console.error('Error fetching inventory:', err);
        setError('Failed to load inventory data');
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
            unit: data.unit || '',
            reason: data.reason || data.notes || 'No reason provided',
            status: data.status || 'pending',
            requestDate: data.createdAt?.toDate()?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
          };
        }).sort((a, b) => {
          const dateA = new Date(a.requestDate).getTime();
          const dateB = new Date(b.requestDate).getTime();
          return dateB - dateA; // Descending order (newest first)
        });
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
            unit: data.unit || '',
            purchaseDate: data.purchaseDate?.toDate()?.toISOString().split('T')[0] || 
                          data.createdAt?.toDate()?.toISOString().split('T')[0] || 
                          new Date().toISOString().split('T')[0]
          };
        }).sort((a, b) => {
          const dateA = new Date(a.purchaseDate).getTime();
          const dateB = new Date(b.purchaseDate).getTime();
          return dateB - dateA; // Descending order (newest first)
        });
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

  const getRequestStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  // Function to delete a pending purchase request and rollback stock
  const handleDeleteRequest = async (requestId: string) => {
    try {
      // Find the request to get details for rollback
      const requestToDelete = purchaseRequests.find(req => req.id === requestId);
      if (!requestToDelete) {
        toast({
          title: "Error",
          description: "Request not found",
          variant: "destructive"
        });
        return;
      }

      if (requestToDelete.status !== 'pending') {
        toast({
          title: "Cannot Delete",
          description: "Only pending requests can be deleted",
          variant: "destructive"
        });
        return;
      }

      // Get the purchase request details from Firestore
      const purchaseRequestsQuery = query(
        collection(db, 'purchase_requests'),
        where('companyId', '==', currentUser?.companyId),
        where('employeeEmail', '==', currentUser?.email)
      );
      const requestSnapshot = await getDocs(purchaseRequestsQuery);
      const requestDoc = requestSnapshot.docs.find(doc => doc.id === requestId);
      
      if (!requestDoc) {
        toast({
          title: "Error",
          description: "Request not found in database",
          variant: "destructive"
        });
        return;
      }

      const requestData = requestDoc.data();

      // Find and update the corresponding stock_details to rollback
      const stockDetailsQuery = query(
        collection(db, 'stock_details'),
        where('companyId', '==', currentUser?.companyId),
        where('productCategory', '==', requestData.productCategory),
        where('itemName', '==', requestData.itemName),
        where('productVersion', '==', requestData.productVersion)
      );
      
      const stockSnapshot = await getDocs(stockDetailsQuery);
      
      if (!stockSnapshot.empty) {
        const stockDoc = stockSnapshot.docs[0];
        const stockData = stockDoc.data();
        
        // Rollback: remove the pending quantity
        const newPendingQuantity = Math.max(0, (stockData.pendingQuantity || 0) - (requestData.quantityRequired || 0));
        
        await updateDoc(doc(db, 'stock_details', stockDoc.id), {
          pendingQuantity: newPendingQuantity,
          lastRequestStatus: newPendingQuantity > 0 ? 'pending' : null,
          updatedAt: new Date()
        });
      }

      // Delete the purchase request
      await deleteDoc(doc(db, 'purchase_requests', requestId));

      toast({
        title: "Request Deleted",
        description: "Purchase request has been deleted and stock rolled back",
      });

    } catch (error) {
      console.error('Error deleting purchase request:', error);
      toast({
        title: "Error",
        description: "Failed to delete purchase request",
        variant: "destructive"
      });
    }
  };

  // Filter and sort inventory data with pagination - use stockDetailsData for new columns
  const filteredInventory = stockDetailsData
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
    });

  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const currentInventoryItems = filteredInventory.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Reset pagination when search or sort changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, sortBy]);

  // Reset requests pagination when search or sort changes
  useEffect(() => {
    setRequestsCurrentPage(0);
  }, [requestsSearchTerm, requestsSortBy]);

  // Reset history pagination when search or sort changes
  useEffect(() => {
    setHistoryCurrentPage(0);
  }, [historySearchTerm, historySortBy]);

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
              <div className="flex gap-4 items-center mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search requests..."
                    value={requestsSearchTerm}
                    onChange={(e) => setRequestsSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={requestsSortBy}
                  onChange={(e) => setRequestsSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="date">Sort by Date</option>
                  <option value="name">Sort by Item</option>
                  <option value="status">Sort by Status</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
                  const filteredRequests = purchaseRequests
                    .filter(request => 
                      request.itemName.toLowerCase().includes(requestsSearchTerm.toLowerCase())
                    )
                    .sort((a, b) => {
                      switch (requestsSortBy) {
                        case 'name':
                          return a.itemName.localeCompare(b.itemName);
                        case 'status':
                          return a.status.localeCompare(b.status);
                        case 'date':
                        default:
                          return new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime();
                      }
                    });

                  const requestsPerPage = 5;
                  const totalRequestsPages = Math.ceil(filteredRequests.length / requestsPerPage);
                  const currentRequests = filteredRequests.slice(
                    requestsCurrentPage * requestsPerPage,
                    (requestsCurrentPage + 1) * requestsPerPage
                  );

                  return (
                    <>
                      {currentRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              {getRequestStatusIcon(request.status)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{request.itemName}</p>
                              <p className="text-sm text-gray-500">
                                Qty: {request.quantity} {request.unit} | {request.requestDate}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getRequestStatusBadge(request.status)}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </Badge>
                            {request.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteRequest(request.id)}
                                className="h-6 w-6 p-0"
                                title="Delete pending request"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      {currentRequests.length === 0 && (
                        <p className="text-center text-gray-500 py-4">
                          {requestsSearchTerm ? 'No matching requests found' : 'No purchase requests yet'}
                        </p>
                      )}
                      {/* Pagination for Requests */}
                      {totalRequestsPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                          <div className="text-sm text-gray-500">
                            Showing {requestsCurrentPage * requestsPerPage + 1} to{' '}
                            {Math.min((requestsCurrentPage + 1) * requestsPerPage, filteredRequests.length)} of{' '}
                            {filteredRequests.length} requests
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRequestsCurrentPage(Math.max(0, requestsCurrentPage - 1))}
                              disabled={requestsCurrentPage === 0}
                            >
                              <ChevronLeft className="w-4 h-4" />
                              Previous
                            </Button>
                            <span className="text-sm text-gray-500">
                              Page {requestsCurrentPage + 1} of {totalRequestsPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRequestsCurrentPage(Math.min(totalRequestsPages - 1, requestsCurrentPage + 1))}
                              disabled={requestsCurrentPage === totalRequestsPages - 1}
                            >
                              Next
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Purchase History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Purchase History</CardTitle>
            <div className="flex gap-4 items-center mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search purchase history..."
                  value={historySearchTerm}
                  onChange={(e) => setHistorySearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={historySortBy}
                onChange={(e) => setHistorySortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Item</option>
                <option value="quantity">Sort by Quantity</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(() => {
                const filteredHistory = purchaseHistory
                  .filter(purchase => 
                    purchase.itemName.toLowerCase().includes(historySearchTerm.toLowerCase())
                  )
                  .sort((a, b) => {
                    switch (historySortBy) {
                      case 'name':
                        return a.itemName.localeCompare(b.itemName);
                      case 'quantity':
                        return b.quantity - a.quantity;
                      case 'date':
                      default:
                        return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
                    }
                  });

                const historyPerPage = 5;
                const totalHistoryPages = Math.ceil(filteredHistory.length / historyPerPage);
                const currentHistory = filteredHistory.slice(
                  historyCurrentPage * historyPerPage,
                  (historyCurrentPage + 1) * historyPerPage
                );

                return (
                  <>
                    {currentHistory.map((purchase) => (
                      <div key={purchase.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{purchase.itemName}</p>
                            <p className="text-sm text-gray-500">
                              Qty: {purchase.quantity} {purchase.unit} | {purchase.purchaseDate}
                            </p>
                          </div>
                        </div>
                        <Badge variant="default">Delivered</Badge>
                      </div>
                    ))}
                    {currentHistory.length === 0 && (
                      <p className="text-center text-gray-500 py-4">
                        {historySearchTerm ? 'No matching purchase history found' : 'No purchase history'}
                      </p>
                    )}
                    {/* Pagination for History */}
                    {totalHistoryPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-500">
                          Showing {historyCurrentPage * historyPerPage + 1} to{' '}
                          {Math.min((historyCurrentPage + 1) * historyPerPage, filteredHistory.length)} of{' '}
                          {filteredHistory.length} purchases
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setHistoryCurrentPage(Math.max(0, historyCurrentPage - 1))}
                            disabled={historyCurrentPage === 0}
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                          </Button>
                          <span className="text-sm text-gray-500">
                            Page {historyCurrentPage + 1} of {totalHistoryPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setHistoryCurrentPage(Math.min(totalHistoryPages - 1, historyCurrentPage + 1))}
                            disabled={historyCurrentPage === totalHistoryPages - 1}
                          >
                            Next
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Updated Inventory Overview Table with New Columns */}
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
              {currentInventoryItems.length > 0 ? (
                <>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Item Name</th>
                        <th className="text-left p-2">Current Stock</th>
                        <th className="text-left p-2">Min Required</th>
                        <th className="text-left p-2">Safe Quantity Limit</th>
                        <th className="text-left p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentInventoryItems.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{item.name}</td>
                          <td className="p-2">{item.currentStock}</td>
                          <td className="p-2">{item.minRequired}</td>
                          <td className="p-2">{item.safeQuantityLimit}</td>
                          <td className="p-2">
                            <span className={`capitalize ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-500">
                        Showing {currentPage * itemsPerPage + 1} to{' '}
                        {Math.min((currentPage + 1) * itemsPerPage, filteredInventory.length)} of{' '}
                        {filteredInventory.length} items
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={prevPage}
                          disabled={currentPage === 0}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </Button>
                        <span className="text-sm text-gray-500">
                          Page {currentPage + 1} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={nextPage}
                          disabled={currentPage === totalPages - 1}
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
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

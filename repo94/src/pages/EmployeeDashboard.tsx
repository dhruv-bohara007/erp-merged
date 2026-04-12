
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
  const [stockStatusFilter, setStockStatusFilter] = useState('all');
  const [purchaseStatusFilter, setPurchaseStatusFilter] = useState('all');
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
            status: data.stock_status || status,
            lastRequestStatus: data.lastRequestStatus || null,
            purchaseStatus: data.lastRequestStatus || null
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

  // Calculate summary stats using same logic as EmployeeInventory
  const getItemStatus = (item: any) => {
    const { currentStock, minRequired = 0, safeQuantityLimit = 0 } = item;
    
    if (currentStock >= minRequired) {
      return 'normal';
    } else if (currentStock <= safeQuantityLimit) {
      return 'critical';
    } else {
      return 'low';
    }
  };

  const lowStockItems = stockDetailsData.filter(item => {
    const status = getItemStatus(item);
    return status === 'low';
  });
  const criticalStockItems = stockDetailsData.filter(item => {
    const status = getItemStatus(item);
    return status === 'critical';
  });
  
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
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStockStatus = stockStatusFilter === 'all' || item.status === stockStatusFilter;
      const matchesPurchaseStatus = purchaseStatusFilter === 'all' || 
        (item.lastRequestStatus && item.lastRequestStatus.toLowerCase().replace(' ', '_') === purchaseStatusFilter) ||
        (purchaseStatusFilter === 'po_created' && item.lastRequestStatus === 'Order Recorded');
      
      return matchesSearch && matchesStockStatus && matchesPurchaseStatus;
    })
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
  }, [searchTerm, sortBy, stockStatusFilter, purchaseStatusFilter]);

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
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Items</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stockDetailsData.length}</div>
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

        </div>


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
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Stock Status</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
                <option value="critical">Critical</option>
              </select>
              <select
                value={purchaseStatusFilter}
                onChange={(e) => setPurchaseStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Purchase Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="po_created">PO Created</option>
              </select>
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
                      </tr>
                    </thead>
                    <tbody>
                      {currentInventoryItems.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{item.name}</td>
                          <td className="p-2">{item.currentStock}</td>
                          <td className="p-2">{item.minRequired}</td>
                          <td className="p-2">{item.safeQuantityLimit}</td>
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

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { 
  ShoppingCart, 
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Package,
  AlertTriangle
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

const EmployeePurchases = () => {
  const { currentUser } = useAuth();
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch purchase requests from Firestore - simplified query to avoid index requirements
  useEffect(() => {
    if (!currentUser?.companyId || !currentUser?.email) {
      setLoading(false);
      return;
    }

    console.log('Fetching purchase requests for user:', currentUser.email);

    // Use simpler query to avoid compound index requirement
    const q = query(
      collection(db, 'purchase_requests'),
      where('employeeEmail', '==', currentUser.email)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('Purchase requests snapshot received:', snapshot.docs.length, 'documents');
        const requests = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            companyId: data.companyId,
            requestDate: data.createdAt?.toDate()?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
            approvedDate: data.approvedAt?.toDate()?.toISOString().split('T')[0],
            rejectedDate: data.rejectedAt?.toDate()?.toISOString().split('T')[0],
            sentDate: data.sentAt?.toDate()?.toISOString().split('T')[0]
          };
        })
        .filter(req => req.companyId === currentUser.companyId)
        .sort((a, b) => {
          const dateA = new Date(a.requestDate).getTime();
          const dateB = new Date(b.requestDate).getTime();
          return dateB - dateA;
        });
        
        setPurchaseRequests(requests);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching purchase requests:', err);
        setError('Failed to load purchase requests');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.companyId, currentUser?.email]);

  // Fetch purchase history from Firestore - simplified query
  useEffect(() => {
    if (!currentUser?.companyId) {
      return;
    }

    console.log('Fetching purchase history for company:', currentUser.companyId);

    const q = query(
      collection(db, 'purchase_records'),
      where('companyId', '==', currentUser.companyId)
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        console.log('Purchase history snapshot received:', snapshot.docs.length, 'documents');
        const history = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            purchaseDate: data.purchaseDate?.toDate()?.toISOString().split('T')[0] || 
                          data.createdAt?.toDate()?.toISOString().split('T')[0] || 
                          new Date().toISOString().split('T')[0],
            cost: data.totalAmountAfterTax || data.totalAmountINR || data.amount || 0,
            status: data.purchaseStatus || 'delivered'
          };
        })
        .sort((a, b) => {
          const dateA = new Date(a.purchaseDate).getTime();
          const dateB = new Date(b.purchaseDate).getTime();
          return dateB - dateA;
        })
        .slice(0, 20);
        
        setPurchaseHistory(history);
      },
      (err) => {
        console.error('Error fetching purchase history:', err);
        setError('Failed to load purchase history');
      }
    );

    return () => unsubscribe();
  }, [currentUser?.companyId]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'PO Created': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'PO Created': return <Package className="w-4 h-4 text-blue-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStockStatusBadge = (stockStatus: string) => {
    const status = stockStatus?.toLowerCase() || 'unknown';
    switch (status) {
      case 'critical':
        return <Badge variant="destructive" className="text-xs"><AlertTriangle className="w-3 h-3 mr-1" />Critical</Badge>;
      case 'low':
        return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />Low</Badge>;
      case 'in stock':
      case 'available':
        return <Badge variant="default" className="text-xs bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />In Stock</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>;
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

  // Filter requests based on search term
  const filteredRequests = purchaseRequests.filter(request => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (request.productCategory || '').toLowerCase().includes(searchLower) ||
      (request.itemName || '').toLowerCase().includes(searchLower) ||
      (request.productVersion || '').toLowerCase().includes(searchLower) ||
      (request.status || '').toLowerCase().includes(searchLower)
    );
  });

  // Filter and paginate functions
  const filterRequestsByStatus = (status: string) => {
    const filtered = status === 'all' 
      ? filteredRequests 
      : filteredRequests.filter(req => req.status === status);
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      items: filtered.slice(startIndex, endIndex),
      totalItems: filtered.length,
      totalPages: Math.ceil(filtered.length / itemsPerPage)
    };
  };

  const limitedPurchaseHistory = purchaseHistory.slice(0, 5);

  const renderRequestItem = (request: any) => (
    <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-1">{request.itemName || 'N/A'}</h4>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Category:</span> {request.productCategory || 'N/A'}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Version:</span> {request.productVersion || 'N/A'}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Quantity:</span> {request.quantityRequired || 'N/A'} {request.unit || ''}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant={getStatusBadgeVariant(request.status || 'pending')} className="flex items-center gap-1">
            {getStatusIcon(request.status || 'pending')}
            <span>{(request.status || 'pending').charAt(0).toUpperCase() + (request.status || 'pending').slice(1)}</span>
          </Badge>
          {getStockStatusBadge(request.stockStatus)}
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-3">{request.reason || 'No reason provided'}</p>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Requested: {request.requestDate}</span>
        {request.priority && (
          <span className={`font-medium ${getPriorityColor(request.priority)}`}>
            {request.priority.toUpperCase()} PRIORITY
          </span>
        )}
      </div>
    </div>
  );

  const renderHistoryItem = (purchase: any) => (
    <div key={purchase.id} className="border rounded-lg p-4 hover:bg-gray-50">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-medium text-gray-900">{purchase.itemName || purchase.productName || 'N/A'}</h4>
          <p className="text-sm text-gray-500">
            Qty: {purchase.quantity || 'N/A'} | ₹{(purchase.cost || 0).toLocaleString()}
          </p>
        </div>
        <Badge variant="default">
          <CheckCircle className="w-3 h-3 mr-1" />
          {purchase.status}
        </Badge>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Delivered: {purchase.purchaseDate}</span>
      </div>
    </div>
  );

  const renderPaginationForTab = (tabData: any) => {
    if (tabData.totalPages <= 1) return null;

    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
          
          {Array.from({ length: tabData.totalPages }, (_, i) => i + 1).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => setCurrentPage(page)}
                isActive={currentPage === page}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => setCurrentPage(Math.min(tabData.totalPages, currentPage + 1))}
              className={currentPage === tabData.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading purchase data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center text-red-600 py-8">
          <p>Error: {error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Requests</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchaseRequests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {purchaseRequests.filter(req => req.status === 'pending').length}
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
              {purchaseRequests.filter(req => req.status === 'approved').length}
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
              {purchaseRequests.filter(req => req.status === 'rejected').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by category, item name, version, or status..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Purchase Requests and History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Purchase Requests with Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full" onValueChange={() => setCurrentPage(1)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-4 mt-4">
                {(() => {
                  const tabData = filterRequestsByStatus('all');
                  return (
                    <>
                      {tabData.items.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No purchase requests found</p>
                      ) : (
                        tabData.items.map(renderRequestItem)
                      )}
                      {renderPaginationForTab(tabData)}
                    </>
                  );
                })()}
              </TabsContent>
              
              <TabsContent value="pending" className="space-y-4 mt-4">
                {(() => {
                  const tabData = filterRequestsByStatus('pending');
                  return (
                    <>
                      {tabData.items.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No pending requests</p>
                      ) : (
                        tabData.items.map(renderRequestItem)
                      )}
                      {renderPaginationForTab(tabData)}
                    </>
                  );
                })()}
              </TabsContent>
              
              <TabsContent value="approved" className="space-y-4 mt-4">
                {(() => {
                  const tabData = filterRequestsByStatus('approved');
                  return (
                    <>
                      {tabData.items.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No approved requests</p>
                      ) : (
                        tabData.items.map(renderRequestItem)
                      )}
                      {renderPaginationForTab(tabData)}
                    </>
                  );
                })()}
              </TabsContent>
              
              <TabsContent value="rejected" className="space-y-4 mt-4">
                {(() => {
                  const tabData = filterRequestsByStatus('rejected');
                  return (
                    <>
                      {tabData.items.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No rejected requests</p>
                      ) : (
                        tabData.items.map(renderRequestItem)
                      )}
                      {renderPaginationForTab(tabData)}
                    </>
                  );
                })()}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Purchase History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Purchase History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {limitedPurchaseHistory.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No purchase history found</p>
              ) : (
                limitedPurchaseHistory.map(renderHistoryItem)
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeePurchases;

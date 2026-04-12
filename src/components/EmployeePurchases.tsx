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
  AlertTriangle,
  Eye
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import PurchaseDetailsModal from './PurchaseDetailsModal';

const EmployeePurchases = () => {
  const { currentUser } = useAuth();
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // New state for purchase history search and pagination
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historySortBy, setHistorySortBy] = useState('date');
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  
  // Modal state
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
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

  // Fetch purchase history from purchase_records collection
  useEffect(() => {
    if (!currentUser?.companyId) {
      return;
    }

    console.log('Fetching purchase history from purchase_records for company:', currentUser.companyId);

    const q = query(
      collection(db, 'purchase_records'),
      where('companyId', '==', currentUser.companyId)
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        console.log('Purchase records snapshot received:', snapshot.docs.length, 'documents');
        const history = snapshot.docs.map(doc => {
          const data = doc.data();
          
          // Extract items for display
          const items = data.items || [];
          const firstItem = items[0] || {};
          
          return {
            id: doc.id,
            purchaseRecordId: data.purchaseRecordId,
            supplierName: data.supplierName,
            // Use first item details for display, or fallback to record-level data
            itemName: firstItem.itemName || data.itemName || 'Multiple Items',
            productCategory: firstItem.productCategory || data.productCategory,
            productVersion: firstItem.productVersion || data.productVersion,
            quantity: firstItem.quantity || data.quantity,
            unit: firstItem.unit || data.unit,
            // Dates
            purchaseDate: data.purchaseDate?.toDate()?.toISOString().split('T')[0] || 
                          data.expenseDate?.toDate()?.toISOString().split('T')[0] || 
                          data.createdAt?.toDate()?.toISOString().split('T')[0] || 
                          new Date().toISOString().split('T')[0],
            // Amounts
            totalAmount: data.totalAmount || data.totalAmountAfterTax || data.totalAmountINR || data.amount || 0,
            subtotal: data.subtotal || 0,
            totalTaxAmount: data.totalTaxAmount || 0,
            // Status
            status: data.purchaseStatus || 'completed',
            // Additional details
            description: data.description || data.notes,
            companyCurrency: data.companyCurrency || 'USD',
            // All items for detailed view
            allItems: items,
            itemCount: items.length || 1
          };
        })
        .sort((a, b) => {
          const dateA = new Date(a.purchaseDate).getTime();
          const dateB = new Date(b.purchaseDate).getTime();
          return dateB - dateA;
        });
        
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

  // Filter and paginate purchase history with enhanced details
  const getFilteredPurchaseHistory = () => {
    let filtered = purchaseHistory;
    
    // Apply search filter
    if (historySearchTerm) {
      const searchLower = historySearchTerm.toLowerCase();
      filtered = filtered.filter(purchase => 
        (purchase.productCategory || '').toLowerCase().includes(searchLower) ||
        (purchase.itemName || '').toLowerCase().includes(searchLower) ||
        (purchase.productVersion || '').toLowerCase().includes(searchLower) ||
        (purchase.supplierName || '').toLowerCase().includes(searchLower) ||
        (purchase.purchaseRecordId || '').toLowerCase().includes(searchLower)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (historySortBy === 'date') {
        const dateA = new Date(a.purchaseDate).getTime();
        const dateB = new Date(b.purchaseDate).getTime();
        return dateB - dateA; // Newest first
      }
      return 0;
    });
    
    // Apply pagination
    const startIndex = (historyCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return {
      items: filtered.slice(startIndex, endIndex),
      totalItems: filtered.length,
      totalPages: Math.ceil(filtered.length / itemsPerPage)
    };
  };

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

  // Enhanced history item renderer with purchase_records data and Details button
  const renderHistoryItem = (purchase: any) => {
    const formatCurrency = (amount: number) => {
      const symbol = purchase.companyCurrency === 'INR' ? '₹' : '$';
      return `${symbol}${amount.toFixed(2)}`;
    };

    const handleViewDetails = () => {
      setSelectedPurchase(purchase);
      setIsDetailsModalOpen(true);
    };

    return (
      <div key={purchase.id} className="border rounded-lg p-4 hover:bg-gray-50">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-gray-900">{purchase.itemName}</h4>
              {purchase.itemCount > 1 && (
                <Badge variant="outline" className="text-xs">
                  +{purchase.itemCount - 1} more items
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Purchase ID:</span> {purchase.purchaseRecordId}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Supplier:</span> {purchase.supplierName || 'N/A'}
              </p>
              {purchase.productCategory && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Category:</span> {purchase.productCategory}
                </p>
              )}
              {purchase.productVersion && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Version:</span> {purchase.productVersion}
                </p>
              )}
              <p className="text-sm text-gray-600">
                <span className="font-medium">Quantity:</span> {purchase.quantity || 'N/A'} {purchase.unit || ''}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Total Amount:</span> {formatCurrency(purchase.totalAmount)}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="default">
              <CheckCircle className="w-3 h-3 mr-1" />
              {purchase.status}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewDetails}
              className="flex items-center gap-1"
            >
              <Eye className="w-3 h-3" />
              Details
            </Button>
          </div>
        </div>
        {purchase.description && (
          <p className="text-sm text-gray-600 mb-3">{purchase.description}</p>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Purchased: {purchase.purchaseDate}</span>
          {purchase.subtotal && purchase.totalTaxAmount && (
            <span>Subtotal: {formatCurrency(purchase.subtotal)} | Tax: {formatCurrency(purchase.totalTaxAmount)}</span>
          )}
        </div>
      </div>
    );
  };

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

  const renderHistoryPagination = (historyData: any) => {
    if (historyData.totalPages <= 1) return null;

    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => setHistoryCurrentPage(Math.max(1, historyCurrentPage - 1))}
              className={historyCurrentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
          
          {Array.from({ length: historyData.totalPages }, (_, i) => i + 1).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => setHistoryCurrentPage(page)}
                isActive={historyCurrentPage === page}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => setHistoryCurrentPage(Math.min(historyData.totalPages, historyCurrentPage + 1))}
              className={historyCurrentPage === historyData.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
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

  const historyData = getFilteredPurchaseHistory();

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

        {/* Enhanced Purchase History */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase History</CardTitle>
            <div className="flex gap-4 items-center mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search purchase history..."
                  value={historySearchTerm}
                  onChange={(e) => {
                    setHistorySearchTerm(e.target.value);
                    setHistoryCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <select
                value={historySortBy}
                onChange={(e) => {
                  setHistorySortBy(e.target.value);
                  setHistoryCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="date">Sort by Date</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {historyData.items.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {historySearchTerm ? 'No matching purchase history found' : 'No purchase history found'}
                </p>
              ) : (
                historyData.items.map(renderHistoryItem)
              )}
              {renderHistoryPagination(historyData)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Details Modal */}
      <PurchaseDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        purchase={selectedPurchase}
      />
    </div>
  );
};

export default EmployeePurchases;

import { useState, useEffect } from 'react';
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
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

const EmployeePurchases = () => {
  const { currentUser } = useAuth();
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
            companyId: data.companyId, // Include companyId for filtering
            requestDate: data.createdAt?.toDate()?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
            approvedDate: data.approvedAt?.toDate()?.toISOString().split('T')[0],
            rejectedDate: data.rejectedAt?.toDate()?.toISOString().split('T')[0],
            sentDate: data.sentAt?.toDate()?.toISOString().split('T')[0]
          };
        })
        // Filter by company and sort in memory
        .filter(req => req.companyId === currentUser.companyId)
        .sort((a, b) => {
          const dateA = new Date(a.requestDate).getTime();
          const dateB = new Date(b.requestDate).getTime();
          return dateB - dateA; // Descending order (newest first)
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

    // Use simpler query to avoid compound index requirement
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
        // Sort in memory instead of using orderBy
        .sort((a, b) => {
          const dateA = new Date(a.purchaseDate).getTime();
          const dateB = new Date(b.purchaseDate).getTime();
          return dateB - dateA; // Descending order (newest first)
        })
        .slice(0, 20); // Limit to recent 20 records
        
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
    return purchaseRequests.filter(req => req.status === status).slice(0, 5);
  };

  const limitedPurchaseHistory = purchaseHistory.slice(0, 5);

  const renderRequestItem = (request: any) => (
    <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-medium text-gray-900">{request.itemName || request.productName || 'N/A'}</h4>
          <p className="text-sm text-gray-500">
            Qty: {request.quantity || 'N/A'} | ₹{(request.estimatedCost || request.totalAmount || 0).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${getPriorityColor(request.priority || 'medium')}`}>
            {(request.priority || 'MEDIUM').toUpperCase()}
          </span>
          <Badge variant={getStatusBadgeVariant(request.status || 'pending')}>
            {getStatusIcon(request.status || 'pending')}
            <span className="ml-1">{request.status || 'pending'}</span>
          </Badge>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-2">{request.reason || request.notes || 'No reason provided'}</p>
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
        <Button size="sm" variant="outline">
          <Eye className="w-3 h-3 mr-1" />
          View
        </Button>
      </div>
    </div>
  );

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
                {purchaseRequests.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No purchase requests found</p>
                ) : (
                  purchaseRequests.slice(0, 5).map(renderRequestItem)
                )}
              </TabsContent>
              
              <TabsContent value="pending" className="space-y-4 mt-4">
                {filterRequestsByStatus('pending').length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No pending requests</p>
                ) : (
                  filterRequestsByStatus('pending').map(renderRequestItem)
                )}
              </TabsContent>
              
              <TabsContent value="approved" className="space-y-4 mt-4">
                {filterRequestsByStatus('approved').length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No approved requests</p>
                ) : (
                  filterRequestsByStatus('approved').map(renderRequestItem)
                )}
              </TabsContent>
              
              <TabsContent value="rejected" className="space-y-4 mt-4">
                {filterRequestsByStatus('rejected').length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No rejected requests</p>
                ) : (
                  filterRequestsByStatus('rejected').map(renderRequestItem)
                )}
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
                {limitedPurchaseHistory.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No purchase history found</p>
                ) : (
                  limitedPurchaseHistory.map(renderHistoryItem)
                )}
              </TabsContent>
              
              <TabsContent value="all" className="space-y-4 mt-4">
                {purchaseHistory.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No purchase history found</p>
                ) : (
                  purchaseHistory.slice(0, 10).map(renderHistoryItem)
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeePurchases;


import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  Search,
  Package,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { collection, getDocs, query, where, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';

interface PurchaseRequest {
  id: string;
  companyId: string;
  employeeName: string;
  employeeEmail: string;
  productCategory: string;
  itemName: string;
  productVersion: string;
  stockStatus: string;
  quantityRequired: number;
  unit: string;
  requestedDate: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseRequests = () => {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const fetchPurchaseRequests = async () => {
    if (!currentUser?.companyId) return;

    try {
      const requestsCollection = collection(db, 'purchase_requests');
      const q = query(
        requestsCollection, 
        where('companyId', '==', currentUser.companyId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      const fetchedRequests = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          requestedDate: data.requestedDate?.toDate() || new Date()
        };
      }) as PurchaseRequest[];

      setRequests(fetchedRequests);
    } catch (error) {
      console.error('Error fetching purchase requests:', error);
      toast({
        title: "Error",
        description: "Failed to load purchase requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseRequests();
  }, [currentUser?.companyId]);

  const handleUpdateStatus = async (requestId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const requestRef = doc(db, 'purchase_requests', requestId);
      await updateDoc(requestRef, {
        status: newStatus,
        updatedAt: new Date()
      });

      // Update local state
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: newStatus, updatedAt: new Date() }
          : req
      ));

      toast({
        title: "Status Updated",
        description: `Request has been ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating request status:', error);
      toast({
        title: "Error",
        description: "Failed to update request status",
        variant: "destructive"
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.productCategory.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate summary statistics
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const approvedRequests = requests.filter(r => r.status === 'approved').length;
  const criticalStockRequests = requests.filter(r => r.stockStatus === 'critical').length;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading purchase requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header - Removed "New Request" button */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Requests</h1>
          <p className="text-gray-600 mt-2">Review and manage employee purchase requests</p>
        </div>

        {/* Summary Cards - Moved upward */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold">{totalRequests}</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Package className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingRequests}</p>
                </div>
                <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{approvedRequests}</p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Critical Stock</p>
                  <p className="text-2xl font-bold text-red-600">{criticalStockRequests}</p>
                </div>
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by employee, item name, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Employee Info */}
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Employee Details</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Name:</span> {request.employeeName}</p>
                      <p><span className="font-medium">Email:</span> {request.employeeEmail}</p>
                      <p><span className="font-medium">Request Date:</span> {format(request.createdAt, 'PPP')}</p>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Product Details</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Category:</span> {request.productCategory}</p>
                      <p><span className="font-medium">Item:</span> {request.itemName}</p>
                      <p><span className="font-medium">Version:</span> {request.productVersion}</p>
                      <p><span className="font-medium">Stock Status:</span> 
                        <span className={`ml-1 capitalize ${
                          request.stockStatus === 'critical' ? 'text-red-600' :
                          request.stockStatus === 'low' ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {request.stockStatus}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Request Info */}
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Request Details</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Quantity Required:</span> {request.quantityRequired} {request.unit}</p>
                      <p><span className="font-medium">Requested Date:</span> {format(request.requestedDate, 'PPP')}</p>
                      <p><span className="font-medium">Reason:</span> {request.reason}</p>
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-4">
                      {getStatusIcon(request.status)}
                      <Badge variant={getStatusBadgeVariant(request.status)}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex flex-col gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleUpdateStatus(request.id, 'approved')}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          ✅ Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleUpdateStatus(request.id, 'rejected')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          ❌ Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRequests.length === 0 && !loading && (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No purchase requests found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'No employee purchase requests have been submitted yet.'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PurchaseRequests;

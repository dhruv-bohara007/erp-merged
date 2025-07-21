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
  AlertTriangle,
  MessageSquare,
  Edit,
  Save,
  X
} from 'lucide-react';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import ChatHistoryModal from '@/components/ChatHistoryModal';
import { syncPurchaseRequestStatus } from '@/services/stockSyncService';

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
  status: 'pending' | 'approved' | 'rejected' | 'PO Created';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseRequestsAdmin = () => {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingQuantity, setEditingQuantity] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const fetchPurchaseRequests = async () => {
    if (!currentUser?.companyId) return;

    try {
      const requestsCollection = collection(db, 'purchase_requests');
      // Remove orderBy to avoid composite index requirement
      const q = query(
        requestsCollection, 
        where('companyId', '==', currentUser.companyId)
      );
      const snapshot = await getDocs(q);
      
      const fetchedRequests = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          requestedDate: data.requestedDate?.toDate() || new Date(),
          priority: data.priority || 'medium' // Default to medium if not set
        };
      }) as PurchaseRequest[];

      // Sort in memory instead of using orderBy
      fetchedRequests.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

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
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      const requestRef = doc(db, 'purchase_requests', requestId);
      await updateDoc(requestRef, {
        status: newStatus,
        updatedAt: new Date()
      });

      // Sync with stock_details
      await syncPurchaseRequestStatus(
        request.companyId,
        request.productCategory,
        request.itemName,
        request.productVersion,
        newStatus,
        request.quantityRequired
      );

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

  const handleQuantityEdit = (requestId: string, currentQuantity: number) => {
    const request = requests.find(r => r.id === requestId);
    // Disable editing if request is approved, rejected, or PO created
    if (request && ['approved', 'rejected', 'PO Created'].includes(request.status)) {
      toast({
        title: "Cannot Edit",
        description: "Cannot edit quantity for approved, rejected, or PO created requests",
        variant: "destructive"
      });
      return;
    }
    
    setEditingQuantity(requestId);
    setEditValue(currentQuantity.toString());
  };

  const handleQuantitySave = async (requestId: string) => {
    const newQuantity = parseFloat(editValue);
    if (isNaN(newQuantity) || newQuantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid positive number",
        variant: "destructive"
      });
      return;
    }

    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      const oldQuantity = request.quantityRequired;
      
      const requestRef = doc(db, 'purchase_requests', requestId);
      await updateDoc(requestRef, {
        quantityRequired: newQuantity,
        updatedAt: new Date()
      });

      // Sync with stock_details
      await syncPurchaseRequestStatus(
        request.companyId,
        request.productCategory,
        request.itemName,
        request.productVersion,
        request.status,
        newQuantity,
        oldQuantity
      );

      // Update local state immediately
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, quantityRequired: newQuantity, updatedAt: new Date() }
          : req
      ));

      setEditingQuantity(null);
      setEditValue('');

      toast({
        title: "Quantity Updated",
        description: "Quantity has been successfully updated",
      });
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive"
      });
    }
  };

  const handleQuantityCancel = () => {
    setEditingQuantity(null);
    setEditValue('');
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'PO Created': return 'outline';
      default: return 'secondary';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'secondary';
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

  // Check if quantity editing should be disabled
  const isQuantityEditDisabled = (request: PurchaseRequest) => {
    return ['approved', 'rejected', 'PO Created'].includes(request.status);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Purchase Requests</h1>
            <p className="text-gray-600 mt-2">Review and manage employee purchase requests</p>
          </div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => window.location.href = '/create-purchase-order?fromRequest=true'}
          >
            <Package className="w-4 h-4 mr-2" />
            Create PO from Request
          </Button>
        </div>

        {/* Summary Cards */}
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
                <option value="PO Created">PO Created</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Product Details</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Stock Status</TableHead>
                  <TableHead>Requested Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Chat History</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="font-mono text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {request.id.slice(0, 8)}...
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.employeeName}</p>
                        <p className="text-sm text-gray-500">{request.employeeEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.itemName}</p>
                        <p className="text-sm text-gray-500">{request.productCategory}</p>
                        <p className="text-xs text-gray-400">{request.productVersion}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {editingQuantity === request.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-20"
                            min="1"
                            step="1"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleQuantitySave(request.id)}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleQuantityCancel}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>{request.quantityRequired} {request.unit}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleQuantityEdit(request.id, request.quantityRequired)}
                            disabled={isQuantityEditDisabled(request)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityBadgeVariant(request.priority)}>
                        {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          request.stockStatus === 'critical' ? 'destructive' :
                          request.stockStatus === 'low' ? 'secondary' : 'default'
                        }
                      >
                        {request.stockStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(request.requestedDate, 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={request.reason}>
                        {request.reason}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <ChatHistoryModal
                          itemId={request.id}
                          itemName={request.itemName}
                          productCategory={request.productCategory}
                          isAdmin={true}
                          targetEmployeeEmail={request.employeeEmail}
                        >
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="w-full"
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Chat History
                          </Button>
                        </ChatHistoryModal>
                        {request.status === 'rejected' && (
                          <Badge variant="destructive" className="self-start">
                            Rejected
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleUpdateStatus(request.id, 'approved')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            ✅ Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleUpdateStatus(request.id, 'rejected')}
                          >
                            ❌ Reject
                          </Button>
                        </div>
                      )}
                      {request.status === 'approved' && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Approved
                        </Badge>
                      )}
                      {request.status === 'rejected' && (
                        <Badge variant="destructive">
                          Rejected
                        </Badge>
                      )}
                      {request.status === 'PO Created' && (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">
                          PO Created
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredRequests.length === 0 && (
              <div className="py-12 text-center">
                <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No purchase requests found</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'No employee purchase requests have been submitted yet.'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PurchaseRequestsAdmin;

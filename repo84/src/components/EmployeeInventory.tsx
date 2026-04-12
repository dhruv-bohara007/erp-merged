import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Package, 
  Search,
  AlertTriangle,
  Eye,
  Flag,
  MessageCircle,
  X,
  CalendarIcon,
  ChevronDown,
  CheckCircle,
  XCircle,
  Clock,
  ShoppingCart,
  Trash2
} from 'lucide-react';
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import ChatHistoryModal from './ChatHistoryModal';

interface StockDetailsData {
  id: string;
  companyId: string;
  productCategory: string;
  itemName: string;
  productVersion: string;
  currentStock: number;
  lastPurchaseDate?: Date;
  unit: string;
  minRequired?: number;
  safeQuantityLimit?: number;
  displayStatus: 'displayed' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
  // New fields for purchase request status tracking
  pendingQuantity?: number;
  approvedQuantity?: number;
  poCreatedQuantity?: number;
  rejectedQuantity?: number;
  lastRequestStatus?: 'pending' | 'approved' | 'PO Created' | 'rejected' | 'Order Recorded';
  lastRecordedOrderQuantity?: number;
}

interface FlagRequestData {
  productCategory: string;
  itemName: string;
  productVersion: string;
  status: string;
  unit: string;
  quantity: string;
  reason: string;
  priority: string;
  requestedDate: Date | undefined;
}

interface PurchaseRequest {
  id: string;
  itemName: string;
  productCategory: string;
  productVersion: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  quantityRequired: number;
  createdAt: Date;
}

const EmployeeInventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockStatusSort, setStockStatusSort] = useState<'all' | 'normal' | 'low' | 'critical'>('all');
  const [purchaseStatusSort, setPurchaseStatusSort] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'PO Created'>('all');
  const [stockDetails, setStockDetails] = useState<StockDetailsData[]>([]);
  const [allRequests, setAllRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFlagForm, setShowFlagForm] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockDetailsData | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [flagRequestData, setFlagRequestData] = useState<FlagRequestData>({
    productCategory: '',
    itemName: '',
    productVersion: '',
    status: '',
    unit: '',
    quantity: '',
    reason: '',
    priority: 'medium',
    requestedDate: undefined
  });
  
  const { currentUser } = useAuth();
  const { toast } = useToast();

  // Fetch displayed stock details from Firestore
  const fetchDisplayedStockDetails = async () => {
    if (!currentUser?.companyId) return [];

    try {
      const stockDetailsCollection = collection(db, 'stock_details');
      const q = query(
        stockDetailsCollection, 
        where('companyId', '==', currentUser.companyId),
        where('displayStatus', '==', 'displayed')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastPurchaseDate: data.lastPurchaseDate?.toDate(),
          minRequired: data.minRequired !== undefined ? data.minRequired : 0,
          safeQuantityLimit: data.safeQuantityLimit !== undefined ? data.safeQuantityLimit : 0,
          pendingQuantity: data.pendingQuantity || 0,
          approvedQuantity: data.approvedQuantity || 0,
          poCreatedQuantity: data.poCreatedQuantity || 0,
          rejectedQuantity: data.rejectedQuantity || 0,
          lastRecordedOrderQuantity: data.lastRecordedOrderQuantity || 0
        };
      }) as StockDetailsData[];
    } catch (error) {
      console.error('Error fetching displayed stock details:', error);
      return [];
    }
  };

  // Fetch purchase requests for the current employee only
  const fetchAllRequests = async () => {
    if (!currentUser?.companyId || !currentUser?.email) return [];

    try {
      const purchaseRequestsCollection = collection(db, 'purchase_requests');
      const q = query(
        purchaseRequestsCollection,
        where('companyId', '==', currentUser.companyId),
        where('employeeEmail', '==', currentUser.email)
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          itemName: data.itemName,
          productCategory: data.productCategory,
          productVersion: data.productVersion,
          status: data.status,
          priority: data.priority || 'medium',
          quantityRequired: data.quantityRequired || 0,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      }) as PurchaseRequest[];
    } catch (error) {
      console.error('Error fetching employee requests:', error);
      return [];
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [displayedStock, requests] = await Promise.all([
        fetchDisplayedStockDetails(),
        fetchAllRequests()
      ]);
      setStockDetails(displayedStock);
      setAllRequests(requests);
      setLoading(false);
    };

    loadData();
  }, [currentUser?.companyId]);

  // Calculate status based on new logic - moved earlier to fix hoisting issue
  const getItemStatus = (item: StockDetailsData) => {
    const { currentStock, minRequired = 0, safeQuantityLimit = 0 } = item;
    
    if (currentStock >= minRequired) {
      return 'normal';
    } else if (currentStock <= safeQuantityLimit) {
      return 'critical';
    } else {
      return 'low';
    }
  };

  const categories = ['all', ...Array.from(new Set(stockDetails.map(item => item.productCategory)))];

  const filteredInventory = stockDetails.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.productCategory.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.productCategory === selectedCategory;
    
    // Stock status filter
    const stockStatus = getItemStatus(item);
    const matchesStockStatus = stockStatusSort === 'all' || stockStatus === stockStatusSort;
    
    // Purchase status filter
    const matchesPurchaseStatus = purchaseStatusSort === 'all' || item.lastRequestStatus === purchaseStatusSort;
    
    return matchesSearch && matchesCategory && matchesStockStatus && matchesPurchaseStatus;
  });

  // Get product price from stock details
  const getProductPrice = (category: string, name: string, version: string): number => {
    const product = stockDetails.find(p => 
      p.productCategory === category && 
      p.itemName === name && 
      p.productVersion === version
    );
    return (product as any)?.pricePerUnit || 0;
  };

  // Check if Flag Low button should be disabled
  const isFlagLowDisabled = (item: StockDetailsData) => {
    const status = item.lastRequestStatus;
    // Flag Low button is enabled when there's no active request or when order has been recorded
    return status === 'pending' || status === 'approved' || status === 'PO Created';
  };

  // Get the most recent request for an item
  const getItemRequest = (item: StockDetailsData) => {
    const itemRequests = allRequests.filter(req => 
      req.itemName === item.itemName &&
      req.productCategory === item.productCategory &&
      req.productVersion === item.productVersion
    );
    
    // Return the most recent request
    return itemRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600';
      case 'low': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'normal': return 'default';
      case 'low': return 'secondary';
      case 'critical': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleFlagLowClick = (item: StockDetailsData) => {
    setSelectedItem(item);
    setShowPriorityDropdown(true);
  };

  const handlePrioritySelect = (priority: 'low' | 'medium' | 'high') => {
    if (!selectedItem) return;
    
    const status = getItemStatus(selectedItem);
    setSelectedPriority(priority);
    setFlagRequestData({
      productCategory: selectedItem.productCategory,
      itemName: selectedItem.itemName,
      productVersion: selectedItem.productVersion,
      status: status,
      priority: priority,
      unit: '',
      quantity: '',
      reason: '',
      requestedDate: undefined
    });
    setShowPriorityDropdown(false);
    setShowFlagForm(true);
  };

  // Update stock_details after successful purchase request
  const updateStockDetailsAfterRequest = async (requestData: any) => {
    try {
      const stockDetailsCollection = collection(db, 'stock_details');
      const q = query(
        stockDetailsCollection,
        where('companyId', '==', currentUser?.companyId),
        where('productCategory', '==', requestData.productCategory),
        where('itemName', '==', requestData.itemName),
        where('productVersion', '==', requestData.productVersion)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const stockDoc = snapshot.docs[0];
        const stockData = stockDoc.data();
        
        // Update quantities based on status
        const updateData: any = {
          lastRequestStatus: requestData.status,
          updatedAt: new Date()
        };
        
        // Add to pending quantity
        if (requestData.status === 'pending') {
          updateData.pendingQuantity = (stockData.pendingQuantity || 0) + requestData.quantityRequired;
        }
        
        await updateDoc(doc(db, 'stock_details', stockDoc.id), updateData);
        
        // Update local state
        setStockDetails(prev => prev.map(item => 
          item.id === stockDoc.id 
            ? { 
                ...item, 
                lastRequestStatus: requestData.status as any,
                pendingQuantity: updateData.pendingQuantity || item.pendingQuantity,
                updatedAt: new Date()
              }
            : item
        ));
      }
    } catch (error) {
      console.error('Error updating stock details:', error);
    }
  };

  const handleSendRequest = async () => {
    if (!currentUser?.companyId || !flagRequestData.quantity || !flagRequestData.reason || !flagRequestData.unit || !flagRequestData.requestedDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get pricePerUnit from stock_details
      const pricePerUnit = getProductPrice(flagRequestData.productCategory, flagRequestData.itemName, flagRequestData.productVersion);

      const newRequest = {
        companyId: currentUser.companyId,
        employeeName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Unknown',
        employeeEmail: currentUser.email,
        productCategory: flagRequestData.productCategory,
        itemName: flagRequestData.itemName,
        productVersion: flagRequestData.productVersion,
        stockStatus: flagRequestData.status,
        quantityRequired: parseInt(flagRequestData.quantity),
        unit: flagRequestData.unit,
        requestedDate: flagRequestData.requestedDate,
        reason: flagRequestData.reason,
        priority: flagRequestData.priority,
        pricePerUnit: pricePerUnit,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'purchase_requests'), newRequest);

      // Update stock_details with new request data
      await updateStockDetailsAfterRequest({
        ...newRequest,
        quantityRequired: parseInt(flagRequestData.quantity)
      });

      // Add to local state for immediate UI update
      const newPurchaseRequest: PurchaseRequest = {
        id: Date.now().toString(),
        itemName: flagRequestData.itemName,
        productCategory: flagRequestData.productCategory,
        productVersion: flagRequestData.productVersion,
        status: 'pending',
        priority: flagRequestData.priority as 'low' | 'medium' | 'high',
        quantityRequired: parseInt(flagRequestData.quantity),
        createdAt: new Date()
      };

      setAllRequests(prev => [...prev, newPurchaseRequest]);

      toast({
        title: "Request Sent",
        description: `Purchase request sent to admin for: ${flagRequestData.itemName}`
      });
      
      handleCancelRequest();
    } catch (error) {
      console.error('Error sending request:', error);
      toast({
        title: "Error",
        description: "Failed to send request. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCancelRequest = () => {
    setShowFlagForm(false);
    setShowPriorityDropdown(false);
    setSelectedItem(null);
    setFlagRequestData({
      productCategory: '',
      itemName: '',
      productVersion: '',
      status: '',
      unit: '',
      quantity: '',
      reason: '',
      priority: 'medium',
      requestedDate: undefined
    });
  };

  // Delete pending purchase request
  const handleDeleteRequest = async (item: StockDetailsData) => {
    if (!currentUser?.companyId || !currentUser?.email) return;

    try {
      // Find the pending request for this item
      const purchaseRequestsCollection = collection(db, 'purchase_requests');
      const q = query(
        purchaseRequestsCollection,
        where('companyId', '==', currentUser.companyId),
        where('employeeEmail', '==', currentUser.email),
        where('productCategory', '==', item.productCategory),
        where('itemName', '==', item.itemName),
        where('productVersion', '==', item.productVersion),
        where('status', '==', 'pending')
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const requestDoc = snapshot.docs[0];
        const requestData = requestDoc.data();
        
        // Delete the request document
        await deleteDoc(doc(db, 'purchase_requests', requestDoc.id));
        
        // Update stock_details to rollback pendingQuantity
        const stockDetailsCollection = collection(db, 'stock_details');
        const stockQuery = query(
          stockDetailsCollection,
          where('companyId', '==', currentUser.companyId),
          where('productCategory', '==', item.productCategory),
          where('itemName', '==', item.itemName),
          where('productVersion', '==', item.productVersion)
        );
        
        const stockSnapshot = await getDocs(stockQuery);
        
        if (!stockSnapshot.empty) {
          const stockDoc = stockSnapshot.docs[0];
          const stockData = stockDoc.data();
          
          // Reduce pending quantity and update lastRequestStatus
          const updateData: any = {
            pendingQuantity: Math.max(0, (stockData.pendingQuantity || 0) - (requestData.quantityRequired || 0)),
            updatedAt: new Date()
          };
          
          // If no more pending quantity, clear the lastRequestStatus
          if (updateData.pendingQuantity === 0) {
            updateData.lastRequestStatus = null;
          }
          
          await updateDoc(doc(db, 'stock_details', stockDoc.id), updateData);
          
          // Update local state
          setStockDetails(prev => prev.map(stockItem => 
            stockItem.id === stockDoc.id 
              ? { 
                  ...stockItem, 
                  pendingQuantity: updateData.pendingQuantity,
                  lastRequestStatus: updateData.lastRequestStatus,
                  updatedAt: new Date()
                }
              : stockItem
          ));
        }
        
        // Remove from local allRequests state
        setAllRequests(prev => prev.filter(req => req.id !== requestDoc.id));
        
        toast({
          title: "Request Deleted",
          description: `Purchase request for ${item.itemName} has been deleted successfully.`
        });
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      toast({
        title: "Error",
        description: "Failed to delete request. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Calculate summary stats
  const totalItems = stockDetails.length;
  const lowStockItems = stockDetails.filter(item => {
    const status = getItemStatus(item);
    return status === 'low';
  }).length;
  const criticalStockItems = stockDetails.filter(item => {
    const status = getItemStatus(item);
    return status === 'critical';
  }).length;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Inventory Overview</h1>
            <p className="text-gray-600 mt-2">View current stock levels and flag low stock items</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Items</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
              <p className="text-xs text-gray-500">Displayed items</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{lowStockItems}</div>
              <p className="text-xs text-gray-500">Items need restocking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Critical Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{criticalStockItems}</div>
              <p className="text-xs text-gray-500">Immediate attention needed</p>
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
                  placeholder="Search inventory items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
              <select
                value={stockStatusSort}
                onChange={(e) => setStockStatusSort(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Stock Status</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
                <option value="critical">Critical</option>
              </select>
              <select
                value={purchaseStatusSort}
                onChange={(e) => setPurchaseStatusSort(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Purchase Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="PO Created">PO Created</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInventory.map((item) => {
            const status = getItemStatus(item);
            const isRequestDisabled = isFlagLowDisabled(item);
            
            return (
              <Card key={item.id} className={`border-l-4 ${
                status === 'critical' ? 'border-l-red-500' :
                status === 'low' ? 'border-l-yellow-500' : 'border-l-green-500'
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{item.itemName}</CardTitle>
                      <p className="text-sm text-gray-500">{item.productCategory}</p>
                      {item.productVersion && item.productVersion !== 'N/A' && (
                        <p className="text-xs text-gray-400">{item.productVersion}</p>
                      )}
                    </div>
                    <Badge variant={getStatusBadgeVariant(status)}>
                      {status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Request Status Display - Only show if there's a last request status */}
                    {item.lastRequestStatus && (
                      <div className={`border rounded-lg p-3 ${
                        item.lastRequestStatus === 'pending' ? 'bg-yellow-50 border-yellow-200' :
                         item.lastRequestStatus === 'approved' ? 'bg-green-50 border-green-200' :
                         item.lastRequestStatus === 'PO Created' ? 'bg-blue-50 border-blue-200' :
                         item.lastRequestStatus === 'Order Recorded' ? 'bg-purple-50 border-purple-200' :
                         'bg-red-50 border-red-200'
                      }`}>
                         <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {item.lastRequestStatus === 'pending' && (
                              <>
                                <Clock className="h-4 w-4 text-yellow-600" />
                                <span className="text-sm font-medium text-yellow-800">Request Pending</span>
                              </>
                            )}
                            {item.lastRequestStatus === 'approved' && (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-800">Request Approved</span>
                              </>
                            )}
                             {item.lastRequestStatus === 'PO Created' && (
                               <>
                                 <ShoppingCart className="h-4 w-4 text-blue-600" />
                                 <span className="text-sm font-medium text-blue-800">PO Created</span>
                               </>
                             )}
                             {item.lastRequestStatus === 'Order Recorded' && (
                               <>
                                 <CheckCircle className="h-4 w-4 text-purple-600" />
                                 <span className="text-sm font-medium text-purple-800">Order Recorded</span>
                               </>
                             )}
                             {item.lastRequestStatus === 'rejected' && (
                               <>
                                 <XCircle className="h-4 w-4 text-red-600" />
                                 <span className="text-sm font-medium text-red-800">Request Rejected</span>
                               </>
                             )}
                          </div>
                          {item.lastRequestStatus === 'pending' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteRequest(item)}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Current Stock:</span>
                      <span className={`font-semibold ${getStatusColor(status)}`}>
                        {item.currentStock} {item.unit}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Min Required:</span>
                      <span className="font-medium">{item.minRequired || 0} {item.unit}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Safe Limit:</span>
                      <span className="font-medium">{item.safeQuantityLimit || 0} {item.unit}</span>
                    </div>
                    
                     {/* Display last recorded order quantity if available */}
                     {(item.lastRecordedOrderQuantity || 0) > 0 && (
                       <div className="flex justify-between items-center">
                         <span className="text-sm text-gray-600">Last Order Quantity:</span>
                         <span className="font-medium text-purple-600">{item.lastRecordedOrderQuantity || 0} {item.unit}</span>
                       </div>
                     )}
                     
                     {/* Display quantities based on status */}
                     {((item.pendingQuantity || 0) > 0 || (item.approvedQuantity || 0) > 0 || (item.poCreatedQuantity || 0) > 0 || (item.rejectedQuantity || 0) > 0) && (
                       <div className="border-t pt-3 space-y-2">
                        {/* Show pending quantity if there's a pending request */}
                        {(item.pendingQuantity || 0) > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Pending Request:</span>
                            <span className="font-medium text-yellow-600">{item.pendingQuantity || 0} {item.unit}</span>
                          </div>
                        )}
                        
                        {/* Show approved quantity if there's an approved request */}
                        {(item.approvedQuantity || 0) > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Approved Quantity:</span>
                            <span className="font-medium text-green-600">{item.approvedQuantity || 0} {item.unit}</span>
                          </div>
                        )}
                        
                        {/* Show PO created quantity if there's a PO created */}
                        {(item.poCreatedQuantity || 0) > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">PO Created Quantity:</span>
                            <span className="font-medium text-blue-600">{item.poCreatedQuantity || 0} {item.unit}</span>
                          </div>
                        )}
                        
                        {/* Show rejected quantity if there's a rejected request */}
                        {(item.rejectedQuantity || 0) > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Rejected Quantity:</span>
                            <span className="font-medium text-red-600">{item.rejectedQuantity || 0} {item.unit}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <ChatHistoryModal
                        itemId={item.id}
                        itemName={item.itemName}
                        productCategory={item.productCategory}
                      >
                        <Button size="sm" variant="outline" className="flex-1">
                          <MessageCircle className="w-3 h-3 mr-1" />
                          Chat History
                        </Button>
                      </ChatHistoryModal>
                      {(status === 'low' || status === 'critical') && (
                        <div className="relative flex-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleFlagLowClick(item)}
                            className="w-full"
                            disabled={isRequestDisabled}
                          >
                            <Flag className="w-3 h-3 mr-1" />
                            Flag Low
                            <ChevronDown className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredInventory.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </CardContent>
          </Card>
        )}

        {/* Priority Selection Dropdown */}
        {showPriorityDropdown && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Select Priority Level</h3>
                <Button variant="ghost" size="sm" onClick={handleCancelRequest}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Choose the priority level for your purchase request:
              </p>

              <div className="space-y-2">
                {(['high', 'medium', 'low'] as const).map((priority) => (
                  <Button
                    key={priority}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handlePrioritySelect(priority)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        priority === 'high' ? 'bg-red-500' :
                        priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                      <div className="text-left">
                        <div className="font-medium capitalize">{priority}</div>
                        <div className="text-xs text-gray-500">
                          {priority === 'high' ? 'Immediate attention needed' :
                           priority === 'medium' ? 'Standard processing time' :
                           'Can wait for regular ordering cycle'}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Flag Low Stock Form Modal */}
        {showFlagForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Purchase Request</h3>
                <Button variant="ghost" size="sm" onClick={handleCancelRequest}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Category
                    </label>
                    <Input
                      value={flagRequestData.productCategory}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item Name
                    </label>
                    <Input
                      value={flagRequestData.itemName}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Version
                    </label>
                    <Input
                      value={flagRequestData.productVersion}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                      <div className={`w-2 h-2 rounded-full ${
                        flagRequestData.priority === 'high' ? 'bg-red-500' :
                        flagRequestData.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                      <span className="capitalize font-medium">{flagRequestData.priority}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity Required *
                    </label>
                    <Input
                      type="number"
                      value={flagRequestData.quantity}
                      onChange={(e) => setFlagRequestData(prev => ({ ...prev, quantity: e.target.value }))}
                      placeholder="Enter quantity"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit *
                    </label>
                    <Select value={flagRequestData.unit} onValueChange={(value) => setFlagRequestData(prev => ({ ...prev, unit: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pieces">Pieces</SelectItem>
                        <SelectItem value="kg">Kilograms</SelectItem>
                        <SelectItem value="liters">Liters</SelectItem>
                        <SelectItem value="boxes">Boxes</SelectItem>
                        <SelectItem value="meters">Meters</SelectItem>
                        <SelectItem value="units">Units</SelectItem>
                        <SelectItem value="packs">Packs</SelectItem>
                        <SelectItem value="sets">Sets</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Required Date *
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !flagRequestData.requestedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {flagRequestData.requestedDate ? format(flagRequestData.requestedDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[60]" align="start">
                      <Calendar
                        mode="single"
                        selected={flagRequestData.requestedDate}
                        onSelect={(date) => setFlagRequestData(prev => ({ ...prev, requestedDate: date }))}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Request *
                  </label>
                  <Textarea
                    value={flagRequestData.reason}
                    onChange={(e) => setFlagRequestData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Enter reason for this request"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleSendRequest}
                    className="flex-1"
                    disabled={!flagRequestData.quantity || !flagRequestData.reason || !flagRequestData.unit || !flagRequestData.requestedDate}
                  >
                    Send Request to Admin
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCancelRequest}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeInventory;

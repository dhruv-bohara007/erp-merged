import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Package,
  TrendingUp,
  Calendar,
  Save,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Settings,
  Info
} from 'lucide-react';
import SupplierQuantityModal from '@/components/SupplierQuantityModal';


import { useCompanyData } from '@/hooks/useCompanyData';
import { collection, doc, setDoc, getDocs, query, where, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface StockDetailsData {
  id: string;
  companyId: string;
  productCategory: string;
  itemName: string;
  productVersion: string;
  currentStock: number;
  pricePerUnit?: number;
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
  lastRequestStatus?: 'pending' | 'approved' | 'po_created' | 'rejected';
}

const StockDetails = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'category' | 'name' | 'version' | 'stock' | 'none'>('none');
  const [stockDetails, setStockDetails] = useState<StockDetailsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFields, setEditingFields] = useState<{[key: string]: {minRequired?: string, safeQuantityLimit?: string}}>({});
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<{
    itemName: string;
    productVersion: string;
    productCategory: string;
    unit: string;
  } | null>(null);
  
  
  
  const { companyData } = useCompanyData();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  // Generate stock details from purchase_records and update with purchase_requests data
  const generateStockDetails = async () => {
    if (!currentUser?.companyId) return;

    const stockData: Record<string, StockDetailsData> = {};

    // Get data from purchase_records only
    try {
      const purchaseRecordsCollection = collection(db, 'purchase_records');
      const purchaseQuery = query(purchaseRecordsCollection, where('companyId', '==', currentUser.companyId));
      const purchaseSnapshot = await getDocs(purchaseQuery);
      
      purchaseSnapshot.docs.forEach(doc => {
        const purchaseData = doc.data();
        if (purchaseData.itemName && purchaseData.productCategory && purchaseData.productVersion && purchaseData.quantity && purchaseData.quantity > 0) {
          const key = `${purchaseData.productCategory}-${purchaseData.itemName}-${purchaseData.productVersion}`;
          
          if (!stockData[key]) {
            stockData[key] = {
              id: key,
              companyId: currentUser.companyId,
              productCategory: purchaseData.productCategory,
              itemName: purchaseData.itemName,
              productVersion: purchaseData.productVersion,
              currentStock: 0,
              unit: purchaseData.unit || 'pcs',
              minRequired: 0,
              safeQuantityLimit: 0,
              displayStatus: 'suspended', // Default to suspended when both values are zero
              createdAt: new Date(),
              updatedAt: new Date(),
              lastPurchaseDate: purchaseData.purchaseDate || purchaseData.expenseDate,
              pricePerUnit: purchaseData.pricePerUnit || 0,
              pendingQuantity: 0,
              approvedQuantity: 0,
              poCreatedQuantity: 0,
              rejectedQuantity: 0
            };
          }
          
          stockData[key].currentStock += purchaseData.quantity || 0;
          stockData[key].updatedAt = new Date();
          
          // Update last purchase date and price per unit
          const purchaseDate = purchaseData.purchaseDate || purchaseData.expenseDate;
          if (purchaseDate && (!stockData[key].lastPurchaseDate || purchaseDate > stockData[key].lastPurchaseDate)) {
            stockData[key].lastPurchaseDate = purchaseDate;
            stockData[key].pricePerUnit = purchaseData.pricePerUnit || 0;
          }
        }
      });

      // Get purchase requests data and aggregate by status
      const purchaseRequestsCollection = collection(db, 'purchase_requests');
      const requestsQuery = query(purchaseRequestsCollection, where('companyId', '==', currentUser.companyId));
      const requestsSnapshot = await getDocs(requestsQuery);
      
      requestsSnapshot.docs.forEach(doc => {
        const requestData = doc.data();
        if (requestData.itemName && requestData.productCategory && requestData.productVersion) {
          const key = `${requestData.productCategory}-${requestData.itemName}-${requestData.productVersion}`;
          
          if (stockData[key]) {
            const quantity = requestData.quantityRequired || 0;
            const status = requestData.status;
            
            // Aggregate quantities by status
            switch (status) {
              case 'pending':
                stockData[key].pendingQuantity = (stockData[key].pendingQuantity || 0) + quantity;
                break;
              case 'approved':
                stockData[key].approvedQuantity = (stockData[key].approvedQuantity || 0) + quantity;
                break;
              case 'po_created':
                stockData[key].poCreatedQuantity = (stockData[key].poCreatedQuantity || 0) + quantity;
                break;
              case 'rejected':
                stockData[key].rejectedQuantity = (stockData[key].rejectedQuantity || 0) + quantity;
                break;
            }
            
            // Update last request status (most recent)
            const requestDate = requestData.createdAt?.toDate() || new Date();
            if (!stockData[key].lastRequestStatus || requestDate > (stockData[key].updatedAt || new Date())) {
              stockData[key].lastRequestStatus = status;
            }
          }
        }
      });
    } catch (error) {
      console.error('Error fetching purchase records:', error);
    }

    // Save to stock_details collection with merge to preserve existing values
    const stockDetailsCollection = collection(db, 'stock_details');
    
    for (const stockItem of Object.values(stockData)) {
      try {
        const docRef = doc(stockDetailsCollection, stockItem.id);
        const existingDoc = await getDocs(query(collection(db, 'stock_details'), where('id', '==', stockItem.id)));
        
        if (existingDoc.empty) {
          await setDoc(docRef, stockItem);
        } else {
          // Get existing document to check current values
          const existingData = existingDoc.docs[0]?.data();
          const hasValidQuantities = existingData?.minRequired > 0 && existingData?.safeQuantityLimit >= 0;
          
          // Update stock quantities and request data
          const updateData: any = {
            currentStock: stockItem.currentStock,
            updatedAt: stockItem.updatedAt,
            lastPurchaseDate: stockItem.lastPurchaseDate,
            pricePerUnit: stockItem.pricePerUnit,
            pendingQuantity: stockItem.pendingQuantity,
            approvedQuantity: stockItem.approvedQuantity,
            poCreatedQuantity: stockItem.poCreatedQuantity,
            rejectedQuantity: stockItem.rejectedQuantity,
            lastRequestStatus: stockItem.lastRequestStatus
          };
          
          // Ensure items without valid quantities are suspended by default
          // Default to suspended if both minRequired and safeQuantityLimit are zero
          if (!hasValidQuantities || (existingData?.minRequired === 0 && existingData?.safeQuantityLimit === 0)) {
            updateData.displayStatus = 'suspended';
          }
          
          await updateDoc(docRef, updateData);
        }
      } catch (error) {
        console.error('Error saving stock details:', error);
      }
    }

    return Object.values(stockData);
  };

  // Fetch stock details from Firestore
  const fetchStockDetails = async () => {
    if (!currentUser?.companyId) return [];

    try {
      const stockDetailsCollection = collection(db, 'stock_details');
      const q = query(stockDetailsCollection, where('companyId', '==', currentUser.companyId));
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
          rejectedQuantity: data.rejectedQuantity || 0
        };
      }) as StockDetailsData[];
    } catch (error) {
      console.error('Error fetching stock details:', error);
      return [];
    }
  };

  useEffect(() => {
    const loadStockDetails = async () => {
      setLoading(true);
      
      // Always regenerate stock details from purchase_records and purchase_requests
      const newStockDetails = await generateStockDetails();
      if (newStockDetails) {
        const existingStockDetails = await fetchStockDetails();
        setStockDetails(existingStockDetails);
      }
      
      setLoading(false);
    };

    loadStockDetails();
  }, [currentUser?.companyId]);

  // Save field changes with enhanced validation
  const saveFieldChanges = async (itemId: string, fieldType: 'minRequired' | 'safeQuantityLimit') => {
    if (!editingFields[itemId]) return;

    const item = stockDetails.find(s => s.id === itemId);
    if (!item) return;

    const minRequiredValue = fieldType === 'minRequired' 
      ? Number(editingFields[itemId].minRequired || 0)
      : Number(item.minRequired || 0);
    
    const safeQuantityLimitValue = fieldType === 'safeQuantityLimit'
      ? Number(editingFields[itemId].safeQuantityLimit || 0)
      : Number(item.safeQuantityLimit || 0);

    // Validation: Safe Quantity Limit should be less than or equal to Min Required
    if (safeQuantityLimitValue > minRequiredValue) {
      toast({
        title: "Validation Error",
        description: "Safe Quantity Limit should be less than or equal to Min Required.",
        variant: "destructive"
      });
      return;
    }

    try {
      const docRef = doc(db, 'stock_details', itemId);
      const updateData: any = {
        updatedAt: new Date()
      };

      if (fieldType === 'minRequired') {
        updateData.minRequired = minRequiredValue;
      } else {
        updateData.safeQuantityLimit = safeQuantityLimitValue;
      }

      await updateDoc(docRef, updateData);

      // Update local state with the actual saved values
      setStockDetails(prev => prev.map(stockItem => 
        stockItem.id === itemId 
          ? { 
              ...stockItem, 
              ...(fieldType === 'minRequired' ? { minRequired: minRequiredValue } : { safeQuantityLimit: safeQuantityLimitValue }),
              updatedAt: new Date()
            }
          : stockItem
      ));

      // Clear editing state for this field
      setEditingFields(prev => {
        const newState = { ...prev };
        if (newState[itemId]) {
          if (fieldType === 'minRequired') {
            delete newState[itemId].minRequired;
          } else {
            delete newState[itemId].safeQuantityLimit;
          }
          // If no fields are being edited, remove the item entirely
          if (!newState[itemId].minRequired && !newState[itemId].safeQuantityLimit) {
            delete newState[itemId];
          }
        }
        return newState;
      });

      toast({
        title: "Success",
        description: `${fieldType === 'minRequired' ? 'Min Required' : 'Safe Quantity Limit'} updated successfully`
      });
    } catch (error) {
      console.error('Error updating stock details:', error);
      toast({
        title: "Error",
        description: "Failed to update stock details",
        variant: "destructive"
      });
    }
  };

  // Toggle display status
  const toggleDisplayStatus = async (itemId: string) => {
    const item = stockDetails.find(s => s.id === itemId);
    if (!item) return;

    const newStatus = item.displayStatus === 'displayed' ? 'suspended' : 'displayed';

    try {
      const docRef = doc(db, 'stock_details', itemId);
      await updateDoc(docRef, {
        displayStatus: newStatus,
        updatedAt: new Date()
      });

      // Update local state
      setStockDetails(prev => prev.map(stockItem => 
        stockItem.id === itemId 
          ? { ...stockItem, displayStatus: newStatus, updatedAt: new Date() }
          : stockItem
      ));

      toast({
        title: "Success",
        description: `Stock ${newStatus} successfully`
      });
    } catch (error) {
      console.error('Error updating display status:', error);
      toast({
        title: "Error",
        description: "Failed to update display status",
        variant: "destructive"
      });
    }
  };

  // Delete stock item
  const deleteStockItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this stock item?')) return;

    try {
      const docRef = doc(db, 'stock_details', itemId);
      await deleteDoc(docRef);

      // Update local state
      setStockDetails(prev => prev.filter(item => item.id !== itemId));

      toast({
        title: "Success",
        description: "Stock item deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting stock item:', error);
      toast({
        title: "Error",
        description: "Failed to delete stock item",
        variant: "destructive"
      });
    }
  };

  // Check if Display/Suspend button should be enabled
  const isDisplayButtonEnabled = (item: StockDetailsData) => {
    return (item.minRequired !== undefined && item.minRequired !== null && item.minRequired > 0) && 
           (item.safeQuantityLimit !== undefined && item.safeQuantityLimit !== null && item.safeQuantityLimit >= 0);
  };

  // Check if item should default to "Suspend" when both minRequired and safeQuantityLimit are zero
  const shouldDefaultToSuspend = (item: StockDetailsData) => {
    return (item.minRequired === 0 || item.minRequired === undefined || item.minRequired === null) &&
           (item.safeQuantityLimit === 0 || item.safeQuantityLimit === undefined || item.safeQuantityLimit === null);
  };

  // Get the display value for input fields - show editing value or actual saved value
  const getDisplayValue = (item: StockDetailsData, fieldType: 'minRequired' | 'safeQuantityLimit') => {
    const editingValue = editingFields[item.id]?.[fieldType];
    if (editingValue !== undefined) {
      return editingValue;
    }
    
    const actualValue = item[fieldType];
    return actualValue !== undefined && actualValue !== null ? actualValue.toString() : '';
  };

  // Filter and sort stock details
  const filteredStockDetails = stockDetails.filter(item => {
    const matchesSearch = (item.productCategory || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.itemName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.productVersion || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.productCategory === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const sortedStockDetails = [...filteredStockDetails].sort((a, b) => {
    switch (sortBy) {
      case 'category':
        return (a.productCategory || '').localeCompare(b.productCategory || '');
      case 'name':
        return (a.itemName || '').localeCompare(b.itemName || '');
      case 'version':
        return (a.productVersion || '').localeCompare(b.productVersion || '');
      case 'stock':
        return b.currentStock - a.currentStock;
      default:
        return 0;
    }
  });

  // Get unique categories for filter
  const categories = [...new Set(stockDetails.map(item => item.productCategory).filter(Boolean))];

  // Calculate totals
  const totalItems = filteredStockDetails.length;
  const totalStock = filteredStockDetails.reduce((sum, item) => sum + item.currentStock, 0);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading stock details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <p className="text-gray-600 mt-2">Track and manage your inventory stock levels</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Stock Details Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Stock Details ({sortedStockDetails.length})</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search stock..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
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
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Default</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="version">Version</SelectItem>
                  <SelectItem value="stock">Stock</SelectItem>
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
                  <TableHead>Product Category</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Product Version</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Stock Status</TableHead>
                  <TableHead>Min Required</TableHead>
                  <TableHead>Safe Quantity Limit</TableHead>
                  <TableHead>Request Status</TableHead>
                  <TableHead>Pending Qty</TableHead>
                  <TableHead>Approved Qty</TableHead>
                  <TableHead>PO Created Qty</TableHead>
                  <TableHead>Rejected Qty</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedStockDetails.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={15} className="text-center py-8 text-gray-500">
                      No stock items found
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedStockDetails.map((item) => (
                    <TableRow key={item.id}>
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
                        <div>{item.currentStock} {item.unit}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {(() => {
                            const currentStock = item.currentStock || 0;
                            const minRequired = item.minRequired || 0;
                            const safeQuantityLimit = item.safeQuantityLimit || 0;
                            
                            let stockStatus = 'normal';
                            let statusColor = 'bg-green-100 text-green-800';
                            
                            if (currentStock < safeQuantityLimit) {
                              stockStatus = 'critical';
                              statusColor = 'bg-red-100 text-red-800';
                            } else if (currentStock < minRequired) {
                              stockStatus = 'low';
                              statusColor = 'bg-yellow-100 text-yellow-800';
                            }
                            
                            return (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                                {stockStatus.charAt(0).toUpperCase() + stockStatus.slice(1)}
                              </span>
                            );
                          })()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="number"
                            placeholder="0"
                            className="w-20"
                            value={getDisplayValue(item, 'minRequired')}
                            onChange={(e) => setEditingFields(prev => ({
                              ...prev,
                              [item.id]: {
                                ...prev[item.id],
                                minRequired: e.target.value
                              }
                            }))}
                          />
                          <span className="text-sm text-gray-500">{item.unit}</span>
                          {editingFields[item.id]?.minRequired !== undefined ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => saveFieldChanges(item.id, 'minRequired')}
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingFields(prev => ({
                                ...prev,
                                [item.id]: {
                                  ...prev[item.id],
                                  minRequired: (item.minRequired !== undefined && item.minRequired !== null ? item.minRequired.toString() : '')
                                }
                              }))}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="number"
                            placeholder="0"
                            className="w-20"
                            value={getDisplayValue(item, 'safeQuantityLimit')}
                            onChange={(e) => setEditingFields(prev => ({
                              ...prev,
                              [item.id]: {
                                ...prev[item.id],
                                safeQuantityLimit: e.target.value
                              }
                            }))}
                          />
                          <span className="text-sm text-gray-500">{item.unit}</span>
                          {editingFields[item.id]?.safeQuantityLimit !== undefined ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => saveFieldChanges(item.id, 'safeQuantityLimit')}
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingFields(prev => ({
                                ...prev,
                                [item.id]: {
                                  ...prev[item.id],
                                  safeQuantityLimit: (item.safeQuantityLimit !== undefined && item.safeQuantityLimit !== null ? item.safeQuantityLimit.toString() : '')
                                }
                              }))}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {item.lastRequestStatus && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.lastRequestStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              item.lastRequestStatus === 'approved' ? 'bg-green-100 text-green-800' :
                              item.lastRequestStatus === 'po_created' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {item.lastRequestStatus === 'po_created' ? 'PO Created' : 
                               item.lastRequestStatus.charAt(0).toUpperCase() + item.lastRequestStatus.slice(1)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{item.pendingQuantity || 0}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{item.approvedQuantity || 0}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{item.poCreatedQuantity || 0}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{item.rejectedQuantity || 0}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                          {item.updatedAt?.toLocaleDateString() || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedStockItem({
                              itemName: item.itemName,
                              productVersion: item.productVersion,
                              productCategory: item.productCategory,
                              unit: item.unit
                            });
                            setSupplierModalOpen(true);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Info className="h-3 w-3" />
                          Details
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={
                              shouldDefaultToSuspend(item) ? 'secondary' : 
                              item.displayStatus === 'displayed' ? 'default' : 'secondary'
                            }
                            disabled={!isDisplayButtonEnabled(item)}
                            onClick={() => toggleDisplayStatus(item.id)}
                            className="flex items-center gap-2"
                          >
                             {(shouldDefaultToSuspend(item) || item.displayStatus === 'suspended') ? (
                               <>
                                 <Eye className="h-3 w-3" />
                                 Display
                               </>
                             ) : (
                               <>
                                 <EyeOff className="h-3 w-3" />
                                 Suspend
                               </>
                             )}
                          </Button>
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

      {/* Supplier Quantity Modal */}
      <SupplierQuantityModal
        isOpen={supplierModalOpen}
        onClose={() => {
          setSupplierModalOpen(false);
          setSelectedStockItem(null);
        }}
        stockItem={selectedStockItem}
      />
    </div>
  );
};

export default StockDetails;

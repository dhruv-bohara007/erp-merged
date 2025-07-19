
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Plus, 
  Calendar, 
  Package,
  Truck,
  TrendingUp,
  IndianRupee,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  Download,
  Mail
} from 'lucide-react';
import { usePurchases } from '@/hooks/useFirestore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCompanyData } from '@/hooks/useCompanyData';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import PurchaseRequestsAdmin from './PurchaseRequestsAdmin';

const PurchaseManagement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { purchases, loading, error, updatePurchase, deletePurchase } = usePurchases();
  const { companyData } = useCompanyData();
  const { getCurrencyInfo } = useCurrencyConverter();
  const { currentUser } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<any>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnit, setEditUnit] = useState('');
  
  // Get active section from URL params, default to purchase-requests
  const activeSection = searchParams.get('section') || 'purchase-requests';

  // Get company currency info
  const companyCountry = companyData?.country || 'US';
  const companyCurrency = getCurrencyInfo(companyCountry);

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = (purchase.supplierName || purchase.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (purchase.itemName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || purchase.purchaseStatus === statusFilter;
    const matchesCategory = categoryFilter === 'all' || purchase.productCategory === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate totals using totalAmountAfterTax (preferred) or fallback to totalAmountINR/amount
  const totalAmount = filteredPurchases.reduce((sum, purchase) => {
    const amount = purchase.totalAmountAfterTax || purchase.totalAmountINR || purchase.amount || 0;
    return sum + Math.round(amount * 100) / 100;
  }, 0);
  
  const completedAmount = filteredPurchases
    .filter(p => p.purchaseStatus === 'completed')
    .reduce((sum, purchase) => {
      const amount = purchase.totalAmountAfterTax || purchase.totalAmountINR || purchase.amount || 0;
      return sum + Math.round(amount * 100) / 100;
    }, 0);
  
  const pendingAmount = filteredPurchases
    .filter(p => p.purchaseStatus === 'pending')
    .reduce((sum, purchase) => {
      const amount = purchase.totalAmountAfterTax || purchase.totalAmountINR || purchase.amount || 0;
      return sum + Math.round(amount * 100) / 100;
    }, 0);

  // Get unique categories for filter
  const categories = [...new Set(purchases.map(p => p.productCategory).filter(Boolean))];

  // Group purchases by product for stock details
  const stockDetails = purchases.reduce((acc, purchase) => {
    if (purchase.itemName || purchase.productCategory) {
      const key = `${purchase.productCategory || 'Uncategorized'}-${purchase.itemName || 'Unknown'}-${purchase.productVersion || 'N/A'}`;
      if (!acc[key]) {
        acc[key] = {
          productCategory: purchase.productCategory || 'Uncategorized',
          itemName: purchase.itemName || 'Unknown',
          productVersion: purchase.productVersion || 'N/A',
          currentStock: 0,
          totalValue: 0,
          lastPurchaseDate: purchase.purchaseDate || purchase.expenseDate,
          unit: purchase.unit || 'pcs'
        };
      }
      acc[key].currentStock += purchase.quantity || 0;
      // Use totalAmountAfterTax for Total Value calculation
      acc[key].totalValue += Math.round((purchase.totalAmountAfterTax || purchase.totalAmountINR || purchase.amount || 0) * 100) / 100;
      
      const purchaseDate = purchase.purchaseDate || purchase.expenseDate;
      if (purchaseDate && purchaseDate > acc[key].lastPurchaseDate) {
        acc[key].lastPurchaseDate = purchaseDate;
      }
    }
    return acc;
  }, {} as Record<string, any>);

  // Format currency with company currency symbol and 2 decimal places
  const formatCurrency = (amount: number) => {
    return `${companyCurrency.symbol}${amount.toFixed(2)}`;
  };

  const handleViewDetails = (purchase: any) => {
    // TODO: Implement view details functionality
    console.log('View details for purchase:', purchase);
    alert(`Viewing details for purchase: ${purchase.id}`);
  };

  // Handle edit purchase
  const handleEditPurchase = (purchase: any) => {
    setEditingPurchase(purchase);
    setEditQuantity(purchase.quantity?.toString() || '');
    setEditUnit(purchase.unit || '');
    setEditModalOpen(true);
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingPurchase || !editQuantity || !editUnit) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await updatePurchase(editingPurchase.id, {
        quantity: parseFloat(editQuantity),
        unit: editUnit,
        updatedAt: new Date()
      });
      setEditModalOpen(false);
      setEditingPurchase(null);
    } catch (error) {
      console.error('Error updating purchase:', error);
      alert('Failed to update purchase. Please try again.');
    }
  };

  // Handle delete purchase
  const handleDeletePurchase = async (purchaseId: string) => {
    if (window.confirm('Are you sure you want to delete this purchase?')) {
      try {
        await deletePurchase(purchaseId);
      } catch (error) {
        console.error('Error deleting purchase:', error);
        alert('Failed to delete purchase. Please try again.');
      }
    }
  };

  // Get page title and description based on active section
  const getPageContent = () => {
    switch (activeSection) {
      case 'purchase-requests':
        return {
          title: 'Purchase Requests',
          description: 'Manage employee purchase requests and track their status'
        };
      case 'purchase-order':
        return {
          title: 'Purchase Order',
          description: 'Manage and track purchase orders from suppliers'
        };
      case 'purchase-record':
        return {
          title: 'Purchase Record',
          description: 'View and manage complete purchase history and records'
        };
      default:
        return {
          title: 'Purchase Requests',
          description: 'Manage employee purchase requests and track their status'
        };
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading purchases...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center text-red-600">Error: {error}</div>
      </div>
    );
  }

  const pageContent = getPageContent();

  // Purchase Requests Content - Now renders PurchaseRequestsAdmin
  const renderPurchaseRequests = () => (
    <PurchaseRequestsAdmin />
  );

  // Purchase Order Content - Display purchase orders from purchase_orders collection
  const renderPurchaseOrder = () => {
    const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const loadPurchaseOrders = async () => {
        try {
          const { collection, query, where, orderBy, onSnapshot } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase');
          
          // currentUser is already available from the main component scope
          if (!currentUser?.companyId) return;

          const q = query(
            collection(db, 'purchase_orders'),
            where('companyId', '==', currentUser.companyId),
            orderBy('createdAt', 'desc')
          );

          const unsubscribe = onSnapshot(q, (snapshot) => {
            const orders = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              issueDate: doc.data().purchaseDate ? new Date(doc.data().purchaseDate) : null,
              dueDate: doc.data().dueDate ? new Date(doc.data().dueDate) : null,
              createdAt: doc.data().createdAt?.toDate()
            }));
            setPurchaseOrders(orders);
            setLoading(false);
          });

          return unsubscribe;
        } catch (error) {
          console.error('Error loading purchase orders:', error);
          setLoading(false);
        }
      };

      loadPurchaseOrders();
    }, []);

    const handleViewPurchaseOrder = (order: any) => {
      // TODO: Implement view functionality
      console.log('View purchase order:', order);
    };

    const handleDownloadPurchaseOrder = (order: any) => {
      // Create downloadable content
      const content = `
PURCHASE ORDER

Purchase Order Number: ${order.purchaseNumber || order.id}
Supplier: ${order.supplier?.name || 'N/A'}
Email: ${order.supplier?.email || 'N/A'}

Issue Date: ${order.issueDate?.toLocaleDateString() || 'N/A'}
Due Date: ${order.dueDate?.toLocaleDateString() || 'N/A'}

Items:
${order.items?.map((item: any) => 
  `${item.description || item.itemName} - Qty: ${item.quantity} - Rate: ${companyCurrency.symbol}${(item.rate || 0).toFixed(2)} - Amount: ${companyCurrency.symbol}${(item.amount || 0).toFixed(2)}`
).join('\n') || 'No items'}

Subtotal: ${companyCurrency.symbol}${(order.subtotal || 0).toFixed(2)}
Total Amount: ${companyCurrency.symbol}${(order.totalAmount || 0).toFixed(2)}

Notes: ${order.notes || 'N/A'}
Terms: ${order.terms || 'N/A'}
      `;

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PurchaseOrder-${order.purchaseNumber || order.id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    const handleEmailPurchaseOrder = (order: any) => {
      // TODO: Implement email functionality
      console.log('Email purchase order:', order);
    };

    const handleDeletePurchaseOrder = async (orderId: string) => {
      if (!confirm('Are you sure you want to delete this purchase order?')) return;
      
      try {
        const { doc, deleteDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        
        await deleteDoc(doc(db, 'purchase_orders', orderId));
      } catch (error) {
        console.error('Error deleting purchase order:', error);
        alert('Failed to delete purchase order');
      }
    };

    return (
      <div className="space-y-6">
        {/* Header with Create Purchase Order button */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{pageContent.title}</h1>
            <p className="text-gray-600 mt-2">{pageContent.description}</p>
          </div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate('/create-purchase-order')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Purchase Order
          </Button>
        </div>

        {/* Purchase Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Orders ({purchaseOrders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading purchase orders...</p>
              </div>
            ) : purchaseOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-sm font-medium text-gray-900">No purchase orders found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first purchase order.
                </p>
                <div className="mt-6">
                  <Button onClick={() => navigate('/create-purchase-order')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Purchase Order
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Purchase Order #</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div className="font-medium">{order.purchaseNumber || order.id}</div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.supplier?.name || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{order.supplier?.email || 'N/A'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{formatCurrency(order.totalAmount || 0)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                            {order.issueDate ? order.issueDate.toLocaleDateString() : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                            {order.dueDate ? order.dueDate.toLocaleDateString() : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              title="View Purchase Order"
                              onClick={() => handleViewPurchaseOrder(order)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              title="Download"
                              onClick={() => handleDownloadPurchaseOrder(order)}
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              title="Send Email"
                              onClick={() => handleEmailPurchaseOrder(order)}
                            >
                              <Mail className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeletePurchaseOrder(order.id)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete Purchase Order"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Purchase Record Content - Removed Actions column
  const renderPurchaseRecord = () => (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <IndianRupee className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(completedAmount)}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <Package className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingAmount)}</p>
              </div>
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Truck className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{Object.keys(stockDetails).length}</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Recent Purchases and Stock Details */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Purchase Data</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search purchases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier Name</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Quantity Bought</TableHead>
                      <TableHead>Unit</TableHead>
                       <TableHead>Price per Unit</TableHead>
                       <TableHead>Total Amount</TableHead>
                       <TableHead>Date</TableHead>
                       <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {filteredPurchases.length === 0 ? (
                       <TableRow>
                         <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                           No purchases found
                         </TableCell>
                       </TableRow>
                    ) : (
                      filteredPurchases.map((purchase) => {
                        const displayItemName = purchase.productCategory && purchase.itemName && purchase.productVersion
                          ? `${purchase.productCategory}-${purchase.itemName} ${purchase.productVersion}`
                          : purchase.itemName || purchase.title || 'N/A';
                        
                        return (
                          <TableRow key={purchase.id}>
                            <TableCell>
                              <div className="font-medium">{purchase.supplierName || 'N/A'}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{displayItemName}</div>
                            </TableCell>
                            <TableCell>
                              <div>{purchase.quantity || 'N/A'}</div>
                            </TableCell>
                            <TableCell>
                              <div>{purchase.unit || 'N/A'}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{formatCurrency(purchase.pricePerUnit || 0)}</div>
                            </TableCell>
                           <TableCell>
                               <div className="font-medium">{formatCurrency(purchase.totalAmountAfterTax || purchase.amount || 0)}</div>
                             </TableCell>
                             <TableCell>
                               <div className="flex items-center text-sm">
                                 <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                                 {(purchase.purchaseDate || purchase.expenseDate)?.toLocaleDateString() || 'N/A'}
                               </div>
                             </TableCell>
                             <TableCell>
                               <Button
                                 variant="destructive"
                                 size="sm"
                                 onClick={() => handleDeletePurchase(purchase.id)}
                               >
                                 <Trash2 className="w-4 h-4" />
                               </Button>
                             </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
          </div>
        </CardContent>
      </Card>
    </>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header Section - Only show for non-purchase-requests sections */}
      {activeSection !== 'purchase-requests' && activeSection !== 'purchase-order' && (
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{pageContent.title}</h1>
            <p className="text-gray-600 mt-2">{pageContent.description}</p>
          </div>
          {activeSection === 'purchase-record' && (
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate('/add-purchase')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Purchase
            </Button>
          )}
        </div>
      )}

      {/* Content Section */}
      {activeSection === 'purchase-requests' && renderPurchaseRequests()}
      {activeSection === 'purchase-order' && renderPurchaseOrder()}
      {activeSection === 'purchase-record' && renderPurchaseRecord()}

      {/* Edit Purchase Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Purchase</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editQuantity">Quantity</Label>
              <Input
                id="editQuantity"
                type="number"
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
                placeholder="Enter quantity"
              />
            </div>
            <div>
              <Label htmlFor="editUnit">Unit</Label>
              <Select value={editUnit} onValueChange={setEditUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {['pcs', 'kg', 'lbs', 'grams', 'liters', 'gallons', 'meters', 'feet', 'boxes', 'bottles', 'packets', 'sets', 'units'].map(unit => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseManagement;

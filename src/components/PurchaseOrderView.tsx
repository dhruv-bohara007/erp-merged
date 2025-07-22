
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, 
  Calendar, 
  Package,
  Eye,
  Download,
  Mail,
  Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCompanyData } from '@/hooks/useCompanyData';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import PurchaseOrderModal from './PurchaseOrderModal';

const PurchaseOrderView = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { companyData } = useCompanyData();
  const { getCurrencyInfo } = useCurrencyConverter();
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get company currency info
  const companyCountry = companyData?.country || 'US';
  const companyCurrency = getCurrencyInfo(companyCountry);

  useEffect(() => {
    const loadPurchaseOrders = async () => {
      try {
        const { collection, query, where, onSnapshot } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        
        if (!currentUser?.companyId) return;

        // Remove orderBy to avoid composite index requirement
        const q = query(
          collection(db, 'purchase_orders'),
          where('companyId', '==', currentUser.companyId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const orders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            issueDate: doc.data().purchaseDate ? new Date(doc.data().purchaseDate) : null,
            dueDate: doc.data().dueDate ? new Date(doc.data().dueDate) : null,
            createdAt: doc.data().createdAt?.toDate()
          }));
          
          // Sort in memory by createdAt descending
          orders.sort((a, b) => {
            const aTime = a.createdAt ? a.createdAt.getTime() : 0;
            const bTime = b.createdAt ? b.createdAt.getTime() : 0;
            return bTime - aTime;
          });
          
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
  }, [currentUser?.companyId]);

  // Format currency with company currency symbol and 2 decimal places
  const formatCurrency = (amount: number) => {
    return `${companyCurrency.symbol}${amount.toFixed(2)}`;
  };

  // Get the correct amount to display based on currency conversion
  const getDisplayAmount = (order: any) => {
    // Use the company amount from currencyAmounts if available, otherwise fallback to totalAmount
    const companyAmount = order.currencyAmounts?.companyAmount || order.totalAmount || 0;
    return formatCurrency(companyAmount);
  };

  const handleViewPurchaseOrder = (order: any) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleDownloadPurchaseOrder = (order: any) => {
    const companyAmount = order.currencyAmounts?.companyAmount || order.totalAmount || 0;
    
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
Total Amount: ${companyCurrency.symbol}${companyAmount.toFixed(2)}

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
          <h1 className="text-3xl font-bold">Purchase Order</h1>
          <p className="text-gray-600 mt-2">Manage and track purchase orders from suppliers</p>
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
                        <div className="font-medium">{getDisplayAmount(order)}</div>
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

      {/* Purchase Order Modal */}
      <PurchaseOrderModal 
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
};

export default PurchaseOrderView;

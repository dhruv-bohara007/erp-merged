
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

  const handleDownloadPurchaseOrder = async (order: any) => {
    try {
      // Import jsPDF and html2canvas dynamically
      const [jsPDF, html2canvas] = await Promise.all([
        import('jspdf').then(m => m.default),
        import('html2canvas').then(m => m.default)
      ]);

      const companyAmount = order.currencyAmounts?.companyAmount || order.totalAmount || 0;

      // Create comprehensive HTML for professional PDF following the same structure as in PurchaseOrderModal
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6; 
              color: #1f2937;
              background: #ffffff;
              padding: 20px;
            }
            .container { max-width: 800px; margin: 0 auto; }
            .purchase-header { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start;
              margin-bottom: 25px;
              padding: 20px;
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              border-radius: 12px;
              border: 2px solid #e2e8f0;
            }
            .purchase-title {
              font-size: 48px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 10px;
            }
            .purchase-number {
              font-size: 24px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 15px;
            }
            .total-amount {
              text-align: right;
              background: white;
              padding: 20px;
              border-radius: 12px;
              border: 2px solid #e5e7eb;
              box-shadow: 0 2px 6px rgba(0,0,0,0.1);
              min-width: 240px;
            }
            .amount-primary {
              font-size: 32px;
              font-weight: bold;
              color: #059669;
              margin-bottom: 8px;
            }
            .two-column {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin: 8px 0;
            }
            .info-card {
              background: white;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            }
            .card-header {
              padding: 8px 12px;
              font-size: 16px;
              font-weight: bold;
              color: #1f2937;
              border-bottom: 1px solid #e5e7eb;
            }
            .company-header { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); }
            .supplier-header { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); }
            .card-content { padding: 10px; }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 4px 0;
              background: white;
              border-radius: 4px;
              overflow: hidden;
              border: 1px solid #e5e7eb;
            }
            .items-table th, .items-table td {
              padding: 6px 10px;
              text-align: left;
              border-bottom: 1px solid #e5e7eb;
              font-size: 12px;
              line-height: 1.3;
            }
            .items-table th {
              background: #f9fafb;
              font-weight: 600;
              color: #374151;
            }
            .summary-section {
              margin-top: 20px;
              padding: 20px;
              background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
              border-radius: 12px;
              border: 2px solid #bfdbfe;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 12px;
              font-size: 16px;
            }
            .summary-total {
              font-size: 20px;
              font-weight: bold;
              padding-top: 15px;
              border-top: 2px solid #60a5fa;
              color: #1e40af;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="purchase-header">
              <div>
                <div class="purchase-title">PURCHASE ORDER</div>
                <div class="purchase-number">#${order.purchaseNumber || order.id}</div>
              </div>
              <div class="total-amount">
                <div class="amount-primary">
                  ${companyCurrency.symbol}${companyAmount.toFixed(2)}
                </div>
              </div>
            </div>

            <div class="two-column">
              <div class="info-card">
                <div class="card-header company-header">Company Information</div>
                <div class="card-content">
                  <div><strong>${companyData?.companyName || 'Company Name'}</strong></div>
                  <div>${companyData?.streetAddress || 'Company Address'}</div>
                  ${companyData?.phone ? `<div>📞 ${companyData.phone}</div>` : ''}
                  ${companyData?.email ? `<div>📧 ${companyData.email}</div>` : ''}
                </div>
              </div>
              
              <div class="info-card">
                <div class="card-header supplier-header">Supplier Information</div>
                <div class="card-content">
                  <div><strong>${order.supplier?.name || 'N/A'}</strong></div>
                  <div>${order.supplier?.address || 'N/A'}</div>
                  ${order.supplier?.phoneNumber ? `<div>📞 ${order.supplier.phoneNumber}</div>` : ''}
                  <div>📧 ${order.supplier?.email || 'N/A'}</div>
                </div>
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${order.items?.map((item: any) => `
                  <tr>
                    <td>${item.itemName || item.description}</td>
                    <td>${item.description || item.itemName}</td>
                    <td>${item.quantity}</td>
                    <td>${companyCurrency.symbol}${(item.pricePerUnit || item.rate || 0).toFixed(2)}</td>
                    <td>${companyCurrency.symbol}${((item.quantity || 0) * (item.pricePerUnit || item.rate || 0)).toFixed(2)}</td>
                  </tr>
                `).join('') || ''}
              </tbody>
            </table>

            <div class="summary-section">
              <div class="summary-row">
                <span>Subtotal:</span>
                <span>${companyCurrency.symbol}${(order.subtotal || 0).toFixed(2)}</span>
              </div>
              <div class="summary-row summary-total">
                <span>Total Amount:</span>
                <span>${companyCurrency.symbol}${companyAmount.toFixed(2)}</span>
              </div>
            </div>

            ${order.notes ? `
              <div style="margin-top: 20px; padding: 15px; background: #fefce8; border-radius: 8px;">
                <strong>Notes:</strong><br>
                ${order.notes}
              </div>
            ` : ''}

            ${order.terms ? `
              <div style="margin-top: 15px; padding: 15px; background: #f0f9ff; border-radius: 8px;">
                <strong>Terms & Conditions:</strong><br>
                ${order.terms}
              </div>
            ` : ''}
          </div>
        </body>
        </html>
      `;

      // Create a temporary div to render the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '800px';
      document.body.appendChild(tempDiv);

      // Convert to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Clean up
      document.body.removeChild(tempDiv);

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`PurchaseOrder-${order.purchaseNumber || order.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF');
    }
  };

  const handleEmailPurchaseOrder = (order: any) => {
    console.log('Email purchase order:', order);
  };

  const handleDeletePurchaseOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this purchase order?')) return;
    
    try {
      const { deletePurchaseOrderWithRollback } = await import('@/services/purchaseOrderService');
      
      await deletePurchaseOrderWithRollback(orderId);
      
      // Show success message
      alert('Purchase order deleted and related data rolled back successfully');
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

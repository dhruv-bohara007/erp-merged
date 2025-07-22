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
    try {
      const companyAmount = order.currencyAmounts?.companyAmount || order.totalAmount || 0;
      const supplierAmount = order.currencyAmounts?.supplierAmount || companyAmount;
      const supplierCurrency = getCurrencyInfo(order.supplier?.country || 'US');

      // Create comprehensive HTML for professional PDF matching the preview
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Purchase Order ${order.purchaseNumber || order.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
              line-height: 1.4; 
              color: #1f2937;
              background: #ffffff;
              padding: 20px;
              font-size: 12px;
            }
            .container { max-width: 800px; margin: 0 auto; }
            
            /* Header Section */
            .po-header { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start;
              margin-bottom: 30px;
              padding: 25px;
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              border-radius: 12px;
              border: 2px solid #e2e8f0;
            }
            .company-section {
              display: flex;
              align-items: center;
              gap: 20px;
            }
            .company-logo { 
              width: 80px; 
              height: 80px; 
              object-fit: contain;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
            }
            .po-details h1 {
              font-size: 36px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 8px;
            }
            .po-number {
              font-size: 18px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 10px;
            }
            .po-status {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 16px;
              font-weight: 600;
              text-transform: uppercase;
              font-size: 11px;
              background: #dcfce7;
              color: #166534;
              border: 1px solid #bbf7d0;
            }
            
            .amount-section {
              text-align: right;
              background: white;
              padding: 20px;
              border-radius: 12px;
              border: 2px solid #e5e7eb;
              box-shadow: 0 2px 6px rgba(0,0,0,0.1);
              min-width: 200px;
            }
            .amount-primary {
              font-size: 28px;
              font-weight: bold;
              color: #059669;
              margin-bottom: 5px;
            }
            .amount-secondary {
              font-size: 16px;
              color: #6b7280;
            }
            .currency-label {
              font-size: 12px;
              color: #9ca3af;
              margin-top: 8px;
            }

            /* Dates Section */
            .dates-section {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin: 20px 0;
              padding: 15px;
              background: #f9fafb;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
            }
            .date-item {
              display: flex;
              align-items: center;
              gap: 8px;
              font-weight: 600;
              font-size: 14px;
              color: #374151;
            }

            /* Two Column Layout */
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin: 25px 0;
            }
            
            /* Card Styles */
            .info-card {
              background: white;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            .card-header {
              padding: 15px 20px;
              font-size: 16px;
              font-weight: bold;
              color: #1f2937;
              border-bottom: 1px solid #e5e7eb;
            }
            .company-header { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); }
            .supplier-header { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); }
            
            .card-content { 
              padding: 20px;
              font-size: 13px;
              line-height: 1.5;
            }
            .info-row {
              margin-bottom: 12px;
            }
            .info-row:last-child {
              margin-bottom: 0;
            }
            .info-label {
              font-weight: 600;
              color: #374151;
              margin-bottom: 3px;
            }
            .info-value {
              color: #6b7280;
            }
            
            /* Items Table */
            .items-section {
              margin: 30px 0;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              background: white;
              border-radius: 8px;
              overflow: hidden;
              border: 1px solid #e5e7eb;
              box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            .items-table th {
              background: #f9fafb;
              padding: 15px 12px;
              text-align: left;
              font-weight: 600;
              color: #374151;
              border-bottom: 2px solid #e5e7eb;
            }
            .items-table td {
              padding: 15px 12px;
              text-align: left;
              border-bottom: 1px solid #f3f4f6;
              font-size: 13px;
            }
            .items-table tr:last-child td {
              border-bottom: none;
            }
            .items-table tr:hover {
              background: #f9fafb;
            }
            
            /* Alignment fixes */
            .items-table th:nth-child(2), .items-table td:nth-child(2) { text-align: center; }
            .items-table th:nth-child(3), .items-table td:nth-child(3) { text-align: center; }
            .items-table th:nth-child(4), .items-table td:nth-child(4) { text-align: right; }
            .items-table th:nth-child(5), .items-table td:nth-child(5) { text-align: center; }
            .items-table th:nth-child(6), .items-table td:nth-child(6) { text-align: right; }
            
            /* Summary Section */
            .summary-section {
              margin-top: 25px;
              padding: 25px;
              background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
              border-radius: 12px;
              border: 2px solid #bfdbfe;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              font-size: 14px;
            }
            .summary-label {
              font-weight: 600;
              color: #374151;
            }
            .summary-value {
              font-weight: 600;
              color: #1f2937;
            }
            .summary-total {
              font-size: 18px;
              font-weight: bold;
              padding-top: 15px;
              border-top: 2px solid #60a5fa;
              color: #1e40af;
            }
            
            /* Notes Section */
            .notes-section {
              margin-top: 30px;
              padding: 20px;
              background: #fefce8;
              border-radius: 8px;
              border: 1px solid #fde047;
            }
            .notes-title {
              font-weight: bold;
              color: #92400e;
              margin-bottom: 10px;
              font-size: 14px;
            }
            .notes-content {
              color: #78350f;
              line-height: 1.5;
            }
            
            /* Footer */
            .po-footer {
              margin-top: 40px;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
              padding: 20px;
              border-top: 1px solid #e5e7eb;
            }
            
            /* Exchange rate info */
            .exchange-info {
              background: #f0f9ff;
              padding: 12px;
              border-radius: 6px;
              border: 1px solid #bae6fd;
              margin: 15px 0;
              font-size: 12px;
              color: #0c4a6e;
            }
            
            @media print {
              body { padding: 0; margin: 0; }
              .container { max-width: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header Section -->
            <div class="po-header">
              <div class="company-section">
                ${companyData?.logoUrl ? `<img src="${companyData.logoUrl}" alt="Company Logo" class="company-logo">` : ''}
                <div class="po-details">
                  <h1>PURCHASE ORDER</h1>
                  <div class="po-number">#${order.purchaseNumber || order.id}</div>
                  <span class="po-status">COMPLETED</span>
                </div>
              </div>
              
              <div class="amount-section">
                <div class="amount-primary">
                  ${companyCurrency.symbol}${companyAmount.toFixed(2)}
                </div>
                ${order.currencyAmounts && supplierCurrency.code !== companyCurrency.code ? `
                  <div class="amount-secondary">
                    ${supplierCurrency.symbol}${supplierAmount.toFixed(2)}
                  </div>
                  <div class="currency-label">
                    ${companyCurrency.code} / ${supplierCurrency.code}
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Dates Section -->
            <div class="dates-section">
              <div class="date-item">
                <strong>Issue Date:</strong> ${order.issueDate?.toLocaleDateString() || order.purchaseDate ? new Date(order.purchaseDate).toLocaleDateString() : 'N/A'}
              </div>
              <div class="date-item">
                <strong>Due Date:</strong> ${order.dueDate?.toLocaleDateString() || 'N/A'}
              </div>
            </div>

            <!-- Company and Supplier Information -->
            <div class="info-grid">
              <!-- Company Information -->
              <div class="info-card">
                <div class="card-header company-header">Company Information</div>
                <div class="card-content">
                  <div class="info-row">
                    <div class="info-label">📍 Contact Details</div>
                    <div class="info-value">
                      <strong>${companyData?.companyName || 'N/A'}</strong><br>
                      ${companyData?.address || 'N/A'}<br>
                      ${companyData?.city ? `${companyData.city}<br>` : ''}
                      Country: ${companyData?.country || 'N/A'}
                    </div>
                  </div>
                  ${companyData?.phone ? `
                    <div class="info-row">
                      <div class="info-label">📞 Phone</div>
                      <div class="info-value">${companyData.phone}</div>
                    </div>
                  ` : ''}
                  ${companyData?.email ? `
                    <div class="info-row">
                      <div class="info-label">📧 Email</div>
                      <div class="info-value">${companyData.email}</div>
                    </div>
                  ` : ''}
                  ${companyData?.taxInfo ? `
                    <div class="info-row">
                      <div class="info-label">🏛️ Tax Information</div>
                      <div class="info-value">Federal EIN: ${companyData.taxInfo}</div>
                    </div>
                  ` : ''}
                  ${companyData?.bankInfo ? `
                    <div class="info-row">
                      <div class="info-label">🏦 Bank Information</div>
                      <div class="info-value">
                        Bank Name: ${companyData.bankInfo.bankName || 'N/A'}<br>
                        Account Number: ${companyData.bankInfo.accountNumber || 'N/A'}<br>
                        Routing Code: ${companyData.bankInfo.routingCode || 'N/A'}
                      </div>
                    </div>
                  ` : ''}
                </div>
              </div>

              <!-- Supplier Information -->
              <div class="info-card">
                <div class="card-header supplier-header">Supplier Information</div>
                <div class="card-content">
                  <div class="info-row">
                    <div class="info-label">👤 Contact Details</div>
                    <div class="info-value">
                      <strong>${order.supplier?.name || 'N/A'}</strong><br>
                      📧 ${order.supplier?.email || 'N/A'}<br>
                      📞 ${order.supplier?.phone || 'N/A'}
                    </div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">📍 Address</div>
                    <div class="info-value">
                      ${order.supplier?.address || 'N/A'}<br>
                      City: ${order.supplier?.city || 'N/A'}<br>
                      Country: ${order.supplier?.country || 'N/A'}
                    </div>
                  </div>
                  ${order.supplier?.taxId ? `
                    <div class="info-row">
                      <div class="info-label">🏛️ Tax Information</div>
                      <div class="info-value">Tax ID: ${order.supplier.taxId}</div>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>

            ${order.currencyAmounts && supplierCurrency.code !== companyCurrency.code ? `
              <div class="exchange-info">
                <strong>💱 Exchange Rate Used:</strong> 
                Company to INR Rate: ${order.currencyAmounts.companyToINR || 1} | 
                INR to Supplier Rate: ${order.currencyAmounts.INRToSupplier || 1}
              </div>
            ` : ''}

            <!-- Purchase Order Items -->
            <div class="items-section">
              <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #1f2937;">Purchase Order Items</h3>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                    <th>Rate</th>
                    <th>Discount</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.items?.map(item => `
                    <tr>
                      <td>
                        <strong>${item.description || item.itemName || 'N/A'}</strong>
                      </td>
                      <td style="text-align: center;">${item.quantity || 0}</td>
                      <td style="text-align: center;">${item.unit || 'pcs'}</td>
                      <td style="text-align: right;">
                        ${companyCurrency.symbol}${(item.rate || 0).toFixed(2)}
                        ${order.currencyAmounts && supplierCurrency.code !== companyCurrency.code ? `
                          <br><small style="color: #6b7280;">(${supplierCurrency.symbol}${((item.rate || 0) * (order.currencyAmounts.companyToINR || 1) * (order.currencyAmounts.INRToSupplier || 1)).toFixed(2)})</small>
                        ` : ''}
                      </td>
                      <td style="text-align: center;">
                        ${item.discount ? `${item.discount}%` : '—'}
                      </td>
                      <td style="text-align: right;">
                        <strong>${companyCurrency.symbol}${(item.amount || 0).toFixed(2)}</strong>
                        ${order.currencyAmounts && supplierCurrency.code !== companyCurrency.code ? `
                          <br><small style="color: #6b7280;">(${supplierCurrency.symbol}${((item.amount || 0) * (order.currencyAmounts.companyToINR || 1) * (order.currencyAmounts.INRToSupplier || 1)).toFixed(2)})</small>
                        ` : ''}
                      </td>
                    </tr>
                  `).join('') || '<tr><td colspan="6" style="text-align: center; color: #6b7280;">No items</td></tr>'}
                </tbody>
              </table>

              <!-- Summary Section -->
              <div class="summary-section">
                <div class="summary-row">
                  <span class="summary-label">Subtotal (${companyCurrency.code}):</span>
                  <span class="summary-value">${companyCurrency.symbol}${(order.subtotal || 0).toFixed(2)}</span>
                </div>
                ${order.currencyAmounts && supplierCurrency.code !== companyCurrency.code ? `
                  <div class="summary-row">
                    <span class="summary-label">Subtotal (${supplierCurrency.code}):</span>
                    <span class="summary-value">${supplierCurrency.symbol}${((order.subtotal || 0) * (order.currencyAmounts.companyToINR || 1) * (order.currencyAmounts.INRToSupplier || 1)).toFixed(2)}</span>
                  </div>
                ` : ''}
                <div class="summary-row">
                  <span class="summary-label">Total Tax (${companyCurrency.code}):</span>
                  <span class="summary-value">${companyCurrency.symbol}${(order.totalTax || 0).toFixed(2)}</span>
                </div>
                ${order.currencyAmounts && supplierCurrency.code !== companyCurrency.code ? `
                  <div class="summary-row">
                    <span class="summary-label">Total Tax (${supplierCurrency.code}):</span>
                    <span class="summary-value">${supplierCurrency.symbol}${((order.totalTax || 0) * (order.currencyAmounts.companyToINR || 1) * (order.currencyAmounts.INRToSupplier || 1)).toFixed(2)}</span>
                  </div>
                ` : ''}
                <div class="summary-row summary-total">
                  <span>Total Amount (${companyCurrency.code}):</span>
                  <span>${companyCurrency.symbol}${companyAmount.toFixed(2)}</span>
                </div>
                ${order.currencyAmounts && supplierCurrency.code !== companyCurrency.code ? `
                  <div class="summary-row summary-total">
                    <span>Total Amount (${supplierCurrency.code}):</span>
                    <span>${supplierCurrency.symbol}${supplierAmount.toFixed(2)}</span>
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Notes and Terms -->
            ${(order.notes || order.terms) ? `
              <div class="notes-section">
                ${order.notes ? `
                  <div style="margin-bottom: 15px;">
                    <div class="notes-title">📝 Notes</div>
                    <div class="notes-content">${order.notes}</div>
                  </div>
                ` : ''}
                ${order.terms ? `
                  <div>
                    <div class="notes-title">📋 Terms & Conditions</div>
                    <div class="notes-content">${order.terms}</div>
                  </div>
                ` : ''}
              </div>
            ` : ''}

            <!-- Footer -->
            <div class="po-footer">
              <p><strong>Thank you for your business!</strong></p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Create a new window and trigger print dialog for PDF generation
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Wait for content to load, then trigger print dialog
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            // Close window after print dialog
            setTimeout(() => {
              printWindow.close();
            }, 1000);
          }, 500);
        };
      } else {
        // Fallback: create downloadable HTML file if popup is blocked
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PurchaseOrder-${order.purchaseNumber || order.id}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('Print dialog blocked. Downloaded HTML file instead. Use browser print to save as PDF.');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Simple fallback
      const content = `Purchase Order #${order.purchaseNumber || order.id}\nSupplier: ${order.supplier?.name || 'N/A'}\nTotal: ${companyCurrency.symbol}${(order.currencyAmounts?.companyAmount || order.totalAmount || 0).toFixed(2)}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PurchaseOrder-${order.purchaseNumber || order.id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
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

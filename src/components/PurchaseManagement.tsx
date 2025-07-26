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
  Mail,
  FileDown,
  X
} from 'lucide-react';
import { usePurchases } from '@/hooks/useFirestore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCompanyData } from '@/hooks/useCompanyData';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import PurchaseRequestsAdmin from './PurchaseRequestsAdmin';
import PurchaseOrderView from './PurchaseOrderView';
import jsPDF from 'jspdf';

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
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState<any>(null);
  
  // Get active section from URL params, default to purchase-requests
  const activeSection = searchParams.get('section') || 'purchase-requests';

  // Get company currency info
  const companyCountry = companyData?.country || 'US';
  const companyCurrency = getCurrencyInfo(companyCountry);

  // Filter purchase records (only show records with purchaseRecordId)
  const purchaseRecords = purchases.filter(purchase => purchase.purchaseRecordId);

  const filteredPurchases = purchaseRecords.filter(purchase => {
    const matchesSearch = (purchase.supplierName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (purchase.purchaseRecordId || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || purchase.purchaseStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate totals using totalAmount
  const totalAmount = filteredPurchases.reduce((sum, purchase) => {
    const amount = purchase.totalAmount || purchase.amount || 0;
    return sum + Math.round(amount * 100) / 100;
  }, 0);
  
  const completedAmount = filteredPurchases
    .filter(p => p.purchaseStatus === 'completed')
    .reduce((sum, purchase) => {
      const amount = purchase.totalAmount || purchase.amount || 0;
      return sum + Math.round(amount * 100) / 100;
    }, 0);
  
  const pendingAmount = filteredPurchases
    .filter(p => p.purchaseStatus === 'pending')
    .reduce((sum, purchase) => {
      const amount = purchase.totalAmount || purchase.amount || 0;
      return sum + Math.round(amount * 100) / 100;
    }, 0);

  // Format currency with company currency symbol and 2 decimal places
  const formatCurrency = (amount: number) => {
    return `${companyCurrency.symbol}${amount.toFixed(2)}`;
  };

  const handleViewDetails = (purchase: any) => {
    setViewingPurchase(purchase);
    setViewModalOpen(true);
  };

  // Generate PDF for purchase record
  const generatePurchaseRecordPDF = (purchase: any) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const margin = 20;
    let yPosition = 30;

    // Company/Header Section
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PURCHASE RECORD', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 20;
    
    // Purchase Record Details
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    // Left column
    pdf.text(`Purchase Record ID: ${purchase.purchaseRecordId}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Supplier Name: ${purchase.supplierName || 'N/A'}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Purchase Date: ${purchase.purchaseDate?.toLocaleDateString() || purchase.expenseDate?.toLocaleDateString() || 'N/A'}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Currency: ${purchase.companyCurrency}`, margin, yPosition);
    
    yPosition += 20;

    // Items Section
    pdf.setFont('helvetica', 'bold');
    pdf.text('ITEMS:', margin, yPosition);
    yPosition += 10;
    
    pdf.setFont('helvetica', 'normal');
    
    // Table headers
    const tableStartY = yPosition;
    const colWidths = [60, 30, 40, 40];
    const headers = ['Product', 'Qty', 'Unit Price', 'Amount'];
    
    pdf.setFont('helvetica', 'bold');
    let xPos = margin;
    headers.forEach((header, index) => {
      pdf.text(header, xPos, yPosition);
      xPos += colWidths[index];
    });
    
    yPosition += 5;
    
    // Draw line under headers only
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    
    yPosition += 5;
    
    pdf.setFont('helvetica', 'normal');
    
    // Items data
    if (purchase.items && purchase.items.length > 0) {
      purchase.items.forEach((item: any) => {
        xPos = margin;
        
        // Product info (multi-line if needed)
        const productText = `${item.productCategory} - ${item.itemName} (${item.productVersion})`;
        pdf.text(productText, xPos, yPosition, { maxWidth: colWidths[0] - 5 });
        xPos += colWidths[0];
        
        // Quantity
        pdf.text(`${item.quantity} ${item.unit}`, xPos, yPosition);
        xPos += colWidths[1];
        
        // Unit Price
        pdf.text(formatCurrency(item.pricePerUnit), xPos, yPosition);
        xPos += colWidths[2];
        
        // Amount
        pdf.text(formatCurrency(item.amount), xPos, yPosition);
        
        yPosition += 12;
      });
    } else {
      pdf.text('No items', margin, yPosition);
      yPosition += 12;
    }
    
    yPosition += 10;
    
    // Draw line before totals
    pdf.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5);
    
    // Totals Section
    pdf.setFont('helvetica', 'bold');
    const totalsX = pageWidth - 100;
    
    pdf.text('Subtotal:', totalsX - 40, yPosition);
    pdf.text(formatCurrency(purchase.subtotal || 0), totalsX, yPosition);
    yPosition += 8;
    
    pdf.text('Tax:', totalsX - 40, yPosition);
    pdf.text(formatCurrency(purchase.totalTaxAmount || 0), totalsX, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(14);
    pdf.text('Total Amount:', totalsX - 40, yPosition);
    pdf.text(formatCurrency(purchase.totalAmount || purchase.amount || 0), totalsX, yPosition);
    
    yPosition += 20;
    
    // Description (if available)
    if (purchase.description) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Description:', margin, yPosition);
      yPosition += 8;
      pdf.setFont('helvetica', 'normal');
      const splitDescription = pdf.splitTextToSize(purchase.description, pageWidth - 2 * margin);
      pdf.text(splitDescription, margin, yPosition);
    }

    // Save the PDF
    pdf.save(`Purchase_Record_${purchase.purchaseRecordId}.pdf`);
  };

  // Handle download purchase record
  const handleDownloadPurchaseRecord = (purchase: any) => {
    // Create a simple text-based purchase record
    const content = `
PURCHASE RECORD
===============

Purchase Record ID: ${purchase.purchaseRecordId}
Supplier: ${purchase.supplierName}
Date: ${purchase.purchaseDate?.toLocaleDateString() || purchase.expenseDate?.toLocaleDateString() || 'N/A'}
Currency: ${purchase.companyCurrency}

ITEMS:
------
${purchase.items?.map((item: any, index: number) => `
${index + 1}. ${item.productCategory} - ${item.itemName} (${item.productVersion})
   Quantity: ${item.quantity} ${item.unit}
   Price per Unit: ${formatCurrency(item.pricePerUnit)}
   Amount: ${formatCurrency(item.amount)}
`).join('') || 'No items'}

SUMMARY:
--------
Subtotal: ${formatCurrency(purchase.subtotal || 0)}
Tax: ${formatCurrency(purchase.totalTaxAmount || 0)}
Total Amount: ${formatCurrency(purchase.totalAmount || purchase.amount || 0)}

${purchase.description ? `Description: ${purchase.description}` : ''}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Purchase_Record_${purchase.purchaseRecordId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle delete purchase
  const handleDeletePurchase = async (purchaseId: string) => {
    if (window.confirm('Are you sure you want to delete this purchase record?')) {
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

  // Purchase Record Content - Updated to show purchase records
  const renderPurchaseRecord = () => (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Purchase Records</p>
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
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-bold">{filteredPurchases.length}</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Records Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Purchase Records</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search records..."
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Purchase Record ID</TableHead>
                    <TableHead>Supplier Name</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No purchase records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPurchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>
                          <div className="font-medium">{purchase.purchaseRecordId}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{purchase.supplierName || 'N/A'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{formatCurrency(purchase.totalAmount || purchase.amount || 0)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                            {purchase.purchaseDate?.toLocaleDateString() || purchase.expenseDate?.toLocaleDateString() || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(purchase)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
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
      {activeSection === 'purchase-order' && <PurchaseOrderView />}
      {activeSection === 'purchase-record' && renderPurchaseRecord()}

      {/* View Purchase Record Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <DialogTitle>Purchase Record Details</DialogTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => viewingPurchase && generatePurchaseRecordPDF(viewingPurchase)}
                className="text-blue-600 hover:text-blue-700"
              >
                <FileDown className="w-4 h-4 mr-1" />
                PDF
              </Button>
            </div>
          </DialogHeader>
          {viewingPurchase && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Purchase Record ID</Label>
                  <p>{viewingPurchase.purchaseRecordId}</p>
                </div>
                <div>
                  <Label className="font-semibold">Supplier Name</Label>
                  <p>{viewingPurchase.supplierName}</p>
                </div>
                <div>
                  <Label className="font-semibold">Purchase Date</Label>
                  <p>{viewingPurchase.purchaseDate?.toLocaleDateString() || viewingPurchase.expenseDate?.toLocaleDateString() || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-semibold">Currency</Label>
                  <p>{viewingPurchase.companyCurrency}</p>
                </div>
              </div>

              <div>
                <Label className="font-semibold">Items</Label>
                <div className="mt-2 space-y-2">
                  {viewingPurchase.items?.map((item: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Product:</span>
                          <p>{item.productCategory} - {item.itemName} ({item.productVersion})</p>
                        </div>
                        <div>
                          <span className="font-medium">Quantity:</span>
                          <p>{item.quantity} {item.unit}</p>
                        </div>
                        <div>
                          <span className="font-medium">Price per Unit:</span>
                          <p>{formatCurrency(item.pricePerUnit)}</p>
                        </div>
                        <div>
                          <span className="font-medium">Amount:</span>
                          <p>{formatCurrency(item.amount)}</p>
                        </div>
                      </div>
                    </div>
                  )) || <p>No items</p>}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <Label className="font-semibold">Subtotal</Label>
                    <p>{formatCurrency(viewingPurchase.subtotal || 0)}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Tax</Label>
                    <p>{formatCurrency(viewingPurchase.totalTaxAmount || 0)}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Total Amount</Label>
                    <p className="text-lg font-bold">{formatCurrency(viewingPurchase.totalAmount || viewingPurchase.amount || 0)}</p>
                  </div>
                </div>
              </div>

              {viewingPurchase.description && (
                <div>
                  <Label className="font-semibold">Description</Label>
                  <p>{viewingPurchase.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseManagement;


import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, 
  Download, 
  Mail, 
  Trash2, 
  Eye,
  Calendar,
  IndianRupee,
  Plus,
  FileText
} from 'lucide-react';
import { useOptimizedInvoices } from '@/hooks/useOptimizedFirestore';
import { useCompanyData } from '@/hooks/useCompanyData';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import InvoiceView from './InvoiceView';
import EmailInvoiceModal from './EmailInvoiceModal';
import { getCurrencyByCountry } from '@/data/countryCurrencyMapping';
import { calculateInvoiceStatus, getStatusColor, getStatusDisplay } from '@/utils/invoiceStatusUtils';
import { usePayments } from '@/hooks/useFirestore';
import type { Invoice } from '@/hooks/useFirestore';

const InvoiceList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { invoices, loading, deleteInvoice, updateInvoice } = useOptimizedInvoices();
  const { companyData } = useCompanyData();
  const { payments } = usePayments();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // Get company currency info
  const companyCurrencyInfo = companyData?.country 
    ? getCurrencyByCountry(companyData.country)
    : { code: 'USD', symbol: '$', name: 'US Dollar' };

  // Calculate status for each invoice based on payments and due dates
  const processedInvoices = invoices.map(invoice => {
    const paymentDoc = payments.find(p => p.invoiceId === invoice.id);
    const paidAmount = paymentDoc?.totalPaidUSD || invoice.paidUSD || 0;
    const statusResult = calculateInvoiceStatus(invoice, paidAmount);
    
    return {
      ...invoice,
      statusResult,
      calculatedStatus: statusResult.status
    };
  });

  const filteredInvoices = processedInvoices.filter(invoice => {
    const matchesSearch = (invoice.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (invoice.clientName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.calculatedStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });


  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    
    try {
      await deleteInvoice(id);
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete invoice",
        variant: "destructive",
      });
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewModalOpen(true);
  };

  const handleEmailInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsEmailModalOpen(true);
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      // Import jsPDF and html2canvas dynamically
      const [jsPDF, html2canvas] = await Promise.all([
        import('jspdf').then(m => m.default),
        import('html2canvas').then(m => m.default)
      ]);

      // Use the stored country fields from the invoice with fallbacks
      const companyCountry = invoice.companyCountry || 'US';
      const clientCountry = invoice.clientCountry || companyCountry;

      const companyCurrency = getCurrencyByCountry(companyCountry);
      const clientCurrency = getCurrencyByCountry(clientCountry);
      
      const formatCurrency = (amount: number, countryCode: string) => {
        const currencyInfo = getCurrencyByCountry(countryCode);
        return `${currencyInfo.symbol}${amount.toFixed(2)}`;
      };

      const showDualCurrency = companyCountry !== clientCountry && invoice.conversionRate;
      const companyToINRRate = invoice.conversionRate?.companyToINR || 1;
      const INRToClientRate = invoice.conversionRate?.INRToClient || 1;

      const convertINRToClient = (amountINR: number) => amountINR * INRToClientRate;

      // Get payment status
      const paymentDoc = payments.find(p => p.invoiceId === invoice.id);
      const paidAmount = paymentDoc?.totalPaidUSD || invoice.paidUSD || 0;
      const statusResult = calculateInvoiceStatus(invoice, paidAmount);

      // Create comprehensive HTML for professional PDF
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
            .invoice-header { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start;
              margin-bottom: 25px;
              padding: 20px;
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              border-radius: 12px;
              border: 2px solid #e2e8f0;
            }
            .invoice-title {
              font-size: 48px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 10px;
            }
            .invoice-number {
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
            .amount-secondary {
              font-size: 18px;
              color: #6b7280;
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
            .client-header { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); }
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
            <div class="invoice-header">
              <div>
                <div class="invoice-title">INVOICE</div>
                <div class="invoice-number">#${invoice.invoiceNumber}</div>
              </div>
              <div class="total-amount">
                <div class="amount-primary">
                  ${formatCurrency(invoice.companyAmount || invoice.totalAmount || 0, companyCountry)}
                </div>
                ${showDualCurrency ? `
                  <div class="amount-secondary">
                    ${formatCurrency(invoice.clientAmount || convertINRToClient(invoice.totalAmountINR || 0), clientCountry)}
                  </div>
                ` : ''}
              </div>
            </div>

            <div class="two-column">
              <div class="info-card">
                <div class="card-header company-header">Company Information</div>
                <div class="card-content">
                  <div><strong>${invoice.companyName}</strong></div>
                  <div>${invoice.companyAddress}</div>
                  ${invoice.companyPhone ? `<div>📞 ${invoice.companyPhone}</div>` : ''}
                  ${invoice.companyEmail ? `<div>📧 ${invoice.companyEmail}</div>` : ''}
                </div>
              </div>
              
              <div class="info-card">
                <div class="card-header client-header">Client Information</div>
                <div class="card-content">
                  <div><strong>${invoice.clientName}</strong></div>
                  <div>${invoice.clientAddress}</div>
                  ${invoice.clientPhone ? `<div>📞 ${invoice.clientPhone}</div>` : ''}
                  <div>📧 ${invoice.clientEmail}</div>
                </div>
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items?.map(item => `
                  <tr>
                    <td>${item.description}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(item.rate, companyCountry)}</td>
                    <td>${formatCurrency(item.amount, companyCountry)}</td>
                  </tr>
                `).join('') || ''}
              </tbody>
            </table>

            <div class="summary-section">
              <div class="summary-row">
                <span>Subtotal:</span>
                <span>${formatCurrency(invoice.subtotal || 0, companyCountry)}</span>
              </div>
              ${invoice.totalGst ? `
                <div class="summary-row">
                  <span>Total GST:</span>
                  <span>${formatCurrency(invoice.totalGst, companyCountry)}</span>
                </div>
              ` : ''}
              <div class="summary-row summary-total">
                <span>Total Amount:</span>
                <span>${formatCurrency(invoice.totalAmount || 0, companyCountry)}</span>
              </div>
            </div>

            ${invoice.notes ? `
              <div style="margin-top: 20px; padding: 15px; background: #fefce8; border-radius: 8px;">
                <strong>Notes:</strong><br>
                ${invoice.notes}
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

      pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`);

      toast({
        title: "Download Started",
        description: `Invoice ${invoice.invoiceNumber} PDF is being downloaded`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  // Calculate totals for filtered invoices using company currency with proper decimal formatting
  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);
  const paidAmount = filteredInvoices.reduce((sum, invoice) => sum + (invoice.paidUSD || 0), 0);
  const pendingAmount = filteredInvoices.reduce((sum, invoice) => sum + Math.max(0, (invoice.totalAmount || 0) - (invoice.paidUSD || 0)), 0);
  const overdueAmount = filteredInvoices.filter(inv => inv.calculatedStatus === 'overdue').reduce((sum, invoice) => sum + Math.max(0, (invoice.totalAmount || 0) - (invoice.paidUSD || 0)), 0);

  // Format currency using company's currency with consistent decimal places
  const formatCurrency = (amount: number) => {
    return `${companyCurrencyInfo.symbol}${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Invoice Management</h1>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => navigate('/invoices/new')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
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
                <p className="text-sm font-medium text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(paidAmount)}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <IndianRupee className="h-4 w-4 text-green-600" />
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
                <IndianRupee className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(overdueAmount)}</p>
              </div>
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <IndianRupee className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>All Invoices ({filteredInvoices.length})</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search invoices..."
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
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partially-paid">Partially Paid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="paid-after-due">Paid (After Due Date)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">No invoices found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {invoices.length === 0 
                  ? "Get started by creating your first invoice."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
              {invoices.length === 0 && (
                <div className="mt-6">
                  <Button onClick={() => navigate('/invoices/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Invoice
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Paid Amount</TableHead>
                    <TableHead>Pending Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => {
                    const paidAmount = invoice.paidUSD || 0;
                    const totalAmount = invoice.totalAmount || 0;
                    const pendingAmount = Math.max(0, totalAmount - paidAmount);
                    
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <div className="font-medium">{invoice.invoiceNumber || 'N/A'}</div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{invoice.clientName || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{invoice.clientEmail || 'N/A'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{formatCurrency(totalAmount)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-green-600">{formatCurrency(paidAmount)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-yellow-600">{formatCurrency(pendingAmount)}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(invoice.calculatedStatus || 'pending')}>
                            {getStatusDisplay(invoice.statusResult || { status: 'pending' })}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                            {invoice.issueDate ? invoice.issueDate.toLocaleDateString() : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center text-sm ${
                            invoice.calculatedStatus === 'overdue' ? 'text-red-600' : ''
                          }`}>
                            <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                            {invoice.dueDate ? invoice.dueDate.toLocaleDateString() : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              title="View Invoice"
                              onClick={() => handleViewInvoice(invoice)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline" 
                              size="sm" 
                              title="Send Email"
                              onClick={() => handleEmailInvoice(invoice)}
                            >
                              <Mail className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteInvoice(invoice.id)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete Invoice"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <InvoiceView 
        invoice={selectedInvoice}
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
      />
      
      <EmailInvoiceModal
        invoice={selectedInvoice}
        open={isEmailModalOpen}
        onOpenChange={setIsEmailModalOpen}
      />
    </div>
  );
};

export default InvoiceList;

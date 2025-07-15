
import { useState } from 'react';
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
import { getCurrencyByCountry } from '@/data/countryCurrencyMapping';
import type { Invoice } from '@/hooks/useFirestore';

const InvoiceList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { invoices, loading, deleteInvoice, updateInvoice } = useOptimizedInvoices();
  const { companyData } = useCompanyData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Get company currency info
  const companyCurrencyInfo = companyData?.country 
    ? getCurrencyByCountry(companyData.country)
    : { code: 'USD', symbol: '$', name: 'US Dollar' };

  // Auto-update status to "paid" when pending amount is zero
  const processedInvoices = invoices.map(invoice => {
    const paidAmount = invoice.paidUSD || 0;
    const totalAmount = invoice.totalAmountINR || invoice.totalAmount || 0;
    const pendingAmount = Math.max(0, totalAmount - paidAmount);
    
    // If pending amount is zero and status is not already "paid", update it
    if (pendingAmount <= 0.01 && invoice.status !== 'paid' && invoice.status !== 'draft') {
      // Update the invoice status in Firestore
      updateInvoice(invoice.id, { status: 'paid' }).catch(console.error);
      return { ...invoice, status: 'paid' as const };
    }
    
    return invoice;
  });

  const filteredInvoices = processedInvoices.filter(invoice => {
    const matchesSearch = (invoice.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (invoice.clientName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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

  const handleDownloadPDF = (invoice: Invoice) => {
    // Create a basic PDF content
    const content = `
INVOICE

Invoice Number: ${invoice.invoiceNumber}
Client: ${invoice.clientName}
Email: ${invoice.clientEmail}

Issue Date: ${invoice.issueDate?.toLocaleDateString()}
Due Date: ${invoice.dueDate?.toLocaleDateString()}

Items:
${invoice.items?.map(item => 
  `${item.description} - Qty: ${item.quantity} - Rate: ${companyCurrencyInfo.symbol}${item.rate.toFixed(2)} - Amount: ${companyCurrencyInfo.symbol}${item.amount.toFixed(2)}`
).join('\n')}

Subtotal: ${companyCurrencyInfo.symbol}${(invoice.subtotal || 0).toFixed(2)}
Total GST: ${companyCurrencyInfo.symbol}${(invoice.totalGst || 0).toFixed(2)}

TOTAL AMOUNT: ${companyCurrencyInfo.symbol}${(invoice.totalAmountINR || invoice.totalAmount || 0).toFixed(2)}

Notes: ${invoice.notes || 'N/A'}
Terms: ${invoice.terms || 'N/A'}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${invoice.invoiceNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Started",
      description: `Invoice ${invoice.invoiceNumber} is being downloaded`,
    });
  };

  // Calculate totals for filtered invoices using totalAmountINR consistently
  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + (invoice.totalAmountINR || invoice.totalAmount || 0), 0);
  const paidAmount = filteredInvoices.reduce((sum, invoice) => sum + (invoice.paidUSD || 0), 0);
  const pendingAmount = filteredInvoices.reduce((sum, invoice) => sum + Math.max(0, (invoice.totalAmountINR || invoice.totalAmount || 0) - (invoice.paidUSD || 0)), 0);
  const overdueAmount = filteredInvoices.filter(inv => inv.status === 'overdue').reduce((sum, invoice) => sum + Math.max(0, (invoice.totalAmountINR || invoice.totalAmount || 0) - (invoice.paidUSD || 0)), 0);

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
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
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
                    const totalAmount = invoice.totalAmountINR || invoice.totalAmount || 0;
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
                          <Badge className={getStatusColor(invoice.status || 'draft')}>
                            {(invoice.status || 'draft').charAt(0).toUpperCase() + (invoice.status || 'draft').slice(1)}
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
                            invoice.status === 'overdue' ? 'text-red-600' : ''
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
                              title="Download PDF"
                              onClick={() => handleDownloadPDF(invoice)}
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                            <Button variant="outline" size="sm" title="Send Email">
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
    </div>
  );
};

export default InvoiceList;

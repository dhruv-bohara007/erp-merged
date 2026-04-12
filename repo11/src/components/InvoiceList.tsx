
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Plus, 
  Search, 
  Calendar, 
  DollarSign,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { useInvoices } from '@/hooks/useFirestore';
import InvoiceDetailsModal from './InvoiceDetailsModal';
import { useToast } from '@/hooks/use-toast';
import { useFormValidation } from '@/hooks/useFormValidation';

const InvoiceList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canCreateInvoice, getValidationMessage } = useFormValidation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  const { 
    invoices, 
    loading, 
    deleteInvoice 
  } = useInvoices();

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateInvoice = () => {
    if (!canCreateInvoice()) {
      toast({
        title: 'Setup Required',
        description: getValidationMessage(),
        variant: 'destructive'
      });
      return;
    }
    navigate('/invoices/new');
  };

  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowDetailsModal(true);
  };

  const handleEditInvoice = (invoiceId: string) => {
    if (!canCreateInvoice()) {
      toast({
        title: 'Setup Required',
        description: getValidationMessage(),
        variant: 'destructive'
      });
      return;
    }
    navigate(`/invoices/edit/${invoiceId}`);
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      try {
        await deleteInvoice(invoiceId);
        toast({
          title: 'Success',
          description: 'Invoice deleted successfully'
        });
      } catch (error) {
        console.error('Error deleting invoice:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete invoice',
          variant: 'destructive'
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
            <p className="text-gray-600 mt-2">Manage your invoices and track payments</p>
          </div>
          <Button onClick={handleCreateInvoice} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Invoice
          </Button>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search invoices by number or client name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoices List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInvoices.map(invoice => (
            <Card key={invoice.id} className="bg-white shadow-md rounded-lg overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Invoice #{invoice.invoiceNumber}
                </CardTitle>
                <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500">
                  <p>Client: {invoice.clientName}</p>
                  <p>Issue Date: {format(new Date(invoice.issueDate), 'MMM d, yyyy')}</p>
                  <p>Due Date: {format(new Date(invoice.dueDate), 'MMM d, yyyy')}</p>
                  <p className="font-medium">Amount: {formatCurrency(invoice.totalAmount)}</p>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" size="icon" onClick={() => handleViewInvoice(invoice)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleEditInvoice(invoice.id)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => handleDeleteInvoice(invoice.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <InvoiceDetailsModal
          invoice={selectedInvoice}
          open={showDetailsModal}
          onOpenChange={(open) => {
            setShowDetailsModal(open);
            if (!open) {
              setSelectedInvoice(null);
            }
          }}
        />
      )}
    </div>
  );
};

export default InvoiceList;

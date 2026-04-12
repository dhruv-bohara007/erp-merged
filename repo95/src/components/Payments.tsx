
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Download } from 'lucide-react';
import { usePayments } from '@/hooks/useFirestore';
import { useToast } from '@/hooks/use-toast';
import PaymentModal from './PaymentModal';
import PaymentSummaryCards from './PaymentSummaryCards';
import PaymentFilters from './PaymentFilters';
import PaymentTable from './PaymentTable';
import PaymentSync from './PaymentSync';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getPaymentMethod, getPaymentDate, getPaymentReferenceNumber, getPaymentNotes, getPaymentAmount } from '@/utils/paymentUtils';

const Payments = () => {
  const { payments, loading, error } = usePayments();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || getPaymentMethod(payment) === methodFilter;
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const handleDeletePayment = async (paymentId: string) => {
    try {
      await deleteDoc(doc(db, 'payments', paymentId));
      toast({
        title: "Success",
        description: "Payment deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast({
        title: "Error",
        description: "Failed to delete payment",
        variant: "destructive",
      });
    }
  };

  const handleExportAll = () => {
    if (filteredPayments.length === 0) {
      toast({
        title: "No Data",
        description: "No payments to export",
        variant: "destructive",
      });
      return;
    }

    // Create CSV content
    const csvHeader = 'Invoice Number,Client Name,Amount (INR),Payment Method,Payment Date,Status,Reference Number,Notes\n';
    const csvContent = filteredPayments.map(payment => {
      const amount = Math.round(getPaymentAmount(payment) || 0);
      return [
        payment.invoiceNumber,
        payment.clientName,
        amount,
        getPaymentMethod(payment),
        getPaymentDate(payment)?.toLocaleDateString() || '',
        payment.status,
        getPaymentReferenceNumber(payment) || '',
        getPaymentNotes(payment) || ''
      ].join(',');
    }).join('\n');

    const csvData = csvHeader + csvContent;
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payments_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `Exported ${filteredPayments.length} payment records`,
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center">Loading payments...</div>
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

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <PaymentSync />
      
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payment Management</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleExportAll}
            disabled={filteredPayments.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsPaymentModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Record Payment
          </Button>
        </div>
      </div>

      <PaymentSummaryCards payments={filteredPayments} />

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Payment History</CardTitle>
            <PaymentFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              methodFilter={methodFilter}
              onMethodFilterChange={setMethodFilter}
            />
          </div>
        </CardHeader>
        <CardContent>
          <PaymentTable 
            payments={filteredPayments} 
            onDeletePayment={handleDeletePayment}
          />
        </CardContent>
      </Card>

      <PaymentModal 
        open={isPaymentModalOpen} 
        onOpenChange={setIsPaymentModalOpen} 
      />
    </div>
  );
};

export default Payments;

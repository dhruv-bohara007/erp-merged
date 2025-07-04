
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { usePayments } from '@/hooks/useFirestore';
import PaymentModal from './PaymentModal';
import PaymentSummaryCards from './PaymentSummaryCards';
import PaymentFilters from './PaymentFilters';
import PaymentTable from './PaymentTable';
import PaymentSync from './PaymentSync';

const Payments = () => {
  const { payments, loading, error } = usePayments();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || payment.paymentMethod === methodFilter;
    return matchesSearch && matchesStatus && matchesMethod;
  });

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
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setIsPaymentModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Record Payment
        </Button>
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
          <PaymentTable payments={filteredPayments} />
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

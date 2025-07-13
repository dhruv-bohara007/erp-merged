
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Calendar, 
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  IndianRupee,
  History
} from 'lucide-react';
import { Payment } from '@/hooks/useFirestore';
import { useInvoices } from '@/hooks/useFirestore';
import PaymentHistoryModal from './PaymentHistoryModal';
import { getCurrencyByCountry } from '@/data/countryCurrencyMapping';

interface PaymentTableProps {
  payments: Payment[];
}

interface GroupedPayment {
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  totalAmountPaid: number;
  latestPaymentDate: Date;
  latestPaymentMethod: string;
  pendingAmountINR: number;
  status: string;
  paymentTiming: string;
  companyCountry?: string;
}

const PaymentTable = ({ payments }: PaymentTableProps) => {
  const { invoices } = useInvoices();
  const [paymentHistoryModal, setPaymentHistoryModal] = useState({
    open: false,
    invoiceId: '',
    invoiceNumber: '',
    companyCountry: ''
  });

  // Calculate payment timing relative to due date - moved before usage
  const getPaymentTiming = (paymentDate: Date, invoiceId: string, invoice?: any) => {
    if (!invoice || !invoice.dueDate) return '-';
    
    const diffTime = paymentDate.getTime() - invoice.dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'On due date';
    if (diffDays > 0) return `${diffDays} days after due date`;
    return `${Math.abs(diffDays)} days before due date`;
  };

  // Group payments by invoice to avoid duplicates
  const groupedPayments: GroupedPayment[] = payments.reduce((acc, payment) => {
    const existingGroup = acc.find(group => group.invoiceId === payment.invoiceId);
    
    if (existingGroup) {
      // Update existing group with accumulated data
      existingGroup.totalAmountPaid += payment.amount || 0;
      if (payment.paymentDate > existingGroup.latestPaymentDate) {
        existingGroup.latestPaymentDate = payment.paymentDate;
        existingGroup.latestPaymentMethod = payment.paymentMethod;
      }
    } else {
      // Create new group
      const invoice = invoices.find(inv => inv.id === payment.invoiceId);
      const pendingAmount = invoice?.pendingINR || 0;
      
      acc.push({
        invoiceId: payment.invoiceId,
        invoiceNumber: payment.invoiceNumber,
        clientName: payment.clientName,
        totalAmountPaid: payment.amount || 0,
        latestPaymentDate: payment.paymentDate,
        latestPaymentMethod: payment.paymentMethod,
        pendingAmountINR: pendingAmount,
        status: pendingAmount > 0 ? 'pending' : 'completed',
        paymentTiming: getPaymentTiming(payment.paymentDate, payment.invoiceId, invoice),
        companyCountry: invoice?.companyCountry
      });
    }
    
    return acc;
  }, [] as GroupedPayment[]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'neft':
      case 'rtgs':
      case 'imps': return <Building className="w-4 h-4" />;
      case 'upi': return <Smartphone className="w-4 h-4" />;
      case 'credit_card':
      case 'debit_card': return <CreditCard className="w-4 h-4" />;
      case 'cash': return <Banknote className="w-4 h-4" />;
      case 'cheque': return <IndianRupee className="w-4 h-4" />;
      default: return <IndianRupee className="w-4 h-4" />;
    }
  };

  const handleViewPaymentHistory = (invoiceId: string, invoiceNumber: string, companyCountry?: string) => {
    setPaymentHistoryModal({
      open: true,
      invoiceId,
      invoiceNumber,
      companyCountry: companyCountry || ''
    });
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Amount Paid (INR)</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Pending Payment (INR)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  No payments found
                </TableCell>
              </TableRow>
            ) : (
              groupedPayments.map((group) => (
                <TableRow key={group.invoiceId}>
                  <TableCell>
                    <div className="font-medium">{group.invoiceNumber}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{group.clientName}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">₹{group.totalAmountPaid.toLocaleString()}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getPaymentMethodIcon(group.latestPaymentMethod)}
                      <span className="capitalize">{group.latestPaymentMethod.replace('_', ' ').toUpperCase()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                      {group.latestPaymentDate.toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">₹{group.pendingAmountINR.toLocaleString()}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(group.status)}>
                      {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {group.paymentTiming}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewPaymentHistory(group.invoiceId, group.invoiceNumber, group.companyCountry)}
                    >
                      <History className="w-4 h-4 mr-1" />
                      History
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaymentHistoryModal
        open={paymentHistoryModal.open}
        onOpenChange={(open) => setPaymentHistoryModal(prev => ({ ...prev, open }))}
        invoiceId={paymentHistoryModal.invoiceId}
        invoiceNumber={paymentHistoryModal.invoiceNumber}
        payments={payments}
        companyCountry={paymentHistoryModal.companyCountry}
      />
    </>
  );
};

export default PaymentTable;

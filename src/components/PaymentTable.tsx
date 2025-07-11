
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Calendar, 
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  IndianRupee
} from 'lucide-react';
import { Payment } from '@/hooks/useFirestore';
import { useInvoices } from '@/hooks/useFirestore';

interface PaymentTableProps {
  payments: Payment[];
}

const PaymentTable = ({ payments }: PaymentTableProps) => {
  const { invoices } = useInvoices();

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

  // Calculate payment timing relative to due date
  const getPaymentTiming = (paymentDate: Date, invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice || !invoice.dueDate) return '-';
    
    const diffTime = paymentDate.getTime() - invoice.dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'On due date';
    if (diffDays > 0) return `${diffDays} days after due date`;
    return `${Math.abs(diffDays)} days before due date`;
  };

  return (
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                No payments found
              </TableCell>
            </TableRow>
          ) : (
            payments.map((payment) => {
              return (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div className="font-medium">{payment.invoiceNumber}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{payment.clientName}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">₹{payment.amount?.toLocaleString() || '0'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getPaymentMethodIcon(payment.paymentMethod)}
                      <span className="capitalize">{payment.paymentMethod.replace('_', ' ').toUpperCase()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                      {payment.paymentDate.toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">₹{(payment.pendingAmountINR || 0).toLocaleString()}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {getPaymentTiming(payment.paymentDate, payment.invoiceId)}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default PaymentTable;

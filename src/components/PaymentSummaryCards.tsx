
import { Card, CardContent } from '@/components/ui/card';
import { IndianRupee, Calendar } from 'lucide-react';
import { Payment } from '@/hooks/useFirestore';
import { useInvoices } from '@/hooks/useFirestore';

interface PaymentSummaryCardsProps {
  payments: Payment[];
}

const PaymentSummaryCards = ({ payments }: PaymentSummaryCardsProps) => {
  const { invoices } = useInvoices();

  // Calculate Total Received from payments (sum of all payment amounts in INR)
  const totalReceived = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

  // Calculate Pending from outstanding invoices minus payments made
  const pendingAmount = invoices.reduce((total, invoice) => {
    if (['draft', 'sent', 'overdue'].includes(invoice.status)) {
      const invoiceTotal = invoice.totalAmountINR || invoice.totalAmount || 0;
      const invoicePayments = payments.filter(p => p.invoiceId === invoice.id);
      const totalPaid = invoicePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      return total + Math.max(0, invoiceTotal - totalPaid);
    }
    return total;
  }, 0);
  
  // Calculate this month's revenue from payments (current month)
  const thisMonthRevenue = payments.filter(payment => {
    if (!payment.paymentDate) return false;
    const paymentDate = new Date(payment.paymentDate);
    const currentDate = new Date();
    return paymentDate.getMonth() === currentDate.getMonth() && 
           paymentDate.getFullYear() === currentDate.getFullYear();
  }).reduce((sum, payment) => sum + (payment.amount || 0), 0);

  // Format currency to 2 decimal places
  const formatINR = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Received</p>
              <p className="text-2xl font-bold text-green-600">{formatINR(totalReceived)}</p>
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
              <p className="text-2xl font-bold text-yellow-600">{formatINR(pendingAmount)}</p>
            </div>
            <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <Calendar className="h-4 w-4 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold">{formatINR(thisMonthRevenue)}</p>
            </div>
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSummaryCards;

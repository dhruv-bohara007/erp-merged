
import { Card, CardContent } from '@/components/ui/card';
import { IndianRupee, Calendar } from 'lucide-react';
import { Payment } from '@/hooks/useFirestore';
import { useInvoices } from '@/hooks/useFirestore';

interface PaymentSummaryCardsProps {
  payments: Payment[];
}

const PaymentSummaryCards = ({ payments }: PaymentSummaryCardsProps) => {
  const { invoices } = useInvoices();

  // Calculate Total Received from paid invoices (not payments)
  const totalReceived = invoices
    .filter(invoice => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + (invoice.totalAmountINR || invoice.totalAmount || 0), 0);

  // Calculate Pending from outstanding invoices (draft, sent, overdue)
  const pendingAmount = invoices
    .filter(invoice => ['draft', 'sent', 'overdue'].includes(invoice.status))
    .reduce((sum, invoice) => sum + (invoice.totalAmountINR || invoice.totalAmount || 0), 0);
  
  // Calculate this month's revenue from paid invoices (current month)
  const thisMonthRevenue = invoices.filter(invoice => {
    if (!invoice.createdAt || invoice.status !== 'paid') return false;
    const invoiceDate = new Date(invoice.createdAt);
    const currentDate = new Date();
    return invoiceDate.getMonth() === currentDate.getMonth() && 
           invoiceDate.getFullYear() === currentDate.getFullYear();
  }).reduce((sum, invoice) => sum + (invoice.totalAmountINR || invoice.totalAmount || 0), 0);

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

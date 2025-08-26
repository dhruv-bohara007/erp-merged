
import { Card, CardContent } from '@/components/ui/card';
import { IndianRupee, Calendar } from 'lucide-react';
import { Payment } from '@/types/firestore';
import { getOriginalPaymentAmount, getPaymentDate } from '@/utils/paymentUtils';
import { useInvoices } from '@/hooks/useFirestore';
import { useCompanyData } from '@/hooks/useCompanyData';

interface PaymentSummaryCardsProps {
  payments: Payment[];
}

const PaymentSummaryCards = ({ payments }: PaymentSummaryCardsProps) => {
  const { invoices } = useInvoices();
  const { companyData } = useCompanyData();

  // Get currency symbol based on company currency
  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'INR': '₹',
      'JPY': '¥',
      'CAD': 'C$',
      'AUD': 'A$',
      'CHF': 'CHF',
      'CNY': '¥',
      'SEK': 'kr',
      'NZD': 'NZ$'
    };
    return symbols[currency] || currency;
  };

  const formatCurrency = (amount: number) => {
    const currency = companyData?.companyCurrency || 'USD';
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${amount.toFixed(2)}`;
  };

  // Calculate Total Received from payments (sum of all original payment amounts)
  const totalReceived = payments.reduce((sum, payment) => sum + getOriginalPaymentAmount(payment), 0);

  // Calculate Pending from outstanding invoices minus all payments made
  const pendingAmount = Math.round(invoices.reduce((total, invoice) => {
    if (['draft', 'sent', 'pending', 'overdue'].includes(invoice.status)) {
      const invoiceTotal = invoice.totalAmount || 0;
      const invoicePayments = payments.filter(p => p.invoiceId === invoice.id);
      const totalPaid = invoicePayments.reduce((sum, p) => sum + getOriginalPaymentAmount(p), 0);
      return total + Math.max(0, invoiceTotal - totalPaid);
    }
    return total;
  }, 0) * 100) / 100;
  
  // Calculate this month's revenue from payments (current month) - use originalPaymentAmount
  const thisMonthRevenue = payments.filter(payment => {
    const paymentDate = getPaymentDate(payment);
    const currentDate = new Date();
    return paymentDate.getMonth() === currentDate.getMonth() && 
           paymentDate.getFullYear() === currentDate.getFullYear();
  }).reduce((sum, payment) => sum + getOriginalPaymentAmount(payment), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Received</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalReceived)}</p>
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
              <p className="text-2xl font-bold">{formatCurrency(thisMonthRevenue)}</p>
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

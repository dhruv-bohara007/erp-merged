
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { useInvoices } from '@/hooks/useFirestore';
import { getCurrencyByCountry } from '@/data/countryCurrencyMapping';

const PaymentSummaryCards = () => {
  const { invoices } = useInvoices();

  // Calculate payment statistics from invoices
  const stats = invoices.reduce((acc, invoice) => {
    const amountPaidByClient = invoice.amountPaidByClient || 0;
    const totalClientAmount = invoice.clientAmount || invoice.totalAmount || 0;
    const pendingAmount = Math.max(0, totalClientAmount - amountPaidByClient);
    
    // Convert to INR for consistent totals
    const clientCurrency = getCurrencyByCountry(invoice.clientCountry || 'IN').code;
    let amountPaidINR = amountPaidByClient;
    let pendingAmountINR = pendingAmount;
    
    // Simple conversion if not already in INR (using stored conversion rates)
    if (clientCurrency !== 'INR' && invoice.conversionRate?.INRToClient) {
      amountPaidINR = amountPaidByClient / invoice.conversionRate.INRToClient;
      pendingAmountINR = pendingAmount / invoice.conversionRate.INRToClient;
    }
    
    acc.totalPaid += amountPaidINR;
    acc.totalPending += pendingAmountINR;
    
    if (invoice.status === 'paid') {
      acc.completedPayments += 1;
    } else if (amountPaidByClient > 0) {
      acc.partialPayments += 1;
    }
    
    return acc;
  }, {
    totalPaid: 0,
    totalPending: 0,
    completedPayments: 0,
    partialPayments: 0
  });

  const formatINR = (amount: number) => {
    return `₹${Math.round(amount).toLocaleString()}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Received</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatINR(stats.totalPaid)}
          </div>
          <p className="text-xs text-muted-foreground">
            From {stats.completedPayments + stats.partialPayments} invoices
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {formatINR(stats.totalPending)}
          </div>
          <p className="text-xs text-muted-foreground">
            Outstanding payments
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.completedPayments}
          </div>
          <p className="text-xs text-muted-foreground">
            Fully paid invoices
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Partial Payments</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {stats.partialPayments}
          </div>
          <p className="text-xs text-muted-foreground">
            Partially paid invoices
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSummaryCards;

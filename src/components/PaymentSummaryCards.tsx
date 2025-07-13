
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { useInvoices } from '@/hooks/useFirestore';

const PaymentSummaryCards = () => {
  const { invoices } = useInvoices();

  // Calculate payment statistics from invoices in company currency (USD)
  const stats = invoices.reduce((acc, invoice) => {
    const amountPaidInCompanyCurrency = invoice.amountPaidInCompanyCurrency || 0;
    const totalCompanyAmount = invoice.totalAmount || 0;
    const pendingAmount = Math.max(0, totalCompanyAmount - amountPaidInCompanyCurrency);
    
    acc.totalPaid += amountPaidInCompanyCurrency;
    acc.totalPending += pendingAmount;
    
    if (invoice.status === 'paid') {
      acc.completedPayments += 1;
    } else if (amountPaidInCompanyCurrency > 0) {
      acc.partialPayments += 1;
    }
    
    return acc;
  }, {
    totalPaid: 0,
    totalPending: 0,
    completedPayments: 0,
    partialPayments: 0
  });

  const formatUSD = (amount: number) => {
    return `$${Math.round(amount).toLocaleString()}`;
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
            {formatUSD(stats.totalPaid)}
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
            {formatUSD(stats.totalPending)}
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

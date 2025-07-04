
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee, FileText, Users, TrendingUp } from 'lucide-react';
import { useInvoices, useClients } from '@/hooks/useFirestore';

const ReportsMetrics = () => {
  const { invoices } = useInvoices();
  const { clients } = useClients();

  // Calculate dynamic metrics
  const totalRevenue = invoices
    .filter(invoice => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);

  const totalInvoices = invoices.length;

  const averageInvoiceValue = totalInvoices > 0 
    ? invoices.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0) / totalInvoices 
    : 0;

  const activeClients = clients.filter(client => client.status === 'active').length;

  const formatIndianCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          <IndianRupee className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatIndianCurrency(totalRevenue)}</div>
          <p className="text-xs text-gray-500">From paid invoices</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Total Invoices</CardTitle>
          <FileText className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalInvoices}</div>
          <p className="text-xs text-gray-500">All time invoices</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Average Invoice Value</CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatIndianCurrency(averageInvoiceValue)}</div>
          <p className="text-xs text-gray-500">Per invoice average</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Active Clients</CardTitle>
          <Users className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeClients}</div>
          <p className="text-xs text-gray-500">Currently active</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsMetrics;

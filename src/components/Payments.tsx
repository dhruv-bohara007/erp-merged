
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SampleDataToggle from '@/components/SampleDataToggle';
import { useSampleData } from '@/contexts/SampleDataContext';

const Payments = () => {
  const { showSampleData } = useSampleData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Sample data for when toggle is enabled
  const samplePayments = [
    {
      id: 'PAY-001',
      invoiceId: 'INV-001',
      client: 'Acme Corp',
      amount: 2500,
      status: 'completed',
      method: 'Bank Transfer',
      date: '2024-01-15'
    },
    {
      id: 'PAY-002',
      invoiceId: 'INV-002',
      client: 'TechStart Inc',
      amount: 1800,
      status: 'pending',
      method: 'Credit Card',
      date: '2024-01-20'
    },
    {
      id: 'PAY-003',
      invoiceId: 'INV-004',
      client: 'Innovation Labs',
      amount: 4500,
      status: 'completed',
      method: 'Bank Transfer',
      date: '2024-01-25'
    },
    {
      id: 'PAY-004',
      invoiceId: 'INV-005',
      client: 'Digital Dynamics',
      amount: 2100,
      status: 'processing',
      method: 'PayPal',
      date: '2024-01-30'
    }
  ];

  const samplePaymentStats = [
    { month: 'Jan', amount: 8900 },
    { month: 'Feb', amount: 12400 },
    { month: 'Mar', amount: 15600 },
    { month: 'Apr', amount: 18200 },
    { month: 'May', amount: 16800 },
    { month: 'Jun', amount: 21300 }
  ];

  const sampleSummary = {
    totalReceived: 98500,
    pendingPayments: 3900,
    averagePaymentTime: 7,
    completedPayments: 42
  };

  // Real data would come from your hooks here
  const payments = showSampleData ? samplePayments : [];
  const paymentStats = showSampleData ? samplePaymentStats : [];
  const summary = showSampleData ? sampleSummary : {
    totalReceived: 0,
    pendingPayments: 0,
    averagePaymentTime: 0,
    completedPayments: 0
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.invoiceId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-600">Track and manage payment transactions</p>
      </div>

      <SampleDataToggle />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.totalReceived.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All time payments received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.pendingPayments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Payment Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.averagePaymentTime} days</div>
            <p className="text-xs text-muted-foreground">
              Average time to payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.completedPayments}</div>
            <p className="text-xs text-muted-foreground">
              Successful payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Trends Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Payment Trends</CardTitle>
          <CardDescription>Monthly payment amounts received</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={paymentStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
              <Bar dataKey="amount" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
          <CardDescription>Recent payment activity and status</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {showSampleData ? 'No payments match your search criteria' : 'No payments found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.id}</TableCell>
                      <TableCell>{payment.invoiceId}</TableCell>
                      <TableCell>{payment.client}</TableCell>
                      <TableCell>${payment.amount.toLocaleString()}</TableCell>
                      <TableCell>{payment.method}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{payment.date}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Payments;

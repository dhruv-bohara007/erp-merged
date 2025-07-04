
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Calendar, 
  IndianRupee,
  TrendingUp,
  Users,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useInvoices, useClients, usePayments } from '@/hooks/useFirestore';

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedYear, setSelectedYear] = useState('2024');
  
  const { invoices, loading: invoicesLoading } = useInvoices();
  const { clients, loading: clientsLoading } = useClients();
  const { payments, loading: paymentsLoading } = usePayments();

  // Calculate real data from Firestore
  const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const totalInvoices = invoices.length;
  const averageInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;
  const activeClients = clients.filter(c => c.status === 'active').length;

  // Generate monthly revenue data from actual invoices
  const monthlyRevenue = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ].map((month, index) => {
    const monthInvoices = invoices.filter(invoice => {
      const invoiceMonth = invoice.issueDate.getMonth();
      return invoiceMonth === index;
    });
    
    return {
      month,
      revenue: monthInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
      invoices: monthInvoices.length,
      paid: monthInvoices.filter(inv => inv.status === 'paid').length,
      unpaid: monthInvoices.filter(inv => inv.status !== 'paid').length
    };
  });

  // Generate client reports from actual data
  const clientReports = clients.slice(0, 5).map(client => {
    const clientInvoices = invoices.filter(inv => inv.clientId === client.id);
    const clientPayments = payments.filter(p => p.clientId === client.id && p.status === 'completed');
    
    // Calculate average payment days
    const avgPaymentDays = clientPayments.length > 0 
      ? Math.round(clientPayments.reduce((sum, payment) => {
          const invoice = invoices.find(inv => inv.id === payment.invoiceId);
          if (invoice) {
            const daysDiff = Math.abs(payment.paymentDate.getTime() - invoice.issueDate.getTime()) / (1000 * 60 * 60 * 24);
            return sum + daysDiff;
          }
          return sum;
        }, 0) / clientPayments.length)
      : 0;

    return {
      name: client.name,
      revenue: clientInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
      invoices: clientInvoices.length,
      avgPaymentDays
    };
  });

  // Generate aging report from actual unpaid invoices
  const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid');
  const agingReport = [
    { range: 'Current (0-30 days)', color: '#10B981' },
    { range: '31-60 days', color: '#F59E0B' },
    { range: '61-90 days', color: '#EF4444' },
    { range: '90+ days', color: '#DC2626' }
  ].map(range => {
    const today = new Date();
    let filteredInvoices = [];
    
    if (range.range === 'Current (0-30 days)') {
      filteredInvoices = unpaidInvoices.filter(inv => {
        const daysDiff = (today.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff >= 0 && daysDiff <= 30;
      });
    } else if (range.range === '31-60 days') {
      filteredInvoices = unpaidInvoices.filter(inv => {
        const daysDiff = (today.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff > 30 && daysDiff <= 60;
      });
    } else if (range.range === '61-90 days') {
      filteredInvoices = unpaidInvoices.filter(inv => {
        const daysDiff = (today.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff > 60 && daysDiff <= 90;
      });
    } else {
      filteredInvoices = unpaidInvoices.filter(inv => {
        const daysDiff = (today.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff > 90;
      });
    }

    return {
      ...range,
      amount: filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
      count: filteredInvoices.length
    };
  });

  // Calculate GST summary from actual invoices
  const gstSummary = [
    { 
      type: 'CGST Collected', 
      amount: invoices.reduce((sum, inv) => sum + inv.cgst, 0), 
      rate: '9%' 
    },
    { 
      type: 'SGST Collected', 
      amount: invoices.reduce((sum, inv) => sum + inv.sgst, 0), 
      rate: '9%' 
    },
    { 
      type: 'IGST Collected', 
      amount: invoices.reduce((sum, inv) => sum + inv.igst, 0), 
      rate: '18%' 
    },
    { 
      type: 'Total GST', 
      amount: invoices.reduce((sum, inv) => sum + inv.totalGst, 0), 
      rate: 'Variable' 
    }
  ];

  if (invoicesLoading || clientsLoading || paymentsLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <div className="flex gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="quarter">Quarterly</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600">From {totalInvoices} invoices</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <IndianRupee className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold">{totalInvoices}</p>
                <p className="text-xs text-green-600">Active records</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <FileText className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Invoice Value</p>
                <p className="text-2xl font-bold">₹{averageInvoiceValue.toLocaleString()}</p>
                <p className="text-xs text-yellow-600">Per invoice</p>
              </div>
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Clients</p>
                <p className="text-2xl font-bold">{activeClients}</p>
                <p className="text-xs text-blue-600">Total clients: {clients.length}</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
          <TabsTrigger value="clients">Client Reports</TabsTrigger>
          <TabsTrigger value="aging">Aging Report</TabsTrigger>
          <TabsTrigger value="gst">GST Summary</TabsTrigger>
        </TabsList>

        {/* Revenue Analysis */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  Monthly Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Invoice Count Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="invoices" stroke="#10B981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Client Reports */}
        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" />
                Client Performance Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clientReports.map((client, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{client.name}</div>
                      <div className="text-sm text-gray-500">{client.invoices} invoices</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">₹{client.revenue.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">
                        Avg. payment: {client.avgPaymentDays} days
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aging Report */}
        <TabsContent value="aging">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Outstanding Invoices by Age
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={agingReport}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="amount"
                    >
                      {agingReport.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 mt-4">
                  {agingReport.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm">{item.range}</span>
                      </div>
                      <div className="text-sm font-medium">₹{item.amount.toLocaleString()} ({item.count})</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aging Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agingReport.map((item, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{item.range}</span>
                        <span className="text-lg font-bold">₹{item.amount.toLocaleString()}</span>
                      </div>
                      <div className="text-sm text-gray-500">{item.count} invoices</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="h-2 rounded-full" 
                          style={{ 
                            width: `${Math.max((item.amount / Math.max(...agingReport.map(r => r.amount))) * 100, 5)}%`,
                            backgroundColor: item.color 
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* GST Summary */}
        <TabsContent value="gst">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-500" />
                GST Summary Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {gstSummary.map((gst, index) => (
                  <div key={index} className="p-6 border rounded-lg">
                    <div className="text-sm text-gray-600">{gst.type}</div>
                    <div className="text-2xl font-bold mt-1">₹{gst.amount.toLocaleString()}</div>
                    <div className="text-sm text-blue-600 mt-1">Rate: {gst.rate}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total GST Collected</span>
                  <span className="text-xl font-bold">
                    ₹{gstSummary.slice(0, 3).reduce((sum, gst) => sum + gst.amount, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;

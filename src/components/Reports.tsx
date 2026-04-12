
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
import { useCompanyData } from '@/hooks/useCompanyData';
import ReportsMetrics from './ReportsMetrics';

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedYear, setSelectedYear] = useState('2024');

  const { invoices, loading: invoicesLoading } = useInvoices();
  const { clients, loading: clientsLoading } = useClients();
  const { payments, loading: paymentsLoading } = usePayments();
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

  const formatCompactCurrency = (amount: number) => {
    const currency = companyData?.companyCurrency || 'USD';
    const symbol = getCurrencySymbol(currency);
    
    if (amount >= 10000000) return `${symbol}${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `${symbol}${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `${symbol}${(amount / 1000).toFixed(0)}K`;
    return `${symbol}${amount.toLocaleString()}`;
  };

  if (invoicesLoading || clientsLoading || paymentsLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading reports data...</div>
        </div>
      </div>
    );
  }

  // Calculate monthly revenue data using totalAmount consistently (same as InvoiceList)
  const monthlyRevenue = (() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthInvoices = invoices.filter(invoice => {
        const invoiceDate = invoice.issueDate || invoice.createdAt;
        if (!invoiceDate) return false;
        const date = new Date(invoiceDate);
        return date.getMonth() === index && date.getFullYear() === currentYear;
      });
      
      const paidInvoices = monthInvoices.filter(inv => inv.status === 'paid');
      const unpaidInvoices = monthInvoices.filter(inv => inv.status !== 'paid');
      
      return {
        month,
        revenue: paidInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
        invoices: monthInvoices.length,
        paid: paidInvoices.length,
        unpaid: unpaidInvoices.length
      };
    });
  })();

  // Calculate client reports using totalAmount consistently
  const clientReports = (() => {
    const clientMap = new Map();
    
    clients.forEach(client => {
      const clientInvoices = invoices.filter(inv => inv.clientId === client.id);
      const paidInvoices = clientInvoices.filter(inv => inv.status === 'paid');
      const revenue = paidInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
      
      // Calculate average payment days
      const paidInvoicesWithDates = paidInvoices.filter(inv => inv.issueDate && inv.updatedAt);
      const avgPaymentDays = paidInvoicesWithDates.length > 0 
        ? Math.round(paidInvoicesWithDates.reduce((sum, inv) => {
            const issueDate = new Date(inv.issueDate!);
            const paidDate = new Date(inv.updatedAt!);
            const daysDiff = Math.max(0, Math.ceil((paidDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24)));
            return sum + daysDiff;
          }, 0) / paidInvoicesWithDates.length)
        : 0;
      
      if (revenue > 0) {
        clientMap.set(client.id, {
          name: client.name,
          revenue,
          invoices: clientInvoices.length,
          avgPaymentDays
        });
      }
    });
    
    return Array.from(clientMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  })();

  // Calculate aging report using totalAmount consistently
  const agingReport = (() => {
    const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid');
    const currentDate = new Date();
    
    const ranges = [
      { range: 'Current (0-30 days)', min: 0, max: 30, color: '#10B981' },
      { range: '31-60 days', min: 31, max: 60, color: '#F59E0B' },
      { range: '61-90 days', min: 61, max: 90, color: '#EF4444' },
      { range: '90+ days', min: 91, max: Infinity, color: '#DC2626' }
    ];
    
    return ranges.map(range => {
      const rangeInvoices = unpaidInvoices.filter(inv => {
        if (!inv.dueDate) return false;
        const dueDate = new Date(inv.dueDate);
        const daysPastDue = Math.max(0, Math.ceil((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
        return daysPastDue >= range.min && daysPastDue <= range.max;
      });
      
      return {
        ...range,
        amount: rangeInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
        count: rangeInvoices.length
      };
    });
  })();

  // Calculate GST summary using totalAmount consistently
  const gstSummary = (() => {
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    
    const cgstCollected = paidInvoices.reduce((sum, inv) => sum + (inv.cgst || 0), 0);
    const sgstCollected = paidInvoices.reduce((sum, inv) => sum + (inv.sgst || 0), 0);
    const igstCollected = paidInvoices.reduce((sum, inv) => sum + (inv.igst || 0), 0);
    
    // TDS is typically 10% of total invoice value for certain transactions
    const tdsDeducted = paidInvoices.reduce((sum, inv) => {
      // Assuming TDS is deducted on invoices above certain threshold
      const invoiceTotal = inv.totalAmount || 0;
      return sum + (invoiceTotal > 30000 ? invoiceTotal * 0.01 : 0);
    }, 0);

    return [
      { type: 'CGST Collected', amount: cgstCollected, rate: '9%' },
      { type: 'SGST Collected', amount: sgstCollected, rate: '9%' },
      { type: 'IGST Collected', amount: igstCollected, rate: '18%' },
      { type: 'TDS Deducted', amount: tdsDeducted, rate: '1%' }
    ];
  })();

  const totalRevenue = monthlyRevenue.reduce((sum, month) => sum + month.revenue, 0);
  const totalInvoices = monthlyRevenue.reduce((sum, month) => sum + month.invoices, 0);
  const averageInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

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

      {/* Use the ReportsMetrics component */}
      <ReportsMetrics />

      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
          <TabsTrigger value="clients">Client Reports</TabsTrigger>
          <TabsTrigger value="aging">Aging Report</TabsTrigger>
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
                    <YAxis tickFormatter={(value) => formatCompactCurrency(value)} />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
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
                Top Client Performance Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clientReports.length > 0 ? (
                <div className="space-y-4">
                  {clientReports.map((client, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-gray-500">{client.invoices} invoices</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{formatCurrency(client.revenue)}</div>
                        <div className="text-sm text-gray-500">
                          Avg. payment: {client.avgPaymentDays} days
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No client data available yet
                </div>
              )}
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
                {agingReport.some(item => item.amount > 0) ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={agingReport.filter(item => item.amount > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="amount"
                        >
                          {agingReport.filter(item => item.amount > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Amount']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-2 mt-4">
                      {agingReport.filter(item => item.amount > 0).map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="text-sm">{item.range}</span>
                          </div>
                          <div className="text-sm font-medium">
                            {formatCurrency(item.amount)} ({item.count})
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No outstanding invoices
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aging Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agingReport.map((item, index) => {
                    const totalOutstanding = agingReport.reduce((sum, range) => sum + range.amount, 0);
                    const percentage = totalOutstanding > 0 ? (item.amount / totalOutstanding) * 100 : 0;
                    
                    return (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{item.range}</span>
                          <span className="text-lg font-bold">{formatCurrency(item.amount)}</span>
                        </div>
                        <div className="text-sm text-gray-500">{item.count} invoices</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-300" 
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: item.color 
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default Reports;

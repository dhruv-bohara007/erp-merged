
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Users, 
  IndianRupee, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  Plus,
  Receipt,
  Settings
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useInvoices, useClients, usePayments } from '@/hooks/useFirestore';
import { useCompanyData } from '@/hooks/useCompanyData';
import AddClientModal from '@/components/AddClientModal';
import { useNavigate } from 'react-router-dom';
import { getOriginalPaymentAmount, getPaymentDate } from '@/utils/paymentUtils';

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const navigate = useNavigate();

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

  // Calculate dashboard metrics using payments data for consistency with Payment Management page
  const totalInvoices = invoices.length;
  
  // Total Received from payments (sum of all original payment amounts) - matches Payment Management
  const totalReceived = payments.reduce((sum, payment) => sum + getOriginalPaymentAmount(payment), 0);

  // Calculate Pending from outstanding invoices minus payments made - matches Payment Management
  const pendingAmount = invoices.reduce((total, invoice) => {
    if (['draft', 'sent', 'overdue', 'pending'].includes(invoice.status)) {
      const invoiceTotal = invoice.companyAmount || invoice.totalAmount || 0;
      const invoicePayments = payments.filter(p => p.invoiceId === invoice.id);
      const totalPaid = invoicePayments.reduce((sum, p) => sum + getOriginalPaymentAmount(p), 0);
      return total + Math.max(0, invoiceTotal - totalPaid);
    }
    return total;
  }, 0);

  // Calculate overdue amount using invoice status - matches Invoice Management
  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');
  const totalOverdueAmount = overdueInvoices.reduce((sum, inv) => {
    const invoiceTotal = inv.companyAmount || inv.totalAmount || 0;
    const invoicePayments = payments.filter(p => p.invoiceId === inv.id);
    const totalPaid = invoicePayments.reduce((sum, p) => sum + getOriginalPaymentAmount(p), 0);
    return sum + Math.max(0, invoiceTotal - totalPaid);
  }, 0);

  const paidInvoices = invoices.filter(inv => inv.status === 'paid' || inv.status === 'paid-after-due');
  const unpaidInvoices = invoices.filter(inv => ['sent', 'draft', 'pending', 'partially-paid'].includes(inv.status || 'draft'));

  // Status data for pie chart
  const statusData = [
    { name: 'Paid', value: paidInvoices.length, color: '#10B981' },
    { name: 'Unpaid', value: unpaidInvoices.length, color: '#F59E0B' },
    { name: 'Overdue', value: overdueInvoices.length, color: '#EF4444' },
  ];

  // Monthly revenue data (last 6 months) using payments data in company currency
  const getMonthlyRevenue = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const last6Months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthYear = `${monthNames[date.getMonth()]}`;
      
      // Use payments data for more accurate revenue calculation
      const monthlyTotal = payments
        .filter(payment => {
          const paymentDate = getPaymentDate(payment);
          return paymentDate.getMonth() === date.getMonth() && 
                 paymentDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, payment) => sum + getOriginalPaymentAmount(payment), 0);
      
      last6Months.push({ month: monthYear, revenue: monthlyTotal });
    }
    
    return last6Months;
  };

  // Top clients by total paid amount using payments data in company currency
  const getTopClients = () => {
    const clientTotals = new Map();
    
    payments.forEach(payment => {
      if (!payment.clientId || !payment.clientName) return;
      const paymentAmount = getOriginalPaymentAmount(payment);
      
      const current = clientTotals.get(payment.clientId) || { name: payment.clientName, total: 0 };
      current.total += paymentAmount;
      clientTotals.set(payment.clientId, current);
    });
    
    return Array.from(clientTotals.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  };

  const topClients = getTopClients();

  // Recent activities
  const getRecentActivities = () => {
    const activities = [];
    
    // Recent payments
    payments.slice(0, 2).forEach(payment => {
      if (!payment.id || !payment.clientName || !getOriginalPaymentAmount(payment) || !payment.updatedAt) return;
      
      activities.push({
        id: `payment-${payment.id}`,
        type: 'payment',
        message: `Payment received from ${payment.clientName}`,
        amount: formatCurrency(getOriginalPaymentAmount(payment)),
        time: formatTimeAgo(payment.updatedAt?.toDate ? payment.updatedAt.toDate() : new Date())
      });
    });
    
    // Recent invoices
    invoices.slice(0, 2).forEach(invoice => {
      if (!invoice.id || !invoice.invoiceNumber || !invoice.companyAmount || !invoice.createdAt) return;
      
      activities.push({
        id: `invoice-${invoice.id}`,
        type: invoice.status === 'overdue' ? 'overdue' : 'invoice',
        message: invoice.status === 'overdue' 
          ? `Invoice ${invoice.invoiceNumber} is overdue`
          : `Invoice ${invoice.invoiceNumber} sent to ${invoice.clientName || 'Client'}`,
        amount: formatCurrency(invoice.companyAmount),
        time: formatTimeAgo(invoice.createdAt)
      });
    });
    
    return activities.slice(0, 4);
  };

  const formatTimeAgo = (date: Date) => {
    if (!date) return 'Unknown';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  // Get the data by calling the functions
  const revenueData = getMonthlyRevenue();
  const recentActivities = getRecentActivities();

  // Fix Y-axis formatting for revenue chart
  const formatYAxisTick = (value: number) => {
    const currency = companyData?.companyCurrency || 'USD';
    const symbol = getCurrencySymbol(currency);
    if (value >= 1000000) {
      return `${symbol}${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${symbol}${(value / 1000).toFixed(0)}K`;
    }
    return `${symbol}${value}`;
  };

  if (invoicesLoading || clientsLoading || paymentsLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invoice Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back! Here's your business overview.</p>
          </div>
          <div className="flex gap-3">
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate('/invoices/new')}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Invoice
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowAddClientModal(true)}
            >
              <Users className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInvoices}</div>
              <p className="text-xs text-gray-500">{clients.length} active clients</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Paid Amount</CardTitle>
              <IndianRupee className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalReceived)}</div>
              <p className="text-xs text-gray-500">{paidInvoices.length} invoices paid</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Payments</CardTitle>
              <Calendar className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(pendingAmount)}</div>
              <p className="text-xs text-gray-500">{unpaidInvoices.length} invoices pending</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalOverdueAmount)}</div>
              <p className="text-xs text-gray-500">{overdueInvoices.length} invoices overdue</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Monthly Revenue (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={formatYAxisTick} />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                  <Bar dataKey="revenue" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-green-500" />
                Invoice Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-4">
                {statusData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm text-gray-600">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Clients & Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Clients */}
          <Card>
            <CardHeader>
              <CardTitle>Top Clients by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topClients.map((client, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{client.name}</p>
                        <p className="text-sm text-gray-500">Total Revenue</p>
                      </div>
                    </div>
                    <Badge variant="default">
                      {formatCurrency(client.total)}
                    </Badge>
                  </div>
                ))}
                {topClients.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No client data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'payment' ? 'bg-green-500' :
                        activity.type === 'invoice' ? 'bg-blue-500' : 'bg-red-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-gray-900">{activity.message}</p>
                        <p className="text-sm text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                    <Badge variant={activity.type === 'payment' ? 'default' : activity.type === 'invoice' ? 'secondary' : 'destructive'}>
                      {activity.amount}
                    </Badge>
                  </div>
                ))}
                {recentActivities.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No recent activities</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => navigate('/invoices/new')}
              >
                <Plus className="w-6 h-6 mb-2" />
                Create Invoice
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => navigate('/clients')}
              >
                <Users className="w-6 h-6 mb-2" />
                Manage Clients
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => navigate('/payments')}
              >
                <IndianRupee className="w-6 h-6 mb-2" />
                Record Payment
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => {
                  navigate('/settings');
                  // Scroll to company profile section after navigation
                  setTimeout(() => {
                    const element = document.getElementById('company-profile');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }, 100);
                }}
              >
                <Settings className="w-6 h-6 mb-2" />
                Company Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        <AddClientModal 
          open={showAddClientModal} 
          onOpenChange={setShowAddClientModal} 
        />
      </div>
    </div>
  );
};

export default Dashboard;

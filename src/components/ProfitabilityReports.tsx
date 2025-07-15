
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3,
  PieChart,
  Calendar
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';
import { useInvoices, usePurchases, useClients } from '@/hooks/useFirestore';
import { useCompanyData } from '@/hooks/useCompanyData';

const ProfitabilityReports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedClient, setSelectedClient] = useState('all');
  
  const { invoices } = useInvoices();
  const { purchases } = usePurchases();
  const { clients } = useClients();
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

  // Calculate monthly P&L data using totalAmount for paid invoices vs purchases
  const monthlyPnL = (() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      // Revenue from paid invoices using totalAmount
      const monthRevenue = invoices
        .filter(invoice => {
          if (invoice.status !== 'paid') return false;
          const invoiceDate = invoice.issueDate || invoice.createdAt;
          if (!invoiceDate) return false;
          const date = new Date(invoiceDate);
          return date.getMonth() === index && date.getFullYear() === currentYear;
        })
        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

      // Purchases for the month
      const monthPurchases = purchases
        .filter(purchase => {
          const purchaseDate = new Date(purchase.purchaseDate);
          return purchaseDate.getMonth() === index && purchaseDate.getFullYear() === currentYear;
        })
        .reduce((sum, purchase) => sum + purchase.totalAmount, 0);

      const profit = monthRevenue - monthPurchases;
      const margin = monthRevenue > 0 ? (profit / monthRevenue) * 100 : 0;

      return {
        month,
        revenue: monthRevenue,
        purchases: monthPurchases,
        profit,
        margin
      };
    });
  })();

  // Calculate client profitability using totalAmount for paid invoices vs related purchases
  const clientProfitability = (() => {
    const clientMap = new Map();
    
    clients.forEach(client => {
      const clientInvoices = invoices.filter(inv => inv.clientId === client.id && inv.status === 'paid');
      const clientPurchases = purchases.filter(purchase => purchase.clientId === client.id);
      
      const revenue = clientInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
      const purchaseAmount = clientPurchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);
      const profit = revenue - purchaseAmount;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
      
      if (revenue > 0 || purchaseAmount > 0) {
        clientMap.set(client.id, {
          name: client.name,
          revenue,
          purchases: purchaseAmount,
          profit,
          margin,
          invoiceCount: clientInvoices.length
        });
      }
    });
    
    return Array.from(clientMap.values()).sort((a, b) => b.profit - a.profit);
  })();

  // Calculate purchase breakdown by supplier
  const purchaseBreakdown = (() => {
    const supplierMap = new Map();
    
    purchases.forEach(purchase => {
      const current = supplierMap.get(purchase.supplier || 'Unknown') || 0;
      supplierMap.set(purchase.supplier || 'Unknown', current + purchase.totalAmount);
    });
    
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
    
    return Array.from(supplierMap.entries()).map(([supplier, amount], index) => ({
      supplier,
      amount,
      color: colors[index % colors.length]
    }));
  })();

  // Calculate totals using totalAmount for paid invoices
  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  
  const totalPurchases = purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);
  const totalProfit = totalRevenue - totalPurchases;
  const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Current month data
  const currentMonth = new Date().getMonth();
  const currentMonthData = monthlyPnL[currentMonth];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Profit & Loss Analysis</h1>
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
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue from Paid Invoices</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">From paid invoices only</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalPurchases)}</div>
            <p className="text-xs text-muted-foreground">All purchase orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit/Loss</CardTitle>
            <DollarSign className={`h-4 w-4 ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalProfit)}
            </div>
            <p className="text-xs text-muted-foreground">Revenue - Purchases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <BarChart3 className={`h-4 w-4 ${overallMargin >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overallMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {overallMargin.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Overall margin</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monthly" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="monthly">Monthly P&L</TabsTrigger>
          <TabsTrigger value="clients">Client Profitability</TabsTrigger>
          <TabsTrigger value="purchases">Purchase Analysis</TabsTrigger>
        </TabsList>

        {/* Monthly P&L */}
        <TabsContent value="monthly" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  Monthly Revenue vs Purchases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyPnL}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${getCurrencySymbol(companyData?.companyCurrency || 'USD')}${(value / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
                    <Bar dataKey="revenue" fill="#10B981" name="Revenue" />
                    <Bar dataKey="purchases" fill="#EF4444" name="Purchases" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Monthly Profit/Loss Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyPnL}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${getCurrencySymbol(companyData?.companyCurrency || 'USD')}${(value / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Profit/Loss']} />
                    <Line 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Current Month Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-500" />
                Current Month Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600">Revenue (Paid)</div>
                  <div className="text-xl font-bold text-green-700">
                    {formatCurrency(currentMonthData.revenue)}
                  </div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="text-sm text-red-600">Purchases</div>
                  <div className="text-xl font-bold text-red-700">
                    {formatCurrency(currentMonthData.purchases)}
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${currentMonthData.profit >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
                  <div className={`text-sm ${currentMonthData.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    Profit/Loss
                  </div>
                  <div className={`text-xl font-bold ${currentMonthData.profit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                    {formatCurrency(currentMonthData.profit)}
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${currentMonthData.margin >= 0 ? 'bg-purple-50' : 'bg-red-50'}`}>
                  <div className={`text-sm ${currentMonthData.margin >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                    Margin
                  </div>
                  <div className={`text-xl font-bold ${currentMonthData.margin >= 0 ? 'text-purple-700' : 'text-red-700'}`}>
                    {currentMonthData.margin.toFixed(1)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Client Profitability */}
        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle>Client Profitability Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {clientProfitability.length > 0 ? (
                <div className="space-y-4">
                  {clientProfitability.map((client, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium text-lg">{client.name}</div>
                        <div className={`text-lg font-bold ${client.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(client.profit)}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Revenue (Paid):</span>
                          <div className="font-medium text-green-600">{formatCurrency(client.revenue)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Purchases:</span>
                          <div className="font-medium text-red-600">{formatCurrency(client.purchases)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Margin:</span>
                          <div className={`font-medium ${client.margin >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {client.margin.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Paid Invoices:</span>
                          <div className="font-medium">{client.invoiceCount}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No client profitability data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchase Analysis */}
        <TabsContent value="purchases">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-orange-500" />
                  Purchase by Supplier
                </CardTitle>
              </CardHeader>
              <CardContent>
                {purchaseBreakdown.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={purchaseBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="amount"
                        >
                          {purchaseBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Amount']} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-2 mt-4">
                      {purchaseBreakdown.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="text-sm">{item.supplier}</span>
                          </div>
                          <div className="text-sm font-medium">
                            {formatCurrency(item.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No purchase data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Purchase Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {purchaseBreakdown.map((item, index) => {
                    const percentage = totalPurchases > 0 ? (item.amount / totalPurchases) * 100 : 0;
                    
                    return (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{item.supplier}</span>
                          <span className="text-lg font-bold">{formatCurrency(item.amount)}</span>
                        </div>
                        <div className="text-sm text-gray-500 mb-2">{percentage.toFixed(1)}% of total purchases</div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
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

export default ProfitabilityReports;

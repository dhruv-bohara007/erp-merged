
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
import { useInvoices, useExpenses, useClients } from '@/hooks/useFirestore';
import { useCompanyData } from '@/hooks/useCompanyData';

const ProfitabilityReports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedClient, setSelectedClient] = useState('all');
  
  const { invoices } = useInvoices();
  const { expenses } = useExpenses();
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

  // Calculate monthly P&L data using totalAmountINR consistently
  const monthlyPnL = (() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      // Revenue from paid invoices using totalAmountINR
      const monthRevenue = invoices
        .filter(invoice => {
          if (invoice.status !== 'paid') return false;
          const invoiceDate = invoice.issueDate || invoice.createdAt;
          if (!invoiceDate) return false;
          const date = new Date(invoiceDate);
          return date.getMonth() === index && date.getFullYear() === currentYear;
        })
        .reduce((sum, inv) => sum + (inv.totalAmountINR || inv.totalAmount || 0), 0);

      // Expenses for the month
      const monthExpenses = expenses
        .filter(expense => {
          const expenseDate = new Date(expense.expenseDate);
          return expenseDate.getMonth() === index && expenseDate.getFullYear() === currentYear;
        })
        .reduce((sum, exp) => sum + exp.amount, 0);

      const profit = monthRevenue - monthExpenses;
      const margin = monthRevenue > 0 ? (profit / monthRevenue) * 100 : 0;

      return {
        month,
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit,
        margin
      };
    });
  })();

  // Calculate client profitability using totalAmountINR consistently
  const clientProfitability = (() => {
    const clientMap = new Map();
    
    clients.forEach(client => {
      const clientInvoices = invoices.filter(inv => inv.clientId === client.id && inv.status === 'paid');
      const clientExpenses = expenses.filter(exp => exp.clientId === client.id);
      
      const revenue = clientInvoices.reduce((sum, inv) => sum + (inv.totalAmountINR || inv.totalAmount || 0), 0);
      const expenseAmount = clientExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const profit = revenue - expenseAmount;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
      
      if (revenue > 0 || expenseAmount > 0) {
        clientMap.set(client.id, {
          name: client.name,
          revenue,
          expenses: expenseAmount,
          profit,
          margin,
          invoiceCount: clientInvoices.length
        });
      }
    });
    
    return Array.from(clientMap.values()).sort((a, b) => b.profit - a.profit);
  })();

  // Calculate expense breakdown
  const expenseBreakdown = (() => {
    const categoryMap = new Map();
    
    expenses.forEach(expense => {
      const current = categoryMap.get(expense.category) || 0;
      categoryMap.set(expense.category, current + expense.amount);
    });
    
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
    
    return Array.from(categoryMap.entries()).map(([category, amount], index) => ({
      category,
      amount,
      color: colors[index % colors.length]
    }));
  })();

  // Calculate totals using totalAmountINR consistently
  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.totalAmountINR || inv.totalAmount || 0), 0);
  
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalProfit = totalRevenue - totalExpenses;
  const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Current month data
  const currentMonth = new Date().getMonth();
  const currentMonthData = monthlyPnL[currentMonth];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Profitability Reports</h1>
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
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">From paid invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">All recorded expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className={`h-4 w-4 ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalProfit)}
            </div>
            <p className="text-xs text-muted-foreground">Revenue - Expenses</p>
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
          <TabsTrigger value="expenses">Expense Analysis</TabsTrigger>
        </TabsList>

        {/* Monthly P&L */}
        <TabsContent value="monthly" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  Monthly Revenue vs Expenses
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
                    <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Monthly Profit Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyPnL}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${getCurrencySymbol(companyData?.companyCurrency || 'USD')}${(value / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Profit']} />
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
                  <div className="text-sm text-green-600">Revenue</div>
                  <div className="text-xl font-bold text-green-700">
                    {formatCurrency(currentMonthData.revenue)}
                  </div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="text-sm text-red-600">Expenses</div>
                  <div className="text-xl font-bold text-red-700">
                    {formatCurrency(currentMonthData.expenses)}
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${currentMonthData.profit >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
                  <div className={`text-sm ${currentMonthData.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    Profit
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
                          <span className="text-gray-500">Revenue:</span>
                          <div className="font-medium text-green-600">{formatCurrency(client.revenue)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Expenses:</span>
                          <div className="font-medium text-red-600">{formatCurrency(client.expenses)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Margin:</span>
                          <div className={`font-medium ${client.margin >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {client.margin.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Invoices:</span>
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

        {/* Expense Analysis */}
        <TabsContent value="expenses">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-orange-500" />
                  Expense Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expenseBreakdown.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={expenseBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="amount"
                        >
                          {expenseBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Amount']} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-2 mt-4">
                      {expenseBreakdown.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="text-sm">{item.category}</span>
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
                    No expense data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expenseBreakdown.map((item, index) => {
                    const percentage = totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0;
                    
                    return (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{item.category}</span>
                          <span className="text-lg font-bold">{formatCurrency(item.amount)}</span>
                        </div>
                        <div className="text-sm text-gray-500 mb-2">{percentage.toFixed(1)}% of total expenses</div>
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

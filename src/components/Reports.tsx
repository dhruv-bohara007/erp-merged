
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Calendar, 
  DollarSign,
  TrendingUp,
  Users,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedYear, setSelectedYear] = useState('2024');

  // Sample data for reports
  const monthlyRevenue = [
    { month: 'Jan', revenue: 45000, invoices: 25, paid: 22, unpaid: 3 },
    { month: 'Feb', revenue: 52000, invoices: 30, paid: 28, unpaid: 2 },
    { month: 'Mar', revenue: 48000, invoices: 28, paid: 25, unpaid: 3 },
    { month: 'Apr', revenue: 61000, invoices: 35, paid: 32, unpaid: 3 },
    { month: 'May', revenue: 55000, invoices: 32, paid: 30, unpaid: 2 },
    { month: 'Jun', revenue: 67000, invoices: 38, paid: 36, unpaid: 2 },
  ];

  const clientReports = [
    { name: 'ABC Corporation', revenue: 12500, invoices: 8, avgPaymentDays: 15 },
    { name: 'XYZ Ltd', revenue: 9800, invoices: 6, avgPaymentDays: 22 },
    { name: 'DEF Inc', revenue: 15200, invoices: 10, avgPaymentDays: 12 },
    { name: 'GHI Corp', revenue: 7300, invoices: 5, avgPaymentDays: 28 },
    { name: 'JKL Ltd', revenue: 8900, invoices: 7, avgPaymentDays: 18 },
  ];

  const agingReport = [
    { range: 'Current (0-30 days)', amount: 25000, count: 15, color: '#10B981' },
    { range: '31-60 days', amount: 12000, count: 8, color: '#F59E0B' },
    { range: '61-90 days', amount: 8500, count: 5, color: '#EF4444' },
    { range: '90+ days', amount: 3200, count: 3, color: '#DC2626' },
  ];

  const taxSummary = [
    { type: 'GST Collected', amount: 8500, rate: '18%' },
    { type: 'TDS Deducted', amount: 2100, rate: '10%' },
    { type: 'Service Tax', amount: 1200, rate: '12%' },
  ];

  const totalRevenue = monthlyRevenue.reduce((sum, month) => sum + month.revenue, 0);
  const totalInvoices = monthlyRevenue.reduce((sum, month) => sum + month.invoices, 0);
  const averageInvoiceValue = totalRevenue / totalInvoices;

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
                <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600">+12% from last period</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-blue-600" />
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
                <p className="text-xs text-green-600">+8% from last period</p>
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
                <p className="text-2xl font-bold">${averageInvoiceValue.toFixed(0)}</p>
                <p className="text-xs text-yellow-600">+3% from last period</p>
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
                <p className="text-2xl font-bold">{clientReports.length}</p>
                <p className="text-xs text-blue-600">+2 new this month</p>
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
          <TabsTrigger value="tax">Tax Summary</TabsTrigger>
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
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
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
                      <div className="font-bold text-lg">${client.revenue.toLocaleString()}</div>
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
                    <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 mt-4">
                  {agingReport.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm">{item.range}</span>
                      </div>
                      <div className="text-sm font-medium">${item.amount.toLocaleString()} ({item.count})</div>
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
                        <span className="text-lg font-bold">${item.amount.toLocaleString()}</span>
                      </div>
                      <div className="text-sm text-gray-500">{item.count} invoices</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="h-2 rounded-full" 
                          style={{ 
                            width: `${(item.amount / 48700) * 100}%`,
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

        {/* Tax Summary */}
        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-500" />
                Tax Summary Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {taxSummary.map((tax, index) => (
                  <div key={index} className="p-6 border rounded-lg">
                    <div className="text-sm text-gray-600">{tax.type}</div>
                    <div className="text-2xl font-bold mt-1">${tax.amount.toLocaleString()}</div>
                    <div className="text-sm text-blue-600 mt-1">Rate: {tax.rate}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Tax Liability</span>
                  <span className="text-xl font-bold">
                    ${taxSummary.reduce((sum, tax) => sum + tax.amount, 0).toLocaleString()}
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

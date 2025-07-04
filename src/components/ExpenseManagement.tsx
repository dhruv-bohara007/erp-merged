
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Filter, Edit, Trash2, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import SampleDataToggle from '@/components/SampleDataToggle';
import { useSampleData } from '@/contexts/SampleDataContext';

const ExpenseManagement = () => {
  const { showSampleData } = useSampleData();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Sample data for when toggle is enabled
  const sampleExpenses = [
    {
      id: 'EXP-001',
      description: 'Office Rent',
      amount: 2500,
      category: 'Office',
      date: '2024-01-01',
      status: 'approved',
      receipt: true
    },
    {
      id: 'EXP-002',
      description: 'Software Licenses',
      amount: 800,
      category: 'Software',
      date: '2024-01-05',
      status: 'pending',
      receipt: true
    },
    {
      id: 'EXP-003',
      description: 'Marketing Campaign',
      amount: 1200,
      category: 'Marketing',
      date: '2024-01-10',
      status: 'approved',
      receipt: false
    },
    {
      id: 'EXP-004',
      description: 'Business Travel',
      amount: 650,
      category: 'Travel',
      date: '2024-01-15',
      status: 'approved',
      receipt: true
    },
    {
      id: 'EXP-005',
      description: 'Office Supplies',
      amount: 300,
      category: 'Office',
      date: '2024-01-20',
      status: 'pending',
      receipt: false
    }
  ];

  const sampleExpenseStats = [
    { month: 'Jan', amount: 5450 },
    { month: 'Feb', amount: 4200 },
    { month: 'Mar', amount: 6800 },
    { month: 'Apr', amount: 3900 },
    { month: 'May', amount: 5200 },
    { month: 'Jun', amount: 4600 }
  ];

  const sampleCategoryData = [
    { name: 'Office', value: 2800, color: '#3b82f6' },
    { name: 'Software', value: 800, color: '#10b981' },
    { name: 'Marketing', value: 1200, color: '#f59e0b' },
    { name: 'Travel', value: 650, color: '#ef4444' }
  ];

  const sampleSummary = {
    totalExpenses: 30150,
    monthlyAverage: 5025,
    pendingExpenses: 1100,
    approvedExpenses: 4350
  };

  // Real data would come from your hooks here
  const expenses = showSampleData ? sampleExpenses : [];
  const expenseStats = showSampleData ? sampleExpenseStats : [];
  const categoryData = showSampleData ? sampleCategoryData : [];
  const summary = showSampleData ? sampleSummary : {
    totalExpenses: 0,
    monthlyAverage: 0,
    pendingExpenses: 0,
    approvedExpenses: 0
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Expense Management</h1>
        <p className="text-gray-600">Track and manage business expenses</p>
      </div>

      <SampleDataToggle />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All time expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Average</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.monthlyAverage.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Average monthly spend
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.pendingExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.approvedExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Current month approved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Expenses</CardTitle>
            <CardDescription>Expense trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expenseStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                <Bar dataKey="amount" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
            <CardDescription>Breakdown by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Expense Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Expenses</CardTitle>
              <CardDescription>Manage and track your business expenses</CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Office">Office</SelectItem>
                <SelectItem value="Software">Software</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Travel">Travel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      {showSampleData ? 'No expenses match your search criteria' : 'No expenses found. Add your first expense to get started.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.id}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>${expense.amount.toLocaleString()}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>{expense.date}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(expense.status)}>
                          {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={expense.receipt ? 'default' : 'secondary'}>
                          {expense.receipt ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
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

export default ExpenseManagement;


import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Filter, Edit, Eye } from 'lucide-react';
import SampleDataToggle from '@/components/SampleDataToggle';
import { useSampleData } from '@/contexts/SampleDataContext';

const InvoiceList = () => {
  const navigate = useNavigate();
  const { showSampleData } = useSampleData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Sample data for when toggle is enabled
  const sampleInvoices = [
    {
      id: 'INV-001',
      client: 'Acme Corp',
      amount: 2500,
      status: 'paid',
      dueDate: '2024-01-15',
      issueDate: '2024-01-01'
    },
    {
      id: 'INV-002',
      client: 'TechStart Inc',
      amount: 1800,
      status: 'pending',
      dueDate: '2024-01-20',
      issueDate: '2024-01-05'
    },
    {
      id: 'INV-003',
      client: 'Global Solutions',
      amount: 3200,
      status: 'overdue',
      dueDate: '2024-01-10',
      issueDate: '2023-12-20'
    },
    {
      id: 'INV-004',
      client: 'Innovation Labs',
      amount: 4500,
      status: 'paid',
      dueDate: '2024-01-25',
      issueDate: '2024-01-10'
    },
    {
      id: 'INV-005',
      client: 'Digital Dynamics',
      amount: 2100,
      status: 'pending',
      dueDate: '2024-01-30',
      issueDate: '2024-01-15'
    }
  ];

  // Real data would come from your hooks here
  const invoices = showSampleData ? sampleInvoices : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
        <p className="text-gray-600">Manage your invoices and track payments</p>
      </div>

      <SampleDataToggle />

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Invoice Management</CardTitle>
              <CardDescription>Create, edit, and track your invoices</CardDescription>
            </div>
            <Button onClick={() => navigate('/invoices/new')}>
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search invoices..."
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
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invoice Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {showSampleData ? 'No invoices match your search criteria' : 'No invoices found. Create your first invoice to get started.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.id}</TableCell>
                      <TableCell>{invoice.client}</TableCell>
                      <TableCell>${invoice.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{invoice.issueDate}</TableCell>
                      <TableCell>{invoice.dueDate}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => navigate(`/invoices/edit/${invoice.id}`)}>
                            <Edit className="h-4 w-4" />
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

export default InvoiceList;

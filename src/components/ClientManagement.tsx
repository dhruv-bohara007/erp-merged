
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Mail, Phone } from 'lucide-react';
import SampleDataToggle from '@/components/SampleDataToggle';
import { useSampleData } from '@/contexts/SampleDataContext';

const ClientManagement = () => {
  const { showSampleData } = useSampleData();
  const [searchTerm, setSearchTerm] = useState('');

  // Sample data for when toggle is enabled
  const sampleClients = [
    {
      id: '1',
      name: 'Acme Corporation',
      email: 'contact@acmecorp.com',
      phone: '+1 (555) 123-4567',
      status: 'active',
      totalInvoices: 12,
      totalRevenue: 45000
    },
    {
      id: '2',
      name: 'TechStart Inc',
      email: 'hello@techstart.com',
      phone: '+1 (555) 234-5678',
      status: 'active',
      totalInvoices: 8,
      totalRevenue: 28000
    },
    {
      id: '3',
      name: 'Global Solutions',
      email: 'info@globalsolutions.com',
      phone: '+1 (555) 345-6789',
      status: 'inactive',
      totalInvoices: 5,
      totalRevenue: 15000
    },
    {
      id: '4',
      name: 'Innovation Labs',
      email: 'team@innovationlabs.com',
      phone: '+1 (555) 456-7890',
      status: 'active',
      totalInvoices: 15,
      totalRevenue: 67500
    },
    {
      id: '5',
      name: 'Digital Dynamics',
      email: 'support@digitaldynamics.com',
      phone: '+1 (555) 567-8901',
      status: 'active',
      totalInvoices: 6,
      totalRevenue: 22000
    }
  ];

  // Real data would come from your hooks here
  const clients = showSampleData ? sampleClients : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
        <p className="text-gray-600">Manage your clients and their information</p>
      </div>

      <SampleDataToggle />

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Clients</CardTitle>
              <CardDescription>View and manage your client database</CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Client Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Invoices</TableHead>
                  <TableHead>Total Revenue</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      {showSampleData ? 'No clients match your search criteria' : 'No clients found. Add your first client to get started.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="mr-2 h-3 w-3 text-gray-400" />
                            {client.email}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="mr-2 h-3 w-3 text-gray-400" />
                            {client.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(client.status)}>
                          {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{client.totalInvoices}</TableCell>
                      <TableCell>${client.totalRevenue.toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
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

export default ClientManagement;

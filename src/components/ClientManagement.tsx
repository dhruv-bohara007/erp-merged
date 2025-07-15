import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin,
  IndianRupee,
  FileText,
  Globe
} from 'lucide-react';
import { useClients, useInvoices } from '@/hooks/useFirestore';
import { useToast } from '@/hooks/use-toast';
import { useCompanyData } from '@/hooks/useCompanyData';
import { getCurrencyByCountry } from '@/data/countryCurrencyMapping';
import EditClientModal from './EditClientModal';
import AddClientModal from './AddClientModal';
import { countries } from '@/data/countries';
import { countriesWithTaxInfo } from '@/data/countriesWithTax';
import type { Client } from '@/hooks/useFirestore';

const ClientManagement = () => {
  const { clients, loading, error, addClient, updateClient, deleteClient } = useClients();
  const { invoices } = useInvoices();
  const { companyData } = useCompanyData();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'IN',
    taxInfo: {
      id: '',
      type: 'GSTIN'
    },
    status: 'active' as const
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.gstin && client.gstin.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.taxInfo?.id && client.taxInfo.id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddClient = async () => {
    try {
      const clientData = {
        ...newClient,
        // Keep backward compatibility for GSTIN field
        gstin: newClient.country === 'IN' ? newClient.taxInfo.id : ''
      };
      
      await addClient(clientData);
      setNewClient({ 
        name: '', 
        email: '', 
        phone: '', 
        address: '', 
        city: '', 
        state: '', 
        pincode: '', 
        country: 'IN',
        taxInfo: {
          id: '',
          type: 'GSTIN'
        },
        status: 'active' 
      });
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Client added successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add client",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      await deleteClient(id);
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
    }
  };

  // Get company currency info
  const companyCurrency = companyData?.country ? getCurrencyByCountry(companyData.country) : { code: 'USD', symbol: '$', name: 'US Dollar' };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: companyCurrency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsEditModalOpen(true);
  };

  const getCountryName = (countryCode: string) => {
    const country = countries.find(c => c.value === countryCode);
    return country ? country.label : countryCode;
  };

  const getTaxLabel = (client: Client) => {
    if (client.taxInfo?.type) {
      return client.taxInfo.type;
    }
    // Fallback for older records
    if (client.country === 'IN' || !client.country) {
      return 'GSTIN';
    }
    const countryInfo = countriesWithTaxInfo.find(c => c.value === client.country);
    return countryInfo?.primaryTaxLabel || 'Tax ID';
  };

  const getTaxId = (client: Client) => {
    if (client.taxInfo?.id) {
      return client.taxInfo.id;
    }
    // Fallback for older records
    return client.gstin || 'N/A';
  };

  // Calculate client-specific metrics from invoices
  const getClientMetrics = (clientId: string) => {
    const clientInvoices = invoices.filter(invoice => invoice.clientId === clientId);
    const totalAmount = clientInvoices.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);
    const outstandingAmount = clientInvoices
      .filter(invoice => invoice.status === 'sent' || invoice.status === 'draft' || invoice.status === 'overdue')
      .reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);
    
    return {
      invoiceCount: clientInvoices.length,
      totalAmount,
      outstandingAmount
    };
  };

  // Calculate dynamic metrics from Firestore data
  const calculateClientMetrics = () => {
    const totalRevenue = invoices
      .reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);

    const outstandingAmount = invoices
      .filter(invoice => invoice.status === 'sent' || invoice.status === 'draft' || invoice.status === 'overdue')
      .reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);

    return { totalRevenue, outstandingAmount };
  };

  const { totalRevenue, outstandingAmount } = calculateClientMetrics();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center">Loading clients...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Client Management</h1>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Client
        </Button>
      </div>

      {/* Summary Cards with Company Currency */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold">{clients.length}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Clients</p>
                <p className="text-2xl font-bold">{clients.filter(c => c.status === 'active').length}</p>
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
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">{companyCurrency.symbol}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold">{formatCurrency(outstandingAmount)}</p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-bold text-sm">{companyCurrency.symbol}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Client List</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search clients, tax ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Invoices</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => {
                const clientMetrics = getClientMetrics(client.id);
                return (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          {client.address.substring(0, 30)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="w-3 h-3 mr-2 text-gray-400" />
                          {client.email}
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="w-3 h-3 mr-2 text-gray-400" />
                          {client.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium">{clientMetrics.invoiceCount}</div>
                        <div className="text-xs text-gray-500">invoices</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatCurrency(clientMetrics.totalAmount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-orange-600">
                        {formatCurrency(clientMetrics.outstandingAmount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditClient(client)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteClient(client.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Client Modal */}
      <AddClientModal 
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />

      {/* Edit Client Modal */}
      <EditClientModal 
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        client={editingClient}
      />
    </div>
  );
};

export default ClientManagement;

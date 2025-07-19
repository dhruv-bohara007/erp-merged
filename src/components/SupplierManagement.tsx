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
  Globe,
  TrendingUp,
  Package
} from 'lucide-react';
import { useSuppliers, usePurchases } from '@/hooks/useFirestore';
import { useToast } from '@/hooks/use-toast';
import { useCompanyData } from '@/hooks/useCompanyData';
import { getCurrencyByCountry } from '@/data/countryCurrencyMapping';
import { countries } from '@/data/countries';
import { countriesWithTaxInfo } from '@/data/countriesWithTax';
import type { Supplier } from '@/types/firestore';

const SupplierManagement = () => {
  const { suppliers, loading, error, addSupplier, updateSupplier, deleteSupplier } = useSuppliers();
  const { purchases } = usePurchases();
  const { companyData } = useCompanyData();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [newSupplier, setNewSupplier] = useState({
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
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Get company currency
  const companyCurrency = companyData?.companyCurrency || 'USD';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: companyCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Filter suppliers based on search
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.phone.includes(searchTerm)
  );

  // Calculate supplier stats
  const supplierStats = suppliers.map(supplier => {
    const supplierPurchases = purchases.filter(purchase => purchase.supplierName === supplier.name);
    const totalPurchases = supplierPurchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0);
    const activePurchases = supplierPurchases.filter(purchase => purchase.purchaseStatus === 'completed').length;
    const pendingPurchases = supplierPurchases.filter(purchase => purchase.purchaseStatus === 'pending').length;
    
    return {
      ...supplier,
      totalPurchases,
      activePurchases,
      pendingPurchases,
      averageOrderValue: supplierPurchases.length > 0 ? totalPurchases / supplierPurchases.length : 0
    };
  });

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addSupplier(newSupplier);
      setNewSupplier({
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
      setIsAddModalOpen(false);
      toast({ title: 'Supplier added successfully!' });
    } catch (error) {
      toast({ 
        title: 'Error adding supplier', 
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;
    
    try {
      await updateSupplier(editingSupplier.id, editingSupplier);
      setEditingSupplier(null);
      setIsEditModalOpen(false);
      toast({ title: 'Supplier updated successfully!' });
    } catch (error) {
      toast({ 
        title: 'Error updating supplier', 
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await deleteSupplier(supplierId);
        toast({ title: 'Supplier deleted successfully!' });
      } catch (error) {
        toast({ 
          title: 'Error deleting supplier', 
          description: error instanceof Error ? error.message : 'Please try again',
          variant: 'destructive'
        });
      }
    }
  };

  const getTaxLabel = (country: string) => {
    const countryInfo = countriesWithTaxInfo.find(c => c.value === country);
    return countryInfo?.label || 'Tax ID';
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading suppliers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Error loading suppliers: {error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Supplier Management</h1>
          <p className="text-gray-600 mt-2">Manage your suppliers and track purchase relationships</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSupplier} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Supplier Name*</Label>
                  <Input
                    id="name"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email*</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone*</Label>
                  <Input
                    id="phone"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country*</Label>
                  <Select 
                    value={newSupplier.country} 
                    onValueChange={(value) => setNewSupplier({...newSupplier, country: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(country => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="city">City*</Label>
                  <Input
                    id="city"
                    value={newSupplier.city}
                    onChange={(e) => setNewSupplier({...newSupplier, city: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State*</Label>
                  <Input
                    id="state"
                    value={newSupplier.state}
                    onChange={(e) => setNewSupplier({...newSupplier, state: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="pincode">Pincode*</Label>
                  <Input
                    id="pincode"
                    value={newSupplier.pincode}
                    onChange={(e) => setNewSupplier({...newSupplier, pincode: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="taxId">{getTaxLabel(newSupplier.country)}</Label>
                  <Input
                    id="taxId"
                    value={newSupplier.taxInfo.id}
                    onChange={(e) => setNewSupplier({
                      ...newSupplier,
                      taxInfo: { ...newSupplier.taxInfo, id: e.target.value }
                    })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address*</Label>
                <Textarea
                  id="address"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Supplier</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search suppliers by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Suppliers ({filteredSuppliers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Tax ID</TableHead>
                  <TableHead>Total Orders</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map(supplier => {
                  const stats = supplierStats.find(s => s.id === supplier.id);
                  return (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <div className="font-medium">{supplier.name}</div>
                        <div className="text-sm text-gray-500">{supplier.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4" />
                          {supplier.phone}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Mail className="w-4 h-4" />
                          {supplier.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4" />
                          {supplier.city}, {supplier.state}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Globe className="w-4 h-4" />
                          {countries.find(c => c.value === supplier.country)?.label}
                        </div>
                      </TableCell>
                      <TableCell>
                        {supplier.taxInfo?.id ? (
                          <div className="text-sm">
                            <span className="font-medium">{supplier.taxInfo.type}:</span>
                            <br />
                            {supplier.taxInfo.id}
                          </div>
                        ) : (
                          <span className="text-gray-400">Not provided</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{stats?.activePurchases || 0}</div>
                        <div className="text-xs text-gray-500">
                          {stats?.pendingPurchases || 0} pending
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {formatCurrency(stats?.totalPurchases || 0)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Avg: {formatCurrency(stats?.averageOrderValue || 0)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                          {supplier.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingSupplier(supplier);
                              setIsEditModalOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSupplier(supplier.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {filteredSuppliers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No suppliers found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingSupplier && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Supplier</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateSupplier} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Supplier Name*</Label>
                  <Input
                    id="edit-name"
                    value={editingSupplier.name}
                    onChange={(e) => setEditingSupplier({...editingSupplier, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email*</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingSupplier.email}
                    onChange={(e) => setEditingSupplier({...editingSupplier, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phone">Phone*</Label>
                  <Input
                    id="edit-phone"
                    value={editingSupplier.phone}
                    onChange={(e) => setEditingSupplier({...editingSupplier, phone: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-country">Country*</Label>
                  <Select 
                    value={editingSupplier.country} 
                    onValueChange={(value) => setEditingSupplier({...editingSupplier, country: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(country => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-city">City*</Label>
                  <Input
                    id="edit-city"
                    value={editingSupplier.city}
                    onChange={(e) => setEditingSupplier({...editingSupplier, city: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-state">State*</Label>
                  <Input
                    id="edit-state"
                    value={editingSupplier.state}
                    onChange={(e) => setEditingSupplier({...editingSupplier, state: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-pincode">Pincode*</Label>
                  <Input
                    id="edit-pincode"
                    value={editingSupplier.pincode}
                    onChange={(e) => setEditingSupplier({...editingSupplier, pincode: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-taxId">{getTaxLabel(editingSupplier.country)}</Label>
                  <Input
                    id="edit-taxId"
                    value={editingSupplier.taxInfo?.id || ''}
                    onChange={(e) => setEditingSupplier({
                      ...editingSupplier,
                      taxInfo: { ...editingSupplier.taxInfo, id: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select 
                    value={editingSupplier.status} 
                    onValueChange={(value: 'active' | 'inactive') => setEditingSupplier({...editingSupplier, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-address">Address*</Label>
                <Textarea
                  id="edit-address"
                  value={editingSupplier.address}
                  onChange={(e) => setEditingSupplier({...editingSupplier, address: e.target.value})}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Supplier</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default SupplierManagement;
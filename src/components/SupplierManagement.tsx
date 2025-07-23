import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Package,
  Users,
  ShoppingCart,
  DollarSign,
  Activity
} from 'lucide-react';
import { useSuppliers, usePurchases } from '@/hooks/useFirestore';
import { useToast } from '@/hooks/use-toast';
import { useCompanyData } from '@/hooks/useCompanyData';
import { getCurrencyByCountry } from '@/data/countryCurrencyMapping';
import { countries } from '@/data/countries';
import { countriesWithTaxInfo } from '@/data/countriesWithTax';
import { countryPhoneCodes } from '@/data/countryPhoneCodes';
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

  // Calculate summary data
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.status === 'active').length;
  const totalPurchaseValue = supplierStats.reduce((sum, supplier) => sum + supplier.totalPurchases, 0);
  const totalOrders = supplierStats.reduce((sum, supplier) => sum + supplier.activePurchases, 0);

  // Get phone code for country
  const getPhoneCodeForCountry = (countryCode: string) => {
    const phoneData = Object.entries(countryPhoneCodes).find(([code, data]) => code === countryCode);
    return phoneData ? phoneData[1].code : '+1';
  };

  // Get tax label for country
  const getTaxLabel = (country: string) => {
    const countryInfo = countriesWithTaxInfo.find(c => c.value === country);
    return countryInfo?.primaryTaxLabel || 'Tax ID';
  };

  // Generate address from city, state, and country
  const generateAddress = (city: string, state: string, country: string, pincode: string) => {
    const countryName = countries.find(c => c.value === country)?.label || country;
    return `${city}, ${state} ${pincode}, ${countryName}`;
  };

  // Handle country change for new supplier
  const handleNewSupplierCountryChange = (countryCode: string) => {
    const updatedSupplier = {
      ...newSupplier,
      country: countryCode,
      phone: '' // Clear phone when country changes
    };
    updatedSupplier.address = generateAddress(updatedSupplier.city, updatedSupplier.state, countryCode, updatedSupplier.pincode);
    setNewSupplier(updatedSupplier);
  };

  // Handle country change for editing supplier
  const handleEditSupplierCountryChange = (countryCode: string) => {
    if (!editingSupplier) return;
    const updatedSupplier = {
      ...editingSupplier,
      country: countryCode,
      phone: '' // Clear phone when country changes
    };
    updatedSupplier.address = generateAddress(updatedSupplier.city, updatedSupplier.state, countryCode, updatedSupplier.pincode);
    setEditingSupplier(updatedSupplier);
  };

  // Handle field changes that affect address
  const handleNewSupplierFieldChange = (field: string, value: string) => {
    const updatedSupplier = { ...newSupplier, [field]: value };
    if (['city', 'state', 'pincode'].includes(field)) {
      updatedSupplier.address = generateAddress(updatedSupplier.city, updatedSupplier.state, updatedSupplier.country, updatedSupplier.pincode);
    }
    setNewSupplier(updatedSupplier);
  };

  const handleEditSupplierFieldChange = (field: string, value: string) => {
    if (!editingSupplier) return;
    const updatedSupplier = { ...editingSupplier, [field]: value };
    if (['city', 'state', 'pincode'].includes(field)) {
      updatedSupplier.address = generateAddress(updatedSupplier.city, updatedSupplier.state, updatedSupplier.country, updatedSupplier.pincode);
    }
    setEditingSupplier(updatedSupplier);
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const phoneCode = getPhoneCodeForCountry(newSupplier.country);
      const supplierToAdd = {
        ...newSupplier,
        phone: phoneCode + newSupplier.phone, // Combine country code with phone number
        address: generateAddress(newSupplier.city, newSupplier.state, newSupplier.country, newSupplier.pincode)
      };
      await addSupplier(supplierToAdd);
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
      const phoneCode = getPhoneCodeForCountry(editingSupplier.country);
      const supplierToUpdate = {
        ...editingSupplier,
        phone: phoneCode + editingSupplier.phone, // Combine country code with phone number
        address: generateAddress(editingSupplier.city, editingSupplier.state, editingSupplier.country, editingSupplier.pincode)
      };
      await updateSupplier(editingSupplier.id, supplierToUpdate);
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
                    onChange={(e) => handleNewSupplierFieldChange('name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email*</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => handleNewSupplierFieldChange('email', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country*</Label>
                  <Select 
                    value={newSupplier.country} 
                    onValueChange={handleNewSupplierCountryChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-48 overflow-y-auto">
                      {countries.map(country => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="phone">Phone*</Label>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-600 min-w-[80px] text-center">
                      {getPhoneCodeForCountry(newSupplier.country)}
                    </div>
                    <Input
                      id="phone"
                      value={newSupplier.phone}
                      onChange={(e) => handleNewSupplierFieldChange('phone', e.target.value)}
                      placeholder="123456789"
                      required
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="city">City*</Label>
                  <Input
                    id="city"
                    value={newSupplier.city}
                    onChange={(e) => handleNewSupplierFieldChange('city', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State*</Label>
                  <Input
                    id="state"
                    value={newSupplier.state}
                    onChange={(e) => handleNewSupplierFieldChange('state', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="pincode">Pincode*</Label>
                  <Input
                    id="pincode"
                    value={newSupplier.pincode}
                    onChange={(e) => handleNewSupplierFieldChange('pincode', e.target.value)}
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSuppliers}</div>
            <p className="text-xs text-muted-foreground">
              {activeSuppliers} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSuppliers}</div>
            <p className="text-xs text-muted-foreground">
              {totalSuppliers > 0 ? Math.round((activeSuppliers / totalSuppliers) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchase Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPurchaseValue)}</div>
            <p className="text-xs text-muted-foreground">
              Across all suppliers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Completed purchases
            </p>
          </CardContent>
        </Card>
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
                  <TableHead>Total Orders</TableHead>
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
                        <div className="text-sm font-medium">{stats?.activePurchases || 0}</div>
                        <div className="text-xs text-gray-500">
                          {stats?.pendingPurchases || 0} pending
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
                              // Extract phone number without country code for editing
                              const phoneCode = getPhoneCodeForCountry(supplier.country);
                              const phoneWithoutCode = supplier.phone.startsWith(phoneCode) 
                                ? supplier.phone.substring(phoneCode.length).trim()
                                : supplier.phone;
                              
                              setEditingSupplier({
                                ...supplier,
                                phone: phoneWithoutCode
                              });
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
                    onChange={(e) => handleEditSupplierFieldChange('name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email*</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingSupplier.email}
                    onChange={(e) => handleEditSupplierFieldChange('email', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-country">Country*</Label>
                  <Select 
                    value={editingSupplier.country} 
                    onValueChange={handleEditSupplierCountryChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-48 overflow-y-auto">
                      {countries.map(country => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-phone">Phone*</Label>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-600 min-w-[80px] text-center">
                      {getPhoneCodeForCountry(editingSupplier.country)}
                    </div>
                    <Input
                      id="edit-phone"
                      value={editingSupplier.phone}
                      onChange={(e) => handleEditSupplierFieldChange('phone', e.target.value)}
                      placeholder="123456789"
                      required
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-city">City*</Label>
                  <Input
                    id="edit-city"
                    value={editingSupplier.city}
                    onChange={(e) => handleEditSupplierFieldChange('city', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-state">State*</Label>
                  <Input
                    id="edit-state"
                    value={editingSupplier.state}
                    onChange={(e) => handleEditSupplierFieldChange('state', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-pincode">Pincode*</Label>
                  <Input
                    id="edit-pincode"
                    value={editingSupplier.pincode}
                    onChange={(e) => handleEditSupplierFieldChange('pincode', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-taxId">Tax ID</Label>
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
                    onValueChange={(value: 'active' | 'inactive') => handleEditSupplierFieldChange('status', value)}
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

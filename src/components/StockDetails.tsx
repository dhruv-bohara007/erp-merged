import { useStockAggregation } from '../hooks/useStockAggregation';
import { useCompanyData } from '../hooks/useCompanyData';
import { StockDetailsData } from '../types/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './ui/use-toast';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Trash2, Edit2, Eye, EyeOff, RefreshCw, Save, Package, TrendingUp, Calendar, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';

const StockDetails = () => {
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'category' | 'name' | 'version' | 'stock' | 'none'>('none');
  const [editingFields, setEditingFields] = useState<{[key: string]: {minRequired?: string, safeQuantityLimit?: string}}>({});
  
  const { stockDetails, loading, error, manualRefresh } = useStockAggregation();
  const { companyData } = useCompanyData();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  // Function to trigger manual refresh of stock aggregation
  const handleRefreshStock = async () => {
    await manualRefresh();
    toast({
      title: "Stock Updated",
      description: "Stock details have been refreshed with latest data from inventory and purchase records.",
    });
  };

  // Save field changes with enhanced validation
  const saveFieldChanges = async (itemId: string, fieldType: 'minRequired' | 'safeQuantityLimit') => {
    if (!editingFields[itemId]) return;

    const item = stockDetails.find(s => s.id === itemId);
    if (!item) return;

    const minRequiredValue = fieldType === 'minRequired' 
      ? Number(editingFields[itemId].minRequired || 0)
      : Number(item.minRequired || 0);
    
    const safeQuantityLimitValue = fieldType === 'safeQuantityLimit'
      ? Number(editingFields[itemId].safeQuantityLimit || 0)
      : Number(item.safeQuantityLimit || 0);

    // Validation: Min Required should be less than or equal to Current Stock
    if (fieldType === 'minRequired' && minRequiredValue > item.currentStock) {
      toast({
        title: "Validation Error",
        description: "Min Required should be less than or equal to Current Stock.",
        variant: "destructive"
      });
      return;
    }

    // Validation: Safe Quantity Limit should be less than or equal to Min Required
    if (safeQuantityLimitValue > minRequiredValue) {
      toast({
        title: "Validation Error",
        description: "Safe Quantity Limit should be less than or equal to Min Required.",
        variant: "destructive"
      });
      return;
    }

    try {
      const docRef = doc(db, 'stock_details', itemId);
      const updateData: any = {
        updatedAt: new Date()
      };

      if (fieldType === 'minRequired') {
        updateData.minRequired = minRequiredValue;
      } else {
        updateData.safeQuantityLimit = safeQuantityLimitValue;
      }

      await updateDoc(docRef, updateData);

      // Clear editing state for this field
      setEditingFields(prev => {
        const newState = { ...prev };
        if (newState[itemId]) {
          if (fieldType === 'minRequired') {
            delete newState[itemId].minRequired;
          } else {
            delete newState[itemId].safeQuantityLimit;
          }
          // If no fields are being edited, remove the item entirely
          if (!newState[itemId].minRequired && !newState[itemId].safeQuantityLimit) {
            delete newState[itemId];
          }
        }
        return newState;
      });

      toast({
        title: "Success",
        description: `${fieldType === 'minRequired' ? 'Min Required' : 'Safe Quantity Limit'} updated successfully`
      });
    } catch (error) {
      console.error('Error updating stock details:', error);
      toast({
        title: "Error",
        description: "Failed to update stock details",
        variant: "destructive"
      });
    }
  };

  // Toggle display status
  const toggleDisplayStatus = async (itemId: string) => {
    const item = stockDetails.find(s => s.id === itemId);
    if (!item) return;

    const newStatus = item.displayStatus === 'displayed' ? 'suspended' : 'displayed';

    try {
      const docRef = doc(db, 'stock_details', itemId);
      await updateDoc(docRef, {
        displayStatus: newStatus,
        updatedAt: new Date()
      });

      toast({
        title: "Success",
        description: `Stock ${newStatus} successfully`
      });
    } catch (error) {
      console.error('Error updating display status:', error);
      toast({
        title: "Error",
        description: "Failed to update display status",
        variant: "destructive"
      });
    }
  };

  // Check if Display/Suspend button should be enabled
  const isDisplayButtonEnabled = (item: StockDetailsData) => {
    return (item.minRequired !== undefined && item.minRequired !== null && item.minRequired > 0) && 
           (item.safeQuantityLimit !== undefined && item.safeQuantityLimit !== null && item.safeQuantityLimit >= 0);
  };

  // Get the display value for input fields - show editing value or actual saved value
  const getDisplayValue = (item: StockDetailsData, fieldType: 'minRequired' | 'safeQuantityLimit') => {
    const editingValue = editingFields[item.id]?.[fieldType];
    if (editingValue !== undefined) {
      return editingValue;
    }
    
    const actualValue = item[fieldType];
    return actualValue !== undefined ? actualValue.toString() : '0';
  };

  // Filter and sort stock details
  const filteredStockDetails = stockDetails.filter(item => {
    const matchesSearch = (item.productCategory || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.itemName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.productVersion || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.productCategory === filterCategory;
    const matchesStatus = filterStatus === 'all' || item.displayStatus === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const sortedStockDetails = [...filteredStockDetails].sort((a, b) => {
    switch (sortBy) {
      case 'category':
        return (a.productCategory || '').localeCompare(b.productCategory || '');
      case 'name':
        return (a.itemName || '').localeCompare(b.itemName || '');
      case 'version':
        return (a.productVersion || '').localeCompare(b.productVersion || '');
      case 'stock':
        return b.currentStock - a.currentStock;
      default:
        return 0;
    }
  });

  // Get unique categories for filter
  const categories = [...new Set(stockDetails.map(item => item.productCategory).filter(Boolean))];

  // Calculate totals
  const totalItems = filteredStockDetails.length;
  const totalStock = filteredStockDetails.reduce((sum, item) => sum + item.currentStock, 0);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading stock details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Stock Details</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRefreshStock}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Stock Details</h1>
          <p className="text-muted-foreground mt-2">Combined inventory and purchase records stock levels</p>
        </div>
        <Button
          onClick={handleRefreshStock}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Stock
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Stock</p>
                <p className="text-2xl font-bold">{totalStock}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Details Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Stock Details ({sortedStockDetails.length})</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search stock..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="displayed">Displayed</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Default</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="version">Version</SelectItem>
                  <SelectItem value="stock">Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Category</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Product Version</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Min Required</TableHead>
                  <TableHead>Safe Quantity Limit</TableHead>
                  <TableHead>Last Purchase</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedStockDetails.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No stock items found
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedStockDetails.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.productCategory}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{item.itemName}</div>
                      </TableCell>
                      <TableCell>
                        <div>{item.productVersion}</div>
                      </TableCell>
                      <TableCell>
                        <div>{item.currentStock} {item.unit}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="number"
                            placeholder="0"
                            className="w-20"
                            value={getDisplayValue(item, 'minRequired')}
                            onChange={(e) => setEditingFields(prev => ({
                              ...prev,
                              [item.id]: {
                                ...prev[item.id],
                                minRequired: e.target.value
                              }
                            }))}
                          />
                          <span className="text-sm text-muted-foreground">{item.unit}</span>
                          {editingFields[item.id]?.minRequired !== undefined ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => saveFieldChanges(item.id, 'minRequired')}
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingFields(prev => ({
                                ...prev,
                                [item.id]: {
                                  ...prev[item.id],
                                  minRequired: (item.minRequired !== undefined ? item.minRequired.toString() : '0')
                                }
                              }))}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="number"
                            placeholder="0"
                            className="w-20"
                            value={getDisplayValue(item, 'safeQuantityLimit')}
                            onChange={(e) => setEditingFields(prev => ({
                              ...prev,
                              [item.id]: {
                                ...prev[item.id],
                                safeQuantityLimit: e.target.value
                              }
                            }))}
                          />
                          <span className="text-sm text-muted-foreground">{item.unit}</span>
                          {editingFields[item.id]?.safeQuantityLimit !== undefined ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => saveFieldChanges(item.id, 'safeQuantityLimit')}
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingFields(prev => ({
                                ...prev,
                                [item.id]: {
                                  ...prev[item.id],
                                  safeQuantityLimit: (item.safeQuantityLimit !== undefined ? item.safeQuantityLimit.toString() : '0')
                                }
                              }))}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Calendar className="w-3 h-3 mr-1 text-muted-foreground" />
                          {item.lastPurchaseDate?.toLocaleDateString() || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Calendar className="w-3 h-3 mr-1 text-muted-foreground" />
                          {item.updatedAt?.toLocaleDateString() || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={item.displayStatus === 'displayed' ? 'default' : 'secondary'}
                          disabled={!isDisplayButtonEnabled(item)}
                          onClick={() => toggleDisplayStatus(item.id)}
                          className="flex items-center gap-2"
                        >
                          {item.displayStatus === 'displayed' ? (
                            <>
                              <EyeOff className="h-3 w-3" />
                              Suspend
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3" />
                              Display
                            </>
                          )}
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

export default StockDetails;
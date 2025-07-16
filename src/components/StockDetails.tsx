import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Package,
  TrendingUp,
  IndianRupee,
  Calendar,
  ArrowUpDown
} from 'lucide-react';
import { useInventory } from '@/hooks/useFirestore';
import { useCompanyData } from '@/hooks/useCompanyData';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface StockDetailsData {
  id: string;
  companyId: string;
  productCategory: string;
  itemName: string;
  productVersion: string;
  currentStock: number;
  totalValue: number;
  lastPurchaseDate?: Date;
  unit: string;
  averageRate: number;
  createdAt: Date;
  updatedAt: Date;
}

const StockDetails = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'category' | 'name' | 'version' | 'stock' | 'value' | 'none'>('none');
  const [stockDetails, setStockDetails] = useState<StockDetailsData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { inventory } = useInventory();
  const { companyData } = useCompanyData();
  const { getCurrencyInfo } = useCurrencyConverter();
  const { currentUser } = useAuth();

  // Get company currency info
  const companyCountry = companyData?.country || 'US';
  const companyCurrency = getCurrencyInfo(companyCountry);

  // Generate stock details from inventory collection
  const generateStockDetails = async () => {
    if (!inventory.length || !currentUser?.companyId) return;

    const stockData: Record<string, StockDetailsData> = {};

    // Group inventory items by product
    inventory.forEach(item => {
      if (item.status === 'active' && item.quantity && item.quantity > 0) {
        const key = `${item.productCategory || 'Uncategorized'}-${item.itemName || 'Unknown'}-${item.productVersion || 'N/A'}`;
        
        if (!stockData[key]) {
          stockData[key] = {
            id: key,
            companyId: currentUser.companyId,
            productCategory: item.productCategory || 'Uncategorized',
            itemName: item.itemName || 'Unknown',
            productVersion: item.productVersion || 'N/A',
            currentStock: 0,
            totalValue: 0,
            unit: item.unit || 'pcs',
            averageRate: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }

        stockData[key].currentStock += item.quantity || 0;
        stockData[key].totalValue += (item.rateInInr || item.rate || 0) * (item.quantity || 0);
        stockData[key].averageRate = stockData[key].totalValue / stockData[key].currentStock;
        stockData[key].updatedAt = new Date();
      }
    });

    // Save to stock_details collection
    const stockDetailsCollection = collection(db, 'stock_details');
    
    for (const stockItem of Object.values(stockData)) {
      try {
        await setDoc(doc(stockDetailsCollection, stockItem.id), stockItem);
      } catch (error) {
        console.error('Error saving stock details:', error);
      }
    }

    return Object.values(stockData);
  };

  // Fetch stock details from Firestore
  const fetchStockDetails = async () => {
    if (!currentUser?.companyId) return [];

    try {
      const stockDetailsCollection = collection(db, 'stock_details');
      const q = query(stockDetailsCollection, where('companyId', '==', currentUser.companyId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        lastPurchaseDate: doc.data().lastPurchaseDate?.toDate()
      })) as StockDetailsData[];
    } catch (error) {
      console.error('Error fetching stock details:', error);
      return [];
    }
  };

  useEffect(() => {
    const loadStockDetails = async () => {
      setLoading(true);
      
      // First try to fetch existing stock details
      let existingStockDetails = await fetchStockDetails();
      
      // If no stock details exist or inventory has been updated, regenerate
      if (existingStockDetails.length === 0 || inventory.length > 0) {
        const newStockDetails = await generateStockDetails();
        if (newStockDetails) {
          existingStockDetails = newStockDetails;
        }
      }
      
      setStockDetails(existingStockDetails);
      setLoading(false);
    };

    loadStockDetails();
  }, [inventory, currentUser?.companyId]);

  // Filter and sort stock details
  const filteredStockDetails = stockDetails.filter(item => {
    const matchesSearch = (item.productCategory || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.itemName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.productVersion || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.productCategory === categoryFilter;
    return matchesSearch && matchesCategory;
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
      case 'value':
        return b.totalValue - a.totalValue;
      default:
        return 0;
    }
  });

  // Get unique categories for filter
  const categories = [...new Set(stockDetails.map(item => item.productCategory).filter(Boolean))];

  // Calculate totals
  const totalItems = filteredStockDetails.length;
  const totalValue = filteredStockDetails.reduce((sum, item) => sum + item.totalValue, 0);
  const totalStock = filteredStockDetails.reduce((sum, item) => sum + item.currentStock, 0);

  // Format currency with company currency symbol and 2 decimal places
  const formatCurrency = (amount: number) => {
    return `${companyCurrency.symbol}${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading stock details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Stock Details</h1>
          <p className="text-gray-600 mt-2">Track and manage your inventory stock levels and values</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
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
                <p className="text-sm font-medium text-gray-600">Total Stock</p>
                <p className="text-2xl font-bold">{totalStock}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <IndianRupee className="h-4 w-4 text-purple-600" />
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search stock..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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
                  <SelectItem value="value">Value</SelectItem>
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
                  <TableHead>Average Rate</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedStockDetails.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
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
                        <div className="font-medium">{formatCurrency(item.averageRate)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(item.totalValue)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                          {item.updatedAt?.toLocaleDateString() || 'N/A'}
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

export default StockDetails;
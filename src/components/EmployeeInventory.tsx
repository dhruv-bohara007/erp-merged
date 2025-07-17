
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Package, 
  Search,
  AlertTriangle,
  Eye,
  Flag,
  MessageCircle,
  X,
  CalendarIcon
} from 'lucide-react';
import { collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface StockDetailsData {
  id: string;
  companyId: string;
  productCategory: string;
  itemName: string;
  productVersion: string;
  currentStock: number;
  lastPurchaseDate?: Date;
  unit: string;
  minRequired?: number;
  safeQuantityLimit?: number;
  displayStatus: 'displayed' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

interface FlagRequestData {
  productCategory: string;
  itemName: string;
  productVersion: string;
  status: string;
  unit: string;
  quantity: string;
  reason: string;
  requestedDate: Date | undefined;
}

const EmployeeInventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockDetails, setStockDetails] = useState<StockDetailsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFlagForm, setShowFlagForm] = useState(false);
  const [flagRequestData, setFlagRequestData] = useState<FlagRequestData>({
    productCategory: '',
    itemName: '',
    productVersion: '',
    status: '',
    unit: '',
    quantity: '',
    reason: '',
    requestedDate: undefined
  });
  
  const { currentUser } = useAuth();
  const { toast } = useToast();

  // Fetch displayed stock details from Firestore
  const fetchDisplayedStockDetails = async () => {
    if (!currentUser?.companyId) return [];

    try {
      const stockDetailsCollection = collection(db, 'stock_details');
      const q = query(
        stockDetailsCollection, 
        where('companyId', '==', currentUser.companyId),
        where('displayStatus', '==', 'displayed')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastPurchaseDate: data.lastPurchaseDate?.toDate(),
          minRequired: data.minRequired !== undefined ? data.minRequired : 0,
          safeQuantityLimit: data.safeQuantityLimit !== undefined ? data.safeQuantityLimit : 0
        };
      }) as StockDetailsData[];
    } catch (error) {
      console.error('Error fetching displayed stock details:', error);
      return [];
    }
  };

  useEffect(() => {
    const loadStockDetails = async () => {
      setLoading(true);
      const displayedStock = await fetchDisplayedStockDetails();
      setStockDetails(displayedStock);
      setLoading(false);
    };

    loadStockDetails();
  }, [currentUser?.companyId]);

  const categories = ['all', ...Array.from(new Set(stockDetails.map(item => item.productCategory)))];

  const filteredInventory = stockDetails.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.productCategory.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.productCategory === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate status based on new logic
  const getItemStatus = (item: StockDetailsData) => {
    const { currentStock, minRequired = 0, safeQuantityLimit = 0 } = item;
    
    if (currentStock >= minRequired) {
      return 'normal';
    } else if (currentStock <= safeQuantityLimit) {
      return 'critical';
    } else {
      return 'low';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600';
      case 'low': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'normal': return 'default';
      case 'low': return 'secondary';
      case 'critical': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleFlagLowStock = (item: StockDetailsData) => {
    const status = getItemStatus(item);
    setFlagRequestData({
      productCategory: item.productCategory,
      itemName: item.itemName,
      productVersion: item.productVersion,
      status: status,
      unit: '',
      quantity: '',
      reason: '',
      requestedDate: undefined
    });
    setShowFlagForm(true);
  };

  const handleSendRequest = async () => {
    if (!currentUser?.companyId || !flagRequestData.quantity || !flagRequestData.reason || !flagRequestData.unit || !flagRequestData.requestedDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      await addDoc(collection(db, 'purchase_requests'), {
        companyId: currentUser.companyId,
        employeeName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Unknown',
        employeeEmail: currentUser.email,
        productCategory: flagRequestData.productCategory,
        itemName: flagRequestData.itemName,
        productVersion: flagRequestData.productVersion,
        stockStatus: flagRequestData.status,
        quantityRequired: parseInt(flagRequestData.quantity),
        unit: flagRequestData.unit,
        requestedDate: flagRequestData.requestedDate,
        reason: flagRequestData.reason,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast({
        title: "Request Sent",
        description: `Purchase request sent to admin for: ${flagRequestData.itemName}`
      });
      
      setShowFlagForm(false);
      setFlagRequestData({
        productCategory: '',
        itemName: '',
        productVersion: '',
        status: '',
        unit: '',
        quantity: '',
        reason: '',
        requestedDate: undefined
      });
    } catch (error) {
      console.error('Error sending request:', error);
      toast({
        title: "Error",
        description: "Failed to send request. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCancelRequest = () => {
    setShowFlagForm(false);
    setFlagRequestData({
      productCategory: '',
      itemName: '',
      productVersion: '',
      status: '',
      unit: '',
      quantity: '',
      reason: '',
      requestedDate: undefined
    });
  };

  // Calculate summary stats
  const totalItems = stockDetails.length;
  const lowStockItems = stockDetails.filter(item => getItemStatus(item) === 'low').length;
  const criticalStockItems = stockDetails.filter(item => getItemStatus(item) === 'critical').length;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Overview</h1>
            <p className="text-gray-600 mt-2">View current stock levels and flag low stock items</p>
          </div>
        </div>

        {/* Summary Stats - Moved to top */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Items</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
              <p className="text-xs text-gray-500">Displayed items</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{lowStockItems}</div>
              <p className="text-xs text-gray-500">Items need restocking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Critical Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{criticalStockItems}</div>
              <p className="text-xs text-gray-500">Immediate attention needed</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search inventory items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInventory.map((item) => {
            const status = getItemStatus(item);
            return (
              <Card key={item.id} className={`border-l-4 ${
                status === 'critical' ? 'border-l-red-500' :
                status === 'low' ? 'border-l-yellow-500' : 'border-l-green-500'
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{item.itemName}</CardTitle>
                      <p className="text-sm text-gray-500">{item.productCategory}</p>
                      {item.productVersion && item.productVersion !== 'N/A' && (
                        <p className="text-xs text-gray-400">v{item.productVersion}</p>
                      )}
                    </div>
                    <Badge variant={getStatusBadgeVariant(status)}>
                      {status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Current Stock:</span>
                      <span className={`font-semibold ${getStatusColor(status)}`}>
                        {item.currentStock} {item.unit}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Min Required:</span>
                      <span className="font-medium">{item.minRequired || 0} {item.unit}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Safe Limit:</span>
                      <span className="font-medium">{item.safeQuantityLimit || 0} {item.unit}</span>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Chat History
                      </Button>
                      {(status === 'low' || status === 'critical') && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleFlagLowStock(item)}
                          className="flex-1"
                        >
                          <Flag className="w-3 h-3 mr-1" />
                          Flag Low
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredInventory.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </CardContent>
          </Card>
        )}

        {/* Flag Low Stock Form Modal */}
        {showFlagForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Purchase Request</h3>
                <Button variant="ghost" size="sm" onClick={handleCancelRequest}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Category
                    </label>
                    <Input
                      value={flagRequestData.productCategory}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item Name
                    </label>
                    <Input
                      value={flagRequestData.itemName}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Version
                    </label>
                    <Input
                      value={flagRequestData.productVersion}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <Input
                      value={flagRequestData.status}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity Required *
                    </label>
                    <Input
                      type="number"
                      value={flagRequestData.quantity}
                      onChange={(e) => setFlagRequestData(prev => ({ ...prev, quantity: e.target.value }))}
                      placeholder="Enter quantity"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit *
                    </label>
                    <Select value={flagRequestData.unit} onValueChange={(value) => setFlagRequestData(prev => ({ ...prev, unit: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pieces">Pieces</SelectItem>
                        <SelectItem value="kg">Kilograms</SelectItem>
                        <SelectItem value="liters">Liters</SelectItem>
                        <SelectItem value="boxes">Boxes</SelectItem>
                        <SelectItem value="meters">Meters</SelectItem>
                        <SelectItem value="units">Units</SelectItem>
                        <SelectItem value="packs">Packs</SelectItem>
                        <SelectItem value="sets">Sets</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Required Date *
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !flagRequestData.requestedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {flagRequestData.requestedDate ? format(flagRequestData.requestedDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={flagRequestData.requestedDate}
                        onSelect={(date) => setFlagRequestData(prev => ({ ...prev, requestedDate: date }))}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Request *
                  </label>
                  <Textarea
                    value={flagRequestData.reason}
                    onChange={(e) => setFlagRequestData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Enter reason for this request"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleSendRequest}
                    className="flex-1"
                    disabled={!flagRequestData.quantity || !flagRequestData.reason || !flagRequestData.unit || !flagRequestData.requestedDate}
                  >
                    Send Request to Admin
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCancelRequest}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeInventory;

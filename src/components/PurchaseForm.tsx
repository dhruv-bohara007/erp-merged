import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SearchableDropdown from '@/components/SearchableDropdown';
import { ArrowLeft, Plus, Trash2, Settings } from 'lucide-react';
import { usePurchases, useSuppliers } from '@/hooks/useFirestore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { useCompanyData } from '@/hooks/useCompanyData';
import { useAuth } from '@/contexts/AuthContext';
import { useTaxCalculations } from '@/hooks/useTaxCalculations';
import { getCurrencyByCountry } from '@/data/countryCurrencyMapping';
import { PurchaseStockService } from '@/services/purchaseStockService';
import { format } from 'date-fns';
import { useInventoryDefinitions } from '@/hooks/useInventoryDefinitions';
import ManageInventoryCategoriesModal from './ManageInventoryCategoriesModal';

interface PurchaseItem {
  id: string;
  productCategory: string;
  itemName: string;
  productVersion: string;
  quantity: number;
  unit: string;
  existingStock?: number;
  pricePerUnit: number;
  discountRate: number;
  amount: number;
}

const UNIT_OPTIONS = [
  'pcs',
  'kg',
  'lbs',
  'grams',
  'liters',
  'gallons',
  'meters',
  'feet',
  'boxes',
  'bottles',
  'packets',
  'sets',
  'units'
];

const PurchaseForm = () => {
  const navigate = useNavigate();
  const { addPurchase } = usePurchases();
  const { suppliers } = useSuppliers();
  const { convertToINR, getCurrencyInfo } = useCurrencyConverter();
  const { currentUser, refreshUser } = useAuth();
  const { companyData } = useCompanyData();
  const { calculateTaxes } = useTaxCalculations();

  const [entryMode, setEntryMode] = useState<'inventory' | 'select'>('inventory');
  const [isManageInventoryCategoriesModalOpen, setIsManageInventoryCategoriesModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierCountry, setSupplierCountry] = useState('');
  const [supplierCurrency, setSupplierCurrency] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [description, setDescription] = useState('');

  // Get company currency info
  const companyCountry = companyData?.country || 'US';
  const companyCurrency = getCurrencyInfo(companyCountry);

  // Fetch stock details to populate dropdowns
  const [stockDetails, setStockDetails] = useState<any[]>([]);
  
  // Use inventory definitions hook
  const { inventoryDefinitions } = useInventoryDefinitions();

  useEffect(() => {
    const fetchStockDetails = async () => {
      if (!currentUser?.companyId) return;
      
      try {
        const stockDetailsCollection = collection(db, 'stock_details');
        const q = query(stockDetailsCollection, where('companyId', '==', currentUser.companyId));
        const snapshot = await getDocs(q);
        
        const stockData = snapshot.docs.map(doc => doc.data());
        setStockDetails(stockData);
      } catch (error) {
        console.error('Error fetching stock details:', error);
      }
    };

    fetchStockDetails();
  }, [currentUser?.companyId]);

  // Handle supplier selection
  const handleSupplierSelect = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier) {
      setSelectedSupplierId(supplierId);
      setSupplierName(supplier.name);
      setSupplierCountry(supplier.country);
      const currency = getCurrencyByCountry(supplier.country);
      setSupplierCurrency(currency.code);
    }
  };

  // Get supplier options for dropdown
  const supplierOptions = suppliers.map(supplier => ({
    value: supplier.id,
    label: `${supplier.name} - ${supplier.country}`
  }));

  // Get unique categories, names, and versions for dropdowns
  const getCategories = () => {
    if (entryMode === 'inventory') {
      return [...new Set(inventoryDefinitions.map(p => p.productCategory).filter(Boolean))];
    } else {
      return [...new Set(stockDetails.map(p => p.productCategory).filter(Boolean))];
    }
  };
  
  const getProductNames = (category: string) => {
    if (entryMode === 'inventory') {
      return [...new Set(inventoryDefinitions.filter(p => p.productCategory === category).map(p => p.itemName).filter(Boolean))];
    } else {
      return [...new Set(stockDetails.filter(p => p.productCategory === category).map(p => p.itemName).filter(Boolean))];
    }
  };
  
  const getProductVersions = (category: string, name: string) => {
    if (entryMode === 'inventory') {
      return [...new Set(inventoryDefinitions.filter(p => p.productCategory === category && p.itemName === name).map(p => p.productVersion).filter(Boolean))];
    } else {
      return [...new Set(stockDetails.filter(p => p.productCategory === category && p.itemName === name).map(p => p.productVersion).filter(Boolean))];
    }
  };

  const addNewItem = () => {
    const newItem: PurchaseItem = {
      id: Math.random().toString(36).substr(2, 9),
      productCategory: '',
      itemName: '',
      productVersion: '',
      quantity: 1,
      unit: 'pcs',
      pricePerUnit: 0,
      discountRate: 0,
      amount: 0
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, updates: Partial<PurchaseItem>) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, ...updates };
        // Recalculate amount with proper decimal handling (2 decimal places)
        const subtotal = updatedItem.quantity * updatedItem.pricePerUnit;
        const discount = subtotal * (updatedItem.discountRate / 100);
        updatedItem.amount = Math.round((subtotal - discount) * 100) / 100; // Store with 2 decimal places
        return updatedItem;
      }
      return item;
    }));
  };

  // Calculate totals with proper decimal handling
  const subtotal = Math.round(items.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
  const { totalTaxAmount, totalAmount } = calculateTaxes(subtotal, companyCountry, companyCountry);

  // Initialize with one item
  useEffect(() => {
    if (items.length === 0) {
      addNewItem();
    }
  }, []);

  const handleSubmit = async () => {
    if (!currentUser?.companyId) {
      try {
        await refreshUser();
        if (!currentUser?.companyId) {
          alert('Company setup is required before adding purchases. Please complete your company setup first.');
          return;
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
        alert('Company setup is required before adding purchases. Please complete your company setup first.');
        return;
      }
    }

    // Debug validation
    console.log('Validation check:', {
      selectedSupplierId,
      supplierName,
      itemsLength: items.length,
      items: items.map(item => ({
        itemName: item.itemName,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit
      }))
    });

    if (!selectedSupplierId || !supplierName || items.length === 0 || items.some(item => !item.itemName || item.quantity <= 0 || item.pricePerUnit <= 0)) {
      console.log('Validation failed:', {
        hasSelectedSupplierId: !!selectedSupplierId,
        hasSupplierName: !!supplierName,
        hasItems: items.length > 0,
        itemsValid: !items.some(item => !item.itemName || item.quantity <= 0 || item.pricePerUnit <= 0)
      });
      alert('Please select a supplier and fill in all required fields');
      return;
    }

    try {
      // Convert total amount to INR with 2 decimal places
      const { amountInINR, rate } = await convertToINR(totalAmount, companyCountry);
      const totalAmountINRFormatted = Math.round(amountInINR * 100) / 100;

      // Generate purchase record ID
      const purchaseRecordId = `PR-${Date.now().toString().slice(-8)}`;

      // Create a single purchase record document that conforms to Expense interface
      const purchaseRecord = {
        // Required Expense fields
        id: '', // Will be set by Firebase
        title: `Purchase Record - ${supplierName}`,
        amount: Math.round(totalAmount * 100) / 100,
        expenseDate: new Date(purchaseDate),
        category: 'Purchase',
        description: description || `Purchase from ${supplierName}`,
        status: 'recorded' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        
        // Purchase-specific fields (these are allowed in Expense interface)
        purchaseRecordId,
        supplierName,
        supplierCountry,
        supplierCurrency,
        companyCountry,
        items: items.map(item => ({
          productCategory: item.productCategory,
          itemName: item.itemName,
          productVersion: item.productVersion,
          quantity: item.quantity,
          unit: item.unit,
          pricePerUnit: Math.round(item.pricePerUnit * 100) / 100,
          discount: `${item.discountRate}%`, // Convert to string format for PurchaseItem interface
          amount: Math.round(item.amount * 100) / 100
        })),
        subtotal: Math.round(subtotal * 100) / 100,
        totalTaxAmount: Math.round(totalTaxAmount * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        totalAmountINR: totalAmountINRFormatted,
        companyCurrency: companyCurrency.code,
        exchangeRateUsed: rate,
        purchaseDate: new Date(purchaseDate),
        purchaseStatus: 'completed' as const
      };

      // Add single purchase record to database
      await addPurchase(purchaseRecord);

      // Update stock levels using the service (handles all items in the purchase record)
      await PurchaseStockService.updateStockOnPurchase(
        purchaseRecord,
        currentUser.companyId
      );

      // Redirect to Purchase Management page
      navigate('/purchases?section=purchase-record');
    } catch (error) {
      console.error('Error adding purchase:', error);
      alert('Failed to add purchase. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/purchases')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Purchases
          </Button>
          <h1 className="text-3xl font-bold">Add Purchase</h1>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setIsManageInventoryCategoriesModalOpen(true)}
        >
          <Settings className="w-4 h-4 mr-2" />
          Manage Inventory Categories
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <SearchableDropdown
                items={supplierOptions.map(opt => opt.label)}
                value={supplierOptions.find(opt => opt.value === selectedSupplierId)?.label || ''}
                onValueChange={(value) => {
                  const selectedOption = supplierOptions.find(opt => opt.label === value);
                  if (selectedOption) {
                    handleSupplierSelect(selectedOption.value);
                  }
                }}
                placeholder="Select supplier"
              />
              {selectedSupplierId && (
                <div className="text-sm text-gray-600">
                  Country: {supplierCountry} | Currency: {supplierCurrency}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Entry Mode</Label>
            <RadioGroup value={entryMode} onValueChange={(value: 'inventory' | 'select') => setEntryMode(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inventory" id="inventory" />
                <Label htmlFor="inventory">From Manage Inventory Category</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="select" id="select" />
                <Label htmlFor="select">Select from Available Items</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Items
            <Button onClick={addNewItem}>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="p-4 border rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Item {index + 1}</h4>
                {items.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Product Category</Label>
                  <SearchableDropdown
                    items={getCategories()}
                    value={item.productCategory || ''}
                    onValueChange={(value) => updateItem(item.id, { 
                      productCategory: value, 
                      productVersion: '', 
                      itemName: '' 
                    })}
                    placeholder="Select category"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Product Name</Label>
                  <SearchableDropdown
                    items={item.productCategory ? getProductNames(item.productCategory) : []}
                    value={item.itemName}
                    onValueChange={(value) => updateItem(item.id, { 
                      itemName: value, 
                      productVersion: '' 
                    })}
                    placeholder="Select product"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Product Version</Label>
                  <SearchableDropdown
                    items={item.productCategory && item.itemName ? getProductVersions(item.productCategory, item.itemName) : []}
                    value={item.productVersion || ''}
                    onValueChange={(value) => updateItem(item.id, { productVersion: value })}
                    placeholder="Select version"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="text"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Select value={item.unit} onValueChange={(value) => updateItem(item.id, { unit: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map(unit => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Price per Unit ({companyCurrency.symbol})</Label>
                  <Input
                    type="text"
                    value={item.pricePerUnit}
                    onChange={(e) => updateItem(item.id, { pricePerUnit: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discount Rate (%)</Label>
                  <Input
                    type="text"
                    value={item.discountRate}
                    onChange={(e) => updateItem(item.id, { discountRate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount ({companyCurrency.symbol})</Label>
                  <Input
                    type="number"
                    value={item.amount.toFixed(2)}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Purchase description..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{companyCurrency.symbol}{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>{companyCurrency.symbol}{totalTaxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total Amount after Tax:</span>
              <span>{companyCurrency.symbol}{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={() => navigate('/purchases')}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          Final Add Purchase
        </Button>
      </div>

      <ManageInventoryCategoriesModal
        isOpen={isManageInventoryCategoriesModalOpen}
        onClose={() => setIsManageInventoryCategoriesModalOpen(false)}
      />
    </div>
  );
};

export default PurchaseForm;

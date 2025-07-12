
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import SearchableDropdown from '@/components/SearchableDropdown';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { usePurchases, useInventory } from '@/hooks/useFirestore';
import { useProductDefinitions } from '@/hooks/useProductDefinitions';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { useCompanyData } from '@/hooks/useCompanyData';
import { useAuth } from '@/contexts/AuthContext';
import { useTaxCalculations } from '@/hooks/useTaxCalculations';
import { format } from 'date-fns';

interface PurchaseItem {
  id: string;
  itemName: string;
  productCategory?: string;
  productVersion?: string;
  quantity: number;
  unit: string;
  existingStock?: number;
  pricePerUnit: number;
  discountRate: number;
  amount: number;
}

const PurchaseForm = () => {
  const navigate = useNavigate();
  const { addPurchase } = usePurchases();
  const { inventory, updateInventoryItem, addInventoryItem } = useInventory();
  const { productDefinitions } = useProductDefinitions();
  const { convertToINR, getCurrencyInfo } = useCurrencyConverter();
  const { currentUser, refreshUser } = useAuth();
  const { companyData } = useCompanyData();
  const { calculateTaxes } = useTaxCalculations();

  const [entryMode, setEntryMode] = useState<'manual' | 'select'>('manual');
  const [supplierName, setSupplierName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [description, setDescription] = useState('');

  // Get company currency info
  const companyCountry = companyData?.country || 'US';
  const companyCurrency = getCurrencyInfo(companyCountry);

  // Get unique categories, names, and versions for dropdowns
  const categories = [...new Set(productDefinitions.map(p => p.category))];
  const getProductNames = (category: string) => 
    [...new Set(productDefinitions.filter(p => p.category === category).map(p => p.name))];
  const getProductVersions = (category: string, name: string) =>
    [...new Set(productDefinitions.filter(p => p.category === category && p.name === name).map(p => p.version))];

  const addNewItem = () => {
    const newItem: PurchaseItem = {
      id: Math.random().toString(36).substr(2, 9),
      itemName: '',
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
        // Recalculate amount
        const subtotal = updatedItem.quantity * updatedItem.pricePerUnit;
        const discount = subtotal * (updatedItem.discountRate / 100);
        updatedItem.amount = Math.round(subtotal - discount); // Round to whole number
        return updatedItem;
      }
      return item;
    }));
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
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

    if (!supplierName || items.length === 0 || items.some(item => !item.itemName || item.quantity <= 0 || item.pricePerUnit <= 0)) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Convert total amount to INR and round to whole number
      const { amountInINR, rate } = await convertToINR(totalAmount, companyCountry);
      const totalAmountINRRounded = Math.round(amountInINR);

      // Process each item
      for (const item of items) {
        // Convert item price to INR and round to whole numbers
        const { amountInINR: itemAmountInINR } = await convertToINR(item.amount, companyCountry);
        const { amountInINR: priceInINR } = await convertToINR(item.pricePerUnit, companyCountry);
        
        const itemAmountINRRounded = Math.round(itemAmountInINR);
        const priceInINRRounded = Math.round(priceInINR);

        // Add purchase record for each item
        await addPurchase({
          title: `${item.itemName} from ${supplierName}`,
          supplierName,
          itemName: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          pricePerUnit: item.pricePerUnit,
          discount: Math.round(item.quantity * item.pricePerUnit * item.discountRate / 100).toString(),
          totalAmount: item.amount,
          totalAmountINR: itemAmountINRRounded,
          companyCurrency: companyCurrency.code,
          exchangeRateUsed: rate,
          description,
          category: 'Purchase',
          amount: item.amount,
          expenseDate: new Date(purchaseDate),
          purchaseDate: new Date(purchaseDate),
          status: 'recorded',
          purchaseStatus: 'completed'
        });

        // Update or add inventory item
        const existingItem = inventory.find(invItem => 
          invItem.itemName.toLowerCase() === item.itemName.toLowerCase() &&
          (!item.productCategory || invItem.productCategory === item.productCategory) &&
          (!item.productVersion || invItem.productVersion === item.productVersion)
        );

        if (existingItem) {
          // Update existing inventory item with rounded values
          await updateInventoryItem(existingItem.id, {
            unitPrice: priceInINRRounded,
            rate: priceInINRRounded,
            rateInInr: priceInINRRounded,
            exchangeRateUsed: rate,
            updatedAt: new Date()
          });
        } else {
          // Add new inventory item with rounded values
          await addInventoryItem({
            itemName: item.itemName,
            productCategory: item.productCategory,
            productVersion: item.productVersion,
            unitPrice: priceInINRRounded,
            rate: priceInINRRounded,
            rateInInr: priceInINRRounded,
            exchangeRateUsed: rate,
            companyCurrency: companyCurrency.code,
            companyCountry: companyCountry,
            status: 'active'
          });
        }
      }

      // Redirect to Purchase Management page
      navigate('/purchases');
    } catch (error) {
      console.error('Error adding purchase:', error);
      alert('Failed to add purchase. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate('/purchases')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Purchases
        </Button>
        <h1 className="text-3xl font-bold">Add Purchase</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="supplierName">Supplier Name</Label>
              <Input
                id="supplierName"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Enter supplier name"
                required
              />
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
            <RadioGroup value={entryMode} onValueChange={(value: 'manual' | 'select') => setEntryMode(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="manual" id="manual" />
                <Label htmlFor="manual">Manual Entry</Label>
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

              {entryMode === 'select' ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Product Category</Label>
                    <SearchableDropdown
                      items={categories}
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
              ) : (
                <div className="space-y-2">
                  <Label>Item Name</Label>
                  <Input
                    value={item.itemName}
                    onChange={(e) => updateItem(item.id, { itemName: e.target.value })}
                    placeholder="Enter item name"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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
                  <Input
                    value={item.unit}
                    onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                  />
                </div>
                {entryMode === 'select' && (
                  <div className="space-y-2">
                    <Label>Existing Stock</Label>
                    <Input
                      type="number"
                      min="0"
                      value={item.existingStock || 0}
                      onChange={(e) => updateItem(item.id, { existingStock: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                )}
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
                    value={item.amount}
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
              <span>{companyCurrency.symbol}{Math.round(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>{companyCurrency.symbol}{Math.round(totalTaxAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total Amount after Tax:</span>
              <span>{companyCurrency.symbol}{Math.round(totalAmount)}</span>
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
    </div>
  );
};

export default PurchaseForm;

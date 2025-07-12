
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft,
  Plus,
  Trash2,
  Calculator
} from 'lucide-react';
import { useInventory, usePurchases } from '@/hooks/useFirestore';
import { useProductDefinitions } from '@/hooks/useProductDefinitions';
import { useTaxCalculations } from '@/hooks/useTaxCalculations';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { useCompanyData } from '@/hooks/useCompanyData';
import { useAuth } from '@/contexts/AuthContext';
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
  discount: number;
  amount: number;
  sourceType: 'available' | 'manual';
}

const PurchaseForm = () => {
  const navigate = useNavigate();
  const { addPurchase } = usePurchases();
  const { inventory, updateInventoryItem, addInventoryItem } = useInventory();
  const { productDefinitions } = useProductDefinitions();
  const { calculateTaxes } = useTaxCalculations();
  const { convertToINR, getCurrencyInfo } = useCurrencyConverter();
  const { currentUser, refreshUser } = useAuth();
  const { companyData } = useCompanyData();

  const [supplierName, setSupplierName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [entryType, setEntryType] = useState<'manual' | 'available'>('manual');
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [description, setDescription] = useState('');
  
  // Available item selection states
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedVersion, setSelectedVersion] = useState('');

  // Get company currency info
  const companyCountry = companyData?.country || 'US';
  const companyCurrency = getCurrencyInfo(companyCountry);

  // Get unique categories, products, and versions
  const categories = [...new Set(productDefinitions.map(p => p.category))];
  const products = selectedCategory 
    ? [...new Set(productDefinitions.filter(p => p.category === selectedCategory).map(p => p.name))]
    : [];
  const versions = selectedCategory && selectedProduct
    ? [...new Set(productDefinitions.filter(p => p.category === selectedCategory && p.name === selectedProduct).map(p => p.version))]
    : [];

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const { taxes, totalTaxAmount, totalAmount } = calculateTaxes(subtotal, companyCountry, companyCountry);

  const addNewItem = () => {
    const newItem: PurchaseItem = {
      id: Date.now().toString(),
      itemName: '',
      quantity: 1,
      unit: 'pcs',
      pricePerUnit: 0,
      discount: 0,
      amount: 0,
      sourceType: entryType
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, updates: Partial<PurchaseItem>) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, ...updates };
        // Recalculate amount
        const subtotal = updatedItem.quantity * updatedItem.pricePerUnit;
        updatedItem.amount = subtotal - updatedItem.discount;
        return updatedItem;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const addFromAvailable = () => {
    if (!selectedCategory || !selectedProduct || !selectedVersion) return;

    const existingInventoryItem = inventory.find(item => 
      item.productCategory === selectedCategory &&
      item.itemName === selectedProduct &&
      item.productVersion === selectedVersion
    );

    const newItem: PurchaseItem = {
      id: Date.now().toString(),
      itemName: selectedProduct,
      productCategory: selectedCategory,
      productVersion: selectedVersion,
      quantity: 1,
      unit: 'pcs',
      existingStock: 0,
      pricePerUnit: existingInventoryItem?.rate || 0,
      discount: 0,
      amount: existingInventoryItem?.rate || 0,
      sourceType: 'available'
    };

    setItems([...items, newItem]);
    
    // Reset selection
    setSelectedCategory('');
    setSelectedProduct('');
    setSelectedVersion('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
    
    if (!supplierName.trim() || items.length === 0) {
      alert('Please fill in supplier name and add at least one item');
      return;
    }

    try {
      // Convert total amount to INR
      const { amountInINR, rate } = await convertToINR(totalAmount, companyCountry);
      
      // Process each item for inventory updates
      for (const item of items) {
        if (item.sourceType === 'available') {
          // Update existing inventory item
          const existingItem = inventory.find(invItem => 
            invItem.itemName.toLowerCase() === item.itemName.toLowerCase() &&
            invItem.productCategory === item.productCategory &&
            invItem.productVersion === item.productVersion
          );

          if (existingItem) {
            const { amountInINR: priceInINR } = await convertToINR(item.pricePerUnit, companyCountry);
            await updateInventoryItem(existingItem.id, {
              unitPrice: priceInINR,
              rate: priceInINR,
              rateInInr: priceInINR,
              exchangeRateUsed: rate,
              updatedAt: new Date()
            });
          }
        } else {
          // Add new inventory item for manual entries
          const { amountInINR: priceInINR } = await convertToINR(item.pricePerUnit, companyCountry);
          await addInventoryItem({
            itemName: item.itemName,
            productCategory: item.productCategory,
            productVersion: item.productVersion,
            unitPrice: priceInINR,
            rate: priceInINR,
            rateInInr: priceInINR,
            exchangeRateUsed: rate,
            companyCurrency: companyCurrency.code,
            companyCountry: companyCountry,
            status: 'active'
          });
        }
      }

      // Add purchase record for each item
      for (const item of items) {
        await addPurchase({
          title: `${item.itemName} from ${supplierName}`,
          supplierName: supplierName,
          itemName: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          pricePerUnit: item.pricePerUnit,
          discount: item.discount.toString(),
          totalAmount: item.amount,
          totalAmountINR: amountInINR * (item.amount / totalAmount), // Proportional conversion
          companyCurrency: companyCurrency.code,
          exchangeRateUsed: rate,
          description: description,
          category: 'Purchase',
          amount: item.amount,
          expenseDate: new Date(purchaseDate),
          purchaseDate: new Date(purchaseDate),
          status: 'recorded',
          purchaseStatus: 'completed'
        });
      }
      
      navigate('/purchase-management');
    } catch (error) {
      console.error('Error adding purchase:', error);
      alert('Failed to add purchase. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate('/purchase-management')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Purchases
        </Button>
        <h1 className="text-3xl font-bold">Add New Purchase</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Supplier and Date */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplierName">Supplier Name</Label>
                <Input
                  id="supplierName"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
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
          </CardContent>
        </Card>

        {/* Entry Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Item Entry Method</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={entryType} onValueChange={(value: 'manual' | 'available') => setEntryType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="manual" id="manual" />
                <Label htmlFor="manual">Manual Entry</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="available" id="available" />
                <Label htmlFor="available">Select from Available Items</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Add Items Section */}
        {entryType === 'available' && (
          <Card>
            <CardHeader>
              <CardTitle>Select from Available Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Product Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Product Name</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct} disabled={!selectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product} value={product}>
                          {product}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Product Version</Label>
                  <Select value={selectedVersion} onValueChange={setSelectedVersion} disabled={!selectedProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select version..." />
                    </SelectTrigger>
                    <SelectContent>
                      {versions.map(version => (
                        <SelectItem key={version} value={version}>
                          {version}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                type="button" 
                onClick={addFromAvailable}
                disabled={!selectedCategory || !selectedProduct || !selectedVersion}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Selected Item
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Items List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Purchase Items
              <Button type="button" onClick={addNewItem} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add {entryType === 'manual' ? 'Manual' : 'Item'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Item Name</Label>
                    <Input
                      value={item.itemName}
                      onChange={(e) => updateItem(item.id, { itemName: e.target.value })}
                      disabled={item.sourceType === 'available'}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Input
                      value={item.unit}
                      onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                    />
                  </div>
                  
                  {item.sourceType === 'available' && (
                    <div className="space-y-2">
                      <Label>Existing Stock</Label>
                      <Input
                        type="number"
                        value={item.existingStock || 0}
                        onChange={(e) => updateItem(item.id, { existingStock: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label>Price per Unit ({companyCurrency.symbol})</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.pricePerUnit}
                      onChange={(e) => updateItem(item.id, { pricePerUnit: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Discount ({companyCurrency.symbol})</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.discount}
                      onChange={(e) => updateItem(item.id, { discount: parseFloat(e.target.value) || 0 })}
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
            
            {items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No items added yet. Click "Add {entryType === 'manual' ? 'Manual' : 'Item'}" to get started.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Totals */}
        {items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Purchase Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">{companyCurrency.symbol}{subtotal.toFixed(2)}</span>
              </div>
              
              {taxes.map((tax, index) => (
                <div key={index} className="flex justify-between text-sm text-gray-600">
                  <span>{tax.name} ({tax.rate}%):</span>
                  <span>{companyCurrency.symbol}{tax.amount.toFixed(2)}</span>
                </div>
              ))}
              
              <div className="border-t pt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount after Tax:</span>
                  <span>{companyCurrency.symbol}{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add any additional notes about this purchase..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => navigate('/purchase-management')}>
            Cancel
          </Button>
          <Button type="submit" disabled={items.length === 0}>
            Final Add Purchase
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PurchaseForm;

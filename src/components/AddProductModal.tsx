
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useInventory } from '@/hooks/useFirestore';
import { useCompanyData } from '@/hooks/useCompanyData';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { useProductDefinitions } from '@/hooks/useProductDefinitions';
import { useToast } from '@/hooks/use-toast';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddProductModal = ({ isOpen, onClose }: AddProductModalProps) => {
  const { toast } = useToast();
  const { addInventoryItem } = useInventory();
  const { companyData } = useCompanyData();
  const { convertToINR, getCurrencyInfo, loading: currencyLoading } = useCurrencyConverter();
  const { productDefinitions } = useProductDefinitions();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    name: '',
    version: '',
    rate: '',
    quantity: '',
    unit: 'pcs'
  });

  const companyCurrency = getCurrencyInfo(companyData?.country || 'US');

  // Get unique categories
  const categories = [...new Set(productDefinitions.map(p => p.category))];
  
  // Get names for selected category
  const namesForCategory = [...new Set(
    productDefinitions
      .filter(p => p.category === formData.category)
      .map(p => p.name)
  )];
  
  // Get versions for selected category and name
  const versionsForName = productDefinitions
    .filter(p => p.category === formData.category && p.name === formData.name)
    .map(p => p.version);

  // Reset dependent fields when parent selection changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, name: '', version: '' }));
  }, [formData.category]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, version: '' }));
  }, [formData.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.name || !formData.version || !formData.rate || !formData.quantity) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const rateValue = parseFloat(formData.rate);
    const quantityValue = parseFloat(formData.quantity);
    if (isNaN(rateValue) || rateValue <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid rate",
        variant: "destructive",
      });
      return;
    }
    if (isNaN(quantityValue) || quantityValue <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid quantity",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Convert to INR using the same logic as before
      const { amountInINR, rate: exchangeRate } = await convertToINR(rateValue, companyData?.country || 'US');
      
      await addInventoryItem({
        itemName: formData.name,
        productCategory: formData.category,
        productVersion: formData.version,
        unitPrice: rateValue,
        rate: rateValue,
        rateInInr: amountInINR,
        exchangeRateUsed: exchangeRate,
        quantity: quantityValue,
        unit: formData.unit,
        companyCurrency: companyCurrency.code,
        companyCountry: companyData?.country || 'US',
        status: 'active'
      });
      
      setFormData({
        category: '',
        name: '',
        version: '',
        rate: '',
        quantity: '',
        unit: 'pcs'
      });
      
      toast({
        title: "Success",
        description: "Product added successfully",
      });
      
      onClose();
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      category: '',
      name: '',
      version: '',
      rate: '',
      quantity: '',
      unit: 'pcs'
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="category">Product Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="name">Product Name</Label>
            <Select 
              value={formData.name} 
              onValueChange={(value) => setFormData({...formData, name: value})}
              disabled={!formData.category}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a product name" />
              </SelectTrigger>
              <SelectContent>
                {namesForCategory.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="version">Product Version</Label>
            <Select 
              value={formData.version} 
              onValueChange={(value) => setFormData({...formData, version: value})}
              disabled={!formData.name}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a version" />
              </SelectTrigger>
              <SelectContent>
                {versionsForName.map((version) => (
                  <SelectItem key={version} value={version}>
                    {version}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="rate">Rate per Unit ({companyCurrency.symbol})</Label>
            <Input
              id="rate"
              type="text"
              inputMode="decimal"
              value={formData.rate}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  setFormData({...formData, rate: value});
                }
              }}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="text"
              inputMode="decimal"
              value={formData.quantity}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  setFormData({...formData, quantity: value});
                }
              }}
              placeholder="1"
              required
            />
          </div>

          <div>
            <Label htmlFor="unit">Unit</Label>
            <Select value={formData.unit} onValueChange={(value) => setFormData({...formData, unit: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {['pcs', 'kg', 'lbs', 'grams', 'liters', 'gallons', 'meters', 'feet', 'boxes', 'bottles', 'packets', 'sets', 'units'].map(unit => (
                  <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || currencyLoading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Product'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductModal;

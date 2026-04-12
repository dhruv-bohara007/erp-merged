
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
  const { addInventoryItem, inventory } = useInventory();
  const { companyData } = useCompanyData();
  const { convertToINR, getCurrencyInfo, loading: currencyLoading } = useCurrencyConverter();
  const { productDefinitions, addProductDefinition, loading: definitionsLoading } = useProductDefinitions();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    name: '',
    version: '',
    rate: ''
  });

  const companyCurrency = getCurrencyInfo(companyData?.country || 'US');

  // Get unique categories with proper filtering
  const categories = [...new Set(
    productDefinitions
      .filter(p => p.productCategory && p.productCategory.trim() !== '')
      .map(p => p.productCategory)
  )];
  
  // Get names for selected category
  const namesForCategory = [...new Set(
    productDefinitions
      .filter(p => p.productCategory === formData.category && p.itemName && p.itemName.trim() !== '')
      .map(p => p.itemName)
  )];
  
  // Get versions for selected category and name
  const versionsForName = productDefinitions
    .filter(p => 
      p.productCategory === formData.category && 
      p.itemName === formData.name &&
      p.productVersion && p.productVersion.trim() !== ''
    )
    .map(p => p.productVersion);

  // Debug logging
  useEffect(() => {
    console.log('Product definitions loaded:', productDefinitions.length);
    console.log('Available categories:', categories);
    console.log('Selected category:', formData.category);
    console.log('Names for category:', namesForCategory);
    console.log('Selected name:', formData.name);
    console.log('Versions for name:', versionsForName);
  }, [productDefinitions, categories, formData.category, formData.name, namesForCategory, versionsForName]);

  // Reset dependent fields when parent selection changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, name: '', version: '' }));
  }, [formData.category]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, version: '' }));
  }, [formData.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.name || !formData.version || !formData.rate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const rateValue = parseFloat(formData.rate);
    if (isNaN(rateValue) || rateValue <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid rate",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Ensure product definition exists in the collection
      console.log('Adding product definition:', {
        productCategory: formData.category,
        itemName: formData.name,
        productVersion: formData.version
      });

      await addProductDefinition({
        productCategory: formData.category,
        itemName: formData.name,
        productVersion: formData.version
      });

      // Check for duplicate products
      const existingProduct = inventory.find(item => 
        item.itemName === formData.name &&
        item.productCategory === formData.category &&
        item.productVersion === formData.version &&
        item.rate === rateValue &&
        item.status === 'active'
      );

      if (existingProduct) {
        toast({
          title: "Error",
          description: "A product with the same name, category, version, and rate already exists",
          variant: "destructive",
        });
        return;
      }

      // Convert to INR using the same logic as before
      const { amountInINR, rate: exchangeRate } = await convertToINR(rateValue, companyData?.country || 'US');
      
      console.log('Adding inventory item:', {
        itemName: formData.name,
        productCategory: formData.category,
        productVersion: formData.version,
        unitPrice: rateValue,
        rate: rateValue,
        rateInInr: amountInINR,
        exchangeRateUsed: exchangeRate,
        companyCurrency: companyCurrency.code,
        companyCountry: companyData?.country || 'US',
        status: 'active'
      });

      await addInventoryItem({
        itemName: formData.name,
        productCategory: formData.category,
        productVersion: formData.version,
        unitPrice: rateValue,
        rate: rateValue,
        rateInInr: amountInINR,
        exchangeRateUsed: exchangeRate,
        companyCurrency: companyCurrency.code,
        companyCountry: companyData?.country || 'US',
        status: 'active'
      });
      
      setFormData({
        category: '',
        name: '',
        version: '',
        rate: ''
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
      rate: ''
    });
    onClose();
  };

  if (definitionsLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading product definitions...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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
              <SelectContent className="bg-white z-50 max-h-48 overflow-y-auto">
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-categories" disabled>
                    No categories available
                  </SelectItem>
                )}
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
              <SelectContent className="bg-white z-50 max-h-48 overflow-y-auto">
                {namesForCategory.length > 0 ? (
                  namesForCategory.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-names" disabled>
                    {formData.category ? 'No names available for this category' : 'Select a category first'}
                  </SelectItem>
                )}
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
              <SelectContent className="bg-white z-50 max-h-48 overflow-y-auto">
                {versionsForName.length > 0 ? (
                  versionsForName.map((version) => (
                    <SelectItem key={version} value={version}>
                      {version}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-versions" disabled>
                    {formData.name ? 'No versions available for this product' : 'Select a product name first'}
                  </SelectItem>
                )}
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

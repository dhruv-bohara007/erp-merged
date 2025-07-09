
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCompanyData } from '@/hooks/useCompanyData';
import { useCurrencyConverter, getCurrencyInfo } from '@/hooks/useCurrencyConverter';
import { useInventory } from '@/hooks/useFirestore';
import { useToast } from '@/hooks/use-toast';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddProductModal = ({ isOpen, onClose }: AddProductModalProps) => {
  const [itemName, setItemName] = useState('');
  const [rate, setRate] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { companyData } = useCompanyData();
  const { convertToINR } = useCurrencyConverter();
  const { addInventoryItem } = useInventory();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemName.trim() || !rate || !companyData) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    const rateValue = parseFloat(rate);
    if (isNaN(rateValue) || rateValue <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid rate',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Convert rate to INR using the currency converter
      const { amountInINR, rate: exchangeRate } = await convertToINR(
        rateValue, 
        companyData.companyCurrency
      );

      // Create the inventory item with the required structure
      await addInventoryItem({
        itemName: itemName.trim(),
        unitPrice: rateValue,
        rate: rateValue,
        rateInInr: Math.round(amountInINR * 100) / 100, // Round to 2 decimal places
        exchangeRateUsed: Math.round(exchangeRate * 10000) / 10000, // Round to 4 decimal places
        companyCurrency: companyData.companyCurrency,
        companyCountry: companyData.country,
        // Required fields for existing inventory structure
        name: itemName.trim(),
        description: '',
        category: 'Products',
        sku: `PROD-${Date.now()}`,
        currentStock: 0,
        minStock: 0,
        maxStock: 1000,
        unitCost: 0,
        unit: 'pieces',
        supplier: '',
        location: '',
        status: 'active'
      });

      toast({
        title: 'Success',
        description: 'Product added successfully'
      });

      // Reset form
      setItemName('');
      setRate('');
      onClose();
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: 'Error',
        description: 'Failed to add product. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Get currency symbol for display
  const currencyInfo = companyData ? getCurrencyInfo(companyData.country) : { symbol: '$' };
  const currencySymbol = currencyInfo.symbol;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Product</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="itemName">Item Name</Label>
            <Input
              id="itemName"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Enter product name"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="rate">Rate ({currencySymbol})</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                {currencySymbol}
              </span>
              <Input
                id="rate"
                type="text"
                inputMode="decimal"
                value={rate}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setRate(value);
                  }
                }}
                placeholder="0.00"
                className="pl-8"
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductModal;

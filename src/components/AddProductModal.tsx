
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useInventory } from '@/hooks/useFirestore';
import { useCompanyData } from '@/hooks/useCompanyData';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
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
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    itemName: '',
    rate: ''
  });

  const companyCurrency = getCurrencyInfo(companyData?.country || 'US');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.itemName || !formData.rate) {
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
      // Convert to INR using the same logic as invoice creation
      const { amountInINR, rate: exchangeRate } = await convertToINR(rateValue, companyData?.country || 'US');
      
      await addInventoryItem({
        itemName: formData.itemName,
        unitPrice: rateValue,
        rate: rateValue,
        rateInInr: amountInINR,
        exchangeRateUsed: exchangeRate,
        companyCurrency: companyCurrency.code,
        companyCountry: companyData?.country || 'US',
        status: 'active'
      });
      
      setFormData({
        itemName: '',
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
      itemName: '',
      rate: ''
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
            <Label htmlFor="itemName">Item Name</Label>
            <Input
              id="itemName"
              value={formData.itemName}
              onChange={(e) => setFormData({...formData, itemName: e.target.value})}
              placeholder="Enter item name"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="rate">Rate ({companyCurrency.symbol})</Label>
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

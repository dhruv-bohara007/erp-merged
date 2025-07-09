
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Edit, Plus, Save } from 'lucide-react';
import { useProductDefinitions } from '@/hooks/useProductDefinitions';
import { useToast } from '@/hooks/use-toast';

interface ManageProductCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManageProductCategoryModal = ({ isOpen, onClose }: ManageProductCategoryModalProps) => {
  const { toast } = useToast();
  const { 
    productDefinitions, 
    loading, 
    addProductDefinition, 
    updateProductDefinition, 
    deleteProductDefinition 
  } = useProductDefinitions();

  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProductName, setSelectedProductName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newVersion, setNewVersion] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);

  // Get unique categories
  const categories = Array.from(new Set(productDefinitions.map(item => item.category)));
  
  // Get product names for selected category
  const productNames = Array.from(new Set(
    productDefinitions
      .filter(item => item.category === selectedCategory)
      .map(item => item.productName)
  ));
  
  // Get versions for selected product name
  const versions = productDefinitions
    .filter(item => item.category === selectedCategory && item.productName === selectedProductName)
    .map(item => item.version);

  const handleSave = async () => {
    if (!selectedCategory || !selectedProductName || !newVersion) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await addProductDefinition({
        category: selectedCategory,
        productName: selectedProductName,
        version: newVersion,
        status: 'active'
      });

      toast({
        title: "Success",
        description: "Product definition saved successfully",
      });

      // Reset form
      setStep(1);
      setSelectedCategory('');
      setSelectedProductName('');
      setNewCategory('');
      setNewProductName('');
      setNewVersion('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save product definition",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteProductDefinition(id);
        toast({
          title: "Success",
          description: "Item deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete item",
          variant: "destructive",
        });
      }
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedCategory('');
    setSelectedProductName('');
    setNewCategory('');
    setNewProductName('');
    setNewVersion('');
    setEditingItem(null);
    onClose();
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <Label>Select Existing Category or Add New</Label>
        <div className="flex gap-2 mt-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div>
        <Label>Or Add New Category</Label>
        <div className="flex gap-2 mt-2">
          <Input
            placeholder="Enter new category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              if (newCategory) {
                setSelectedCategory(newCategory);
                setNewCategory('');
              }
            }}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Existing Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category} className="flex justify-between items-center p-2 border rounded">
                  <span>{category}</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        const categoryItems = productDefinitions.filter(item => item.category === category);
                        if (categoryItems.length > 0) {
                          handleDelete(categoryItems[0].id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button 
          onClick={() => setStep(2)} 
          disabled={!selectedCategory}
        >
          Next
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <Label>Select Existing Product Name or Add New</Label>
        <div className="flex gap-2 mt-2">
          <Select value={selectedProductName} onValueChange={setSelectedProductName}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select product name" />
            </SelectTrigger>
            <SelectContent>
              {productNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Or Add New Product Name</Label>
        <div className="flex gap-2 mt-2">
          <Input
            placeholder="Enter new product name"
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
          />
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              if (newProductName) {
                setSelectedProductName(newProductName);
                setNewProductName('');
              }
            }}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(1)}>
          Back
        </Button>
        <Button 
          onClick={() => setStep(3)} 
          disabled={!selectedProductName}
        >
          Next
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div>
        <Label>Product Version</Label>
        <div className="flex gap-2 mt-2">
          <Input
            placeholder="Enter product version"
            value={newVersion}
            onChange={(e) => setNewVersion(e.target.value)}
          />
        </div>
      </div>

      {versions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Existing Versions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {versions.map((version) => (
                <div key={version} className="flex justify-between items-center p-2 border rounded">
                  <span>{version}</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(2)}>
          Back
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Manage Product Category - Step {step} of 3
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageProductCategoryModal;

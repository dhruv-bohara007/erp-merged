
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Trash2, Edit2, Plus, ArrowLeft, ArrowRight } from 'lucide-react';
import { useProductDefinitions } from '@/hooks/useProductDefinitions';
import { useToast } from '@/hooks/use-toast';

interface ManageProductCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'category' | 'name' | 'version';

const ManageProductCategoryModal = ({ isOpen, onClose }: ManageProductCategoryModalProps) => {
  const { toast } = useToast();
  const { 
    productDefinitions, 
    loading, 
    addProductDefinition, 
    updateProductDefinition, 
    deleteProductDefinition 
  } = useProductDefinitions();

  const [currentStep, setCurrentStep] = useState<Step>('category');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newName, setNewName] = useState('');
  const [newVersion, setNewVersion] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const categories = [...new Set(productDefinitions.map(p => p.category))];
  const namesInCategory = productDefinitions
    .filter(p => p.category === selectedCategory)
    .map(p => p.name);
  const uniqueNamesInCategory = [...new Set(namesInCategory)];
  const versionsForName = productDefinitions
    .filter(p => p.category === selectedCategory && p.name === selectedName)
    .map(p => p.version);

  const handleClose = () => {
    setCurrentStep('category');
    setSelectedCategory('');
    setSelectedName('');
    setNewCategory('');
    setNewName('');
    setNewVersion('');
    setEditingItem(null);
    setEditValue('');
    onClose();
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    
    try {
      await addProductDefinition({
        category: newCategory.trim(),
        name: 'Default',
        version: '1.0'
      });
      
      setNewCategory('');
      toast({
        title: "Success",
        description: "Category added successfully",
      });
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive",
      });
    }
  };

  const handleAddName = async () => {
    if (!newName.trim() || !selectedCategory) return;
    
    try {
      await addProductDefinition({
        category: selectedCategory,
        name: newName.trim(),
        version: '1.0'
      });
      
      setNewName('');
      toast({
        title: "Success",
        description: "Product name added successfully",
      });
    } catch (error) {
      console.error('Error adding name:', error);
      toast({
        title: "Error",
        description: "Failed to add product name",
        variant: "destructive",
      });
    }
  };

  const handleAddVersion = async () => {
    if (!newVersion.trim() || !selectedCategory || !selectedName) return;
    
    try {
      await addProductDefinition({
        category: selectedCategory,
        name: selectedName,
        version: newVersion.trim()
      });
      
      setNewVersion('');
      toast({
        title: "Success",
        description: "Product version added successfully",
      });
    } catch (error) {
      console.error('Error adding version:', error);
      toast({
        title: "Error",
        description: "Failed to add product version",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (id: string, field: 'category' | 'name' | 'version') => {
    if (!editValue.trim()) return;
    
    try {
      const item = productDefinitions.find(p => p.id === id);
      if (!item) return;

      const updates = { ...item, [field]: editValue.trim() };
      await updateProductDefinition(id, updates);
      
      setEditingItem(null);
      setEditValue('');
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: "Error",
        description: "Failed to update item",
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
        console.error('Error deleting item:', error);
        toast({
          title: "Error",
          description: "Failed to delete item",
          variant: "destructive",
        });
      }
    }
  };

  const renderCategoryStep = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="newCategory">Add New Category</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="newCategory"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Enter category name"
          />
          <Button onClick={handleAddCategory} disabled={!newCategory.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Separator />

      <div>
        <Label>Existing Categories</Label>
        <div className="mt-2 space-y-2">
          {categories.map((category) => {
            const categoryItems = productDefinitions.filter(p => p.category === category);
            return categoryItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                {editingItem === item.id ? (
                  <div className="flex gap-2 flex-1">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={() => handleEdit(item.id, 'category')}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <span>{category}</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingItem(item.id);
                          setEditValue(category);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ));
          })}
        </div>
      </div>

      <div className="flex justify-between">
        <div />
        <Button 
          onClick={() => setCurrentStep('name')} 
          disabled={!selectedCategory}
        >
          Next <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <div>
        <Label htmlFor="categorySelect">Select Category to Continue</Label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
    </div>
  );

  const renderNameStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={() => setCurrentStep('category')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm text-muted-foreground">Category: {selectedCategory}</span>
      </div>

      <div>
        <Label htmlFor="newName">Add New Product Name</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="newName"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter product name"
          />
          <Button onClick={handleAddName} disabled={!newName.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Separator />

      <div>
        <Label>Existing Product Names</Label>
        <div className="mt-2 space-y-2">
          {uniqueNamesInCategory.map((name) => {
            const nameItems = productDefinitions.filter(p => p.category === selectedCategory && p.name === name);
            return nameItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                {editingItem === item.id ? (
                  <div className="flex gap-2 flex-1">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={() => handleEdit(item.id, 'name')}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <span>{name}</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingItem(item.id);
                          setEditValue(name);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ));
          })}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep('category')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Previous
        </Button>
        <Button 
          onClick={() => setCurrentStep('version')} 
          disabled={!selectedName}
        >
          Next <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <div>
        <Label htmlFor="nameSelect">Select Product Name to Continue</Label>
        <Select value={selectedName} onValueChange={setSelectedName}>
          <SelectTrigger>
            <SelectValue placeholder="Select a product name" />
          </SelectTrigger>
          <SelectContent>
            {uniqueNamesInCategory.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderVersionStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={() => setCurrentStep('name')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          {selectedCategory} → {selectedName}
        </span>
      </div>

      <div>
        <Label htmlFor="newVersion">Add New Version</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="newVersion"
            value={newVersion}
            onChange={(e) => setNewVersion(e.target.value)}
            placeholder="Enter version (e.g., 1.0, 2.1, beta)"
          />
          <Button onClick={handleAddVersion} disabled={!newVersion.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Separator />

      <div>
        <Label>Existing Versions</Label>
        <div className="mt-2 space-y-2">
          {productDefinitions
            .filter(p => p.category === selectedCategory && p.name === selectedName)
            .map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                {editingItem === item.id ? (
                  <div className="flex gap-2 flex-1">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={() => handleEdit(item.id, 'version')}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <span>{item.version}</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingItem(item.id);
                          setEditValue(item.version);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep('name')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Previous
        </Button>
        <div />
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Manage Product Categories
            {currentStep === 'category' && ' - Step 1: Categories'}
            {currentStep === 'name' && ' - Step 2: Product Names'}
            {currentStep === 'version' && ' - Step 3: Versions'}
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div>Loading...</div>
          </div>
        ) : (
          <>
            {currentStep === 'category' && renderCategoryStep()}
            {currentStep === 'name' && renderNameStep()}
            {currentStep === 'version' && renderVersionStep()}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ManageProductCategoryModal;

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ArrowRight, Plus, Loader2 } from 'lucide-react';
import { useInventoryDefinitions } from '@/hooks/useInventoryDefinitions';
import { useToast } from '@/hooks/use-toast';
import SearchableDropdown from './SearchableDropdown';

interface ManageInventoryCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'category' | 'name' | 'version';

const ManageInventoryCategoriesModal = ({ isOpen, onClose }: ManageInventoryCategoriesModalProps) => {
  const { toast } = useToast();
  const { 
    inventoryDefinitions, 
    loading, 
    addInventoryDefinition, 
    updateInventoryDefinition, 
    deleteInventoryDefinition,
    deleteCategoryAndAllRelated,
    deleteItemNameAndAllVersions,
    updateCategoryForAllRelated,
    updateItemNameForAllVersions,
    refreshDefinitions 
  } = useInventoryDefinitions();

  const [currentStep, setCurrentStep] = useState<Step>('category');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newName, setNewName] = useState('');
  const [newVersion, setNewVersion] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const categories = [...new Set(
    inventoryDefinitions
      .filter(p => p.productCategory && p.productCategory.trim() !== '')
      .map(p => p.productCategory)
  )];

  const namesInCategory = inventoryDefinitions
    .filter(p => p.productCategory === selectedCategory && p.itemName && p.itemName.trim() !== '')
    .map(p => p.itemName);
  const uniqueNamesInCategory = [...new Set(namesInCategory)];

  const versionsForName = inventoryDefinitions
    .filter(p => 
      p.productCategory === selectedCategory && 
      p.itemName === selectedName &&
      p.productVersion && p.productVersion.trim() !== ''
    )
    .map(p => p.productVersion);

  useEffect(() => {
    setSelectedName('');
  }, [selectedCategory]);

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
      await addInventoryDefinition({
        productCategory: newCategory.trim(),
        itemName: 'Default Product',
        productVersion: '1.0'
      });
      
      await refreshDefinitions();
      
      setNewCategory('');
      toast({
        title: "Success",
        description: "Inventory category added successfully",
      });
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: "Failed to add inventory category",
        variant: "destructive",
      });
    }
  };

  const handleAddName = async () => {
    if (!newName.trim() || !selectedCategory) return;
    
    try {
      await addInventoryDefinition({
        productCategory: selectedCategory,
        itemName: newName.trim(),
        productVersion: '1.0'
      });
      
      await refreshDefinitions();
      
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
      await addInventoryDefinition({
        productCategory: selectedCategory,
        itemName: selectedName,
        productVersion: newVersion.trim()
      });
      
      await refreshDefinitions();
      
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

  const handleEdit = async (id: string, field: 'productCategory' | 'itemName' | 'productVersion', newValue: string) => {
    if (!newValue.trim()) return;
    
    try {
      const item = inventoryDefinitions.find(p => p.id === id);
      if (!item) return;

      if (field === 'productCategory') {
        await updateCategoryForAllRelated(item.productCategory, newValue.trim());
      } else if (field === 'itemName') {
        await updateItemNameForAllVersions(item.productCategory, item.itemName, newValue.trim());
      } else if (field === 'productVersion') {
        await updateInventoryDefinition(id, { [field]: newValue.trim() });
      }
      
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
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await deleteInventoryDefinition(id);
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
  };

  const handleEditCategory = (category: string) => {
    const categoryItem = inventoryDefinitions.find(p => p.productCategory === category);
    if (categoryItem) {
      setEditingItem(categoryItem.id);
      setEditValue(category);
    }
  };

  const handleDeleteCategory = async (category: string) => {
    const relatedCount = inventoryDefinitions.filter(p => p.productCategory === category).length;
    if (!window.confirm(`Are you sure you want to delete category "${category}" and all ${relatedCount} related items?`)) return;
    
    try {
      await deleteCategoryAndAllRelated(category);
      toast({
        title: "Success",
        description: `Category "${category}" and all related items deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  const handleEditName = (name: string) => {
    const nameItem = inventoryDefinitions.find(p => p.productCategory === selectedCategory && p.itemName === name);
    if (nameItem) {
      setEditingItem(nameItem.id);
      setEditValue(name);
    }
  };

  const handleDeleteName = async (name: string) => {
    const relatedCount = inventoryDefinitions.filter(p => p.productCategory === selectedCategory && p.itemName === name).length;
    if (!window.confirm(`Are you sure you want to delete product name "${name}" and all ${relatedCount} related versions?`)) return;
    
    try {
      await deleteItemNameAndAllVersions(selectedCategory, name);
      toast({
        title: "Success",
        description: `Product name "${name}" and all related versions deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting product name:', error);
      toast({
        title: "Error",
        description: "Failed to delete product name",
        variant: "destructive",
      });
    }
  };

  const handleEditVersion = (version: string) => {
    const versionItem = inventoryDefinitions.find(p => 
      p.productCategory === selectedCategory && p.itemName === selectedName && p.productVersion === version
    );
    if (versionItem) {
      setEditingItem(versionItem.id);
      setEditValue(version);
    }
  };

  const handleDeleteVersion = (version: string) => {
    const versionItem = inventoryDefinitions.find(p => 
      p.productCategory === selectedCategory && p.itemName === selectedName && p.productVersion === version
    );
    if (versionItem) {
      handleDelete(versionItem.id);
    }
  };

  const renderCategoryStep = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="categorySelect">Select Inventory Category</Label>
        <SearchableDropdown
          key={`categories-${inventoryDefinitions.length}`}
          items={categories}
          value={selectedCategory}
          onValueChange={setSelectedCategory}
          placeholder="Select an inventory category"
          onEdit={handleEditCategory}
          onDelete={handleDeleteCategory}
          showActions={true}
        />
      </div>

      <div>
        <Label htmlFor="newCategory">Add New Inventory Category</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="newCategory"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Enter inventory category name"
          />
          <Button onClick={handleAddCategory} disabled={!newCategory.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {editingItem && (
        <div className="p-4 border rounded-lg bg-blue-50">
          <Label>Edit Inventory Category</Label>
          <div className="flex gap-2 mt-1">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Edit category name"
            />
            <Button size="sm" onClick={() => handleEdit(editingItem, 'productCategory', editValue)}>
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              setEditingItem(null);
              setEditValue('');
            }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <div />
        <Button 
          onClick={() => setCurrentStep('name')} 
          disabled={!selectedCategory}
        >
          Next <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
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
        <Label htmlFor="nameSelect">Select Product Name</Label>
        <SearchableDropdown
          key={`names-${selectedCategory}-${uniqueNamesInCategory.length}`}
          items={uniqueNamesInCategory}
          value={selectedName}
          onValueChange={setSelectedName}
          placeholder="Select a product name"
          onEdit={handleEditName}
          onDelete={handleDeleteName}
          showActions={true}
        />
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

      {editingItem && (
        <div className="p-4 border rounded-lg bg-blue-50">
          <Label>Edit Product Name</Label>
          <div className="flex gap-2 mt-1">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Edit product name"
            />
            <Button size="sm" onClick={() => handleEdit(editingItem, 'itemName', editValue)}>
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              setEditingItem(null);
              setEditValue('');
            }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

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
        <Label>Select Version</Label>
        <SearchableDropdown
          key={`versions-${selectedCategory}-${selectedName}-${versionsForName.length}`}
          items={versionsForName}
          value=""
          onValueChange={() => {}}
          placeholder="Select a version"
          onEdit={handleEditVersion}
          onDelete={handleDeleteVersion}
          showActions={true}
        />
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

      {editingItem && (
        <div className="p-4 border rounded-lg bg-blue-50">
          <Label>Edit Version</Label>
          <div className="flex gap-2 mt-1">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Edit version"
            />
            <Button size="sm" onClick={() => handleEdit(editingItem, 'productVersion', editValue)}>
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              setEditingItem(null);
              setEditValue('');
            }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep('name')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Previous
        </Button>
        <Button onClick={handleClose}>
          Done
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Inventory Categories</DialogTitle>
          <DialogDescription>
            Organize and manage your inventory categories, product names, and versions.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-6">
              <Button 
                variant={currentStep === 'category' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setCurrentStep('category')}
              >
                Categories
              </Button>
              <Button 
                variant={currentStep === 'name' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setCurrentStep('name')}
                disabled={!selectedCategory}
              >
                Product Names
              </Button>
              <Button 
                variant={currentStep === 'version' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setCurrentStep('version')}
                disabled={!selectedCategory || !selectedName}
              >
                Versions
              </Button>
            </div>

            <Separator className="mb-6" />

            {currentStep === 'category' && renderCategoryStep()}
            {currentStep === 'name' && renderNameStep()}
            {currentStep === 'version' && renderVersionStep()}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ManageInventoryCategoriesModal;
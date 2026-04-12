import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ArrowRight, Plus, Loader2 } from 'lucide-react';
import { useProductDefinitions } from '@/hooks/useProductDefinitions';
import { useToast } from '@/hooks/use-toast';
import SearchableDropdown from './SearchableDropdown';

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
    deleteProductDefinition,
    deleteCategoryAndAllRelated,
    deleteItemNameAndAllVersions,
    updateCategoryForAllRelated,
    updateItemNameForAllVersions,
    refreshDefinitions 
  } = useProductDefinitions();

  const [currentStep, setCurrentStep] = useState<Step>('category');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newName, setNewName] = useState('');
  const [newVersion, setNewVersion] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Filter out empty/invalid entries with debugging
  const categories = [...new Set(
    productDefinitions
      .filter(p => {
        console.log('Filtering product definition:', p);
        const hasCategory = p.productCategory && p.productCategory.trim() !== '';
        console.log('Has valid category:', hasCategory, 'Category:', p.productCategory);
        return hasCategory;
      })
      .map(p => p.productCategory)
  )];
  
  console.log('ManageProductCategoryModal - All product definitions:', productDefinitions);
  console.log('ManageProductCategoryModal - Filtered categories:', categories);

  const namesInCategory = productDefinitions
    .filter(p => p.productCategory === selectedCategory && p.itemName && p.itemName.trim() !== '')
    .map(p => p.itemName);
  const uniqueNamesInCategory = [...new Set(namesInCategory)];

  const versionsForName = productDefinitions
    .filter(p => 
      p.productCategory === selectedCategory && 
      p.itemName === selectedName &&
      p.productVersion && p.productVersion.trim() !== ''
    )
    .map(p => p.productVersion);

  // Debug logging
  useEffect(() => {
    console.log('=== ManageProductCategoryModal Debug ===');
    console.log('Product definitions count:', productDefinitions.length);
    console.log('Product definitions data:', productDefinitions);
    console.log('Categories extracted:', categories);
    console.log('Loading status:', loading);
    console.log('==========================================');
  }, [productDefinitions, categories, loading]);

  // Reset dependent fields when parent selection changes
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

  const handleSave = () => {
    toast({
      title: "Success",
      description: "Product definitions management completed",
    });
    handleClose();
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    
    try {
      console.log('Adding new category to product_definitions:', newCategory.trim());
      await addProductDefinition({
        productCategory: newCategory.trim(),
        itemName: 'Default Product',
        productVersion: '1.0'
      });
      
      // Explicitly refresh definitions to ensure immediate update
      await refreshDefinitions();
      
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
      console.log('Adding new product name to product_definitions:', {
        category: selectedCategory,
        name: newName.trim()
      });
      await addProductDefinition({
        productCategory: selectedCategory,
        itemName: newName.trim(),
        productVersion: '1.0'
      });
      
      // Explicitly refresh definitions to ensure immediate update
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
      console.log('Adding new product version to product_definitions:', {
        category: selectedCategory,
        name: selectedName,
        version: newVersion.trim()
      });
      await addProductDefinition({
        productCategory: selectedCategory,
        itemName: selectedName,
        productVersion: newVersion.trim()
      });
      
      // Explicitly refresh definitions to ensure immediate update
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
      const item = productDefinitions.find(p => p.id === id);
      if (!item) return;

      // Use batch update for categories and item names to maintain consistency
      if (field === 'productCategory') {
        await updateCategoryForAllRelated(item.productCategory, newValue.trim());
      } else if (field === 'itemName') {
        await updateItemNameForAllVersions(item.productCategory, item.itemName, newValue.trim());
      } else if (field === 'productVersion') {
        // For versions, update only the specific document
        await updateProductDefinition(id, { [field]: newValue.trim() });
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
  };

  const handleEditCategory = (category: string) => {
    const categoryItem = productDefinitions.find(p => p.productCategory === category);
    if (categoryItem) {
      setEditingItem(categoryItem.id);
      setEditValue(category);
    }
  };

  const handleDeleteCategory = async (category: string) => {
    const relatedCount = productDefinitions.filter(p => p.productCategory === category).length;
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
    const nameItem = productDefinitions.find(p => p.productCategory === selectedCategory && p.itemName === name);
    if (nameItem) {
      setEditingItem(nameItem.id);
      setEditValue(name);
    }
  };

  const handleDeleteName = async (name: string) => {
    const relatedCount = productDefinitions.filter(p => p.productCategory === selectedCategory && p.itemName === name).length;
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
    const versionItem = productDefinitions.find(p => 
      p.productCategory === selectedCategory && p.itemName === selectedName && p.productVersion === version
    );
    if (versionItem) {
      setEditingItem(versionItem.id);
      setEditValue(version);
    }
  };

  const handleDeleteVersion = (version: string) => {
    const versionItem = productDefinitions.find(p => 
      p.productCategory === selectedCategory && p.itemName === selectedName && p.productVersion === version
    );
    if (versionItem) {
      handleDelete(versionItem.id);
    }
  };

  const renderCategoryStep = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="categorySelect">Select Category</Label>
        <SearchableDropdown
          key={`categories-${productDefinitions.length}`}
          items={categories}
          value={selectedCategory}
          onValueChange={setSelectedCategory}
          placeholder="Select a category"
          onEdit={handleEditCategory}
          onDelete={handleDeleteCategory}
          showActions={true}
        />
      </div>

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

      {editingItem && (
        <div className="p-4 border rounded-lg bg-blue-50">
          <Label>Edit Category</Label>
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );

  const getStepDescription = () => {
    switch (currentStep) {
      case 'category':
        return 'Select an existing category or add a new one to continue to product names.';
      case 'name':
        return 'Select an existing product name or add a new one within the selected category to proceed to version management.';
      case 'version':
        return 'Select an existing version or add new versions for the selected product.';
      default:
        return 'Navigate through the steps to manage your product definitions.';
    }
  };

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
          <DialogDescription>
            {getStepDescription()}
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading product definitions...</span>
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

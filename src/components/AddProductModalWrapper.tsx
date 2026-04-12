
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import AddProductModal from './AddProductModal';

interface AddProductModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddProductModalWrapper = ({ isOpen, onClose }: AddProductModalWrapperProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Add a new product to your inventory with pricing and category information. 
            All pricing will be automatically converted to INR for consistent storage.
          </DialogDescription>
        </DialogHeader>
        <AddProductModal isOpen={true} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
};

export default AddProductModalWrapper;

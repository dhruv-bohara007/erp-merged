
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, Calendar, Building, CreditCard } from 'lucide-react';

interface PurchaseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: any;
}

const PurchaseDetailsModal: React.FC<PurchaseDetailsModalProps> = ({
  isOpen,
  onClose,
  purchase
}) => {
  if (!purchase) return null;

  const formatCurrency = (amount: number) => {
    const symbol = purchase.companyCurrency === 'INR' ? '₹' : '$';
    return `${symbol}${amount.toFixed(2)}`;
  };

  const allItems = purchase.allItems || [];
  const hasMultipleItems = allItems.length > 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Purchase Details - {purchase.purchaseRecordId}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Purchase Summary */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Supplier</p>
                <p className="font-medium">{purchase.supplierName || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Purchase Date</p>
                <p className="font-medium">{purchase.purchaseDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="font-medium text-lg">{formatCurrency(purchase.totalAmount)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge variant="default" className="mt-1">
                {purchase.status}
              </Badge>
            </div>
          </div>

          {/* Items List */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Items ({hasMultipleItems ? allItems.length : 1})
            </h3>
            
            <div className="space-y-4">
              {hasMultipleItems ? (
                allItems.map((item: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium text-gray-900">{item.itemName || 'N/A'}</p>
                        {item.productCategory && (
                          <p className="text-sm text-gray-600">Category: {item.productCategory}</p>
                        )}
                        {item.productVersion && (
                          <p className="text-sm text-gray-600">Version: {item.productVersion}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity || 'N/A'} {item.unit || ''}
                        </p>
                        {item.unitPrice && (
                          <p className="text-sm text-gray-600">
                            Unit Price: {formatCurrency(item.unitPrice)}
                          </p>
                        )}
                        {item.totalPrice && (
                          <p className="font-medium">
                            Total: {formatCurrency(item.totalPrice)}
                          </p>
                        )}
                      </div>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium text-gray-900">{purchase.itemName}</p>
                      {purchase.productCategory && (
                        <p className="text-sm text-gray-600">Category: {purchase.productCategory}</p>
                      )}
                      {purchase.productVersion && (
                        <p className="text-sm text-gray-600">Version: {purchase.productVersion}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        Quantity: {purchase.quantity || 'N/A'} {purchase.unit || ''}
                      </p>
                      <p className="font-medium">
                        Total: {formatCurrency(purchase.totalAmount)}
                      </p>
                    </div>
                  </div>
                  {purchase.description && (
                    <p className="text-sm text-gray-600 mt-2">{purchase.description}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary */}
          {purchase.subtotal && purchase.totalTaxAmount && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Financial Summary</h3>
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(purchase.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax Amount:</span>
                  <span>{formatCurrency(purchase.totalTaxAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(purchase.totalAmount)}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseDetailsModal;

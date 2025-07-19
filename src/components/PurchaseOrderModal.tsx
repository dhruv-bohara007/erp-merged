
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, Mail, Phone, Building } from 'lucide-react';
import { useCompanyData } from '@/hooks/useCompanyData';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';

interface PurchaseOrderModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
}

const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({ order, isOpen, onClose }) => {
  const { companyData } = useCompanyData();
  const { getCurrencyInfo } = useCurrencyConverter();
  
  // Get company currency info
  const companyCountry = companyData?.country || 'US';
  const companyCurrency = getCurrencyInfo(companyCountry);

  // Format currency with company currency symbol
  const formatCurrency = (amount: number) => {
    return `${companyCurrency.symbol}${amount.toFixed(2)}`;
  };

  // Get the correct amount to display based on currency conversion
  const getDisplayAmount = (amount: number) => {
    // Use the company amount from currencyAmounts if available, otherwise use the original amount
    const companyAmount = order.currencyAmounts?.companyAmount || amount;
    return formatCurrency(companyAmount);
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Purchase Order Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Purchase Order Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Purchase Order Number</label>
                  <p className="text-lg font-semibold">{order.purchaseNumber || order.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <label className="text-sm font-medium text-gray-600">Issue Date</label>
                    <p>{order.issueDate ? order.issueDate.toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <label className="text-sm font-medium text-gray-600">Due Date</label>
                    <p>{order.dueDate ? order.dueDate.toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Supplier Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-500" />
                  <div>
                    <label className="text-sm font-medium text-gray-600">Company Name</label>
                    <p className="font-semibold">{order.supplier?.name || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p>{order.supplier?.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p>{order.supplier?.phone || 'N/A'}</p>
                  </div>
                </div>
                {order.supplier?.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                    <div>
                      <label className="text-sm font-medium text-gray-600">Address</label>
                      <p className="text-sm">{order.supplier.address}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Items Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="py-2 font-medium">Description</th>
                      <th className="py-2 font-medium text-center">Quantity</th>
                      <th className="py-2 font-medium text-right">Rate</th>
                      <th className="py-2 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item: any, index: number) => (
                      <tr key={index} className="border-b last:border-b-0">
                        <td className="py-3">
                          <div>
                            <p className="font-medium">{item.description || item.itemName}</p>
                            {item.details && <p className="text-sm text-gray-500">{item.details}</p>}
                          </div>
                        </td>
                        <td className="py-3 text-center">{item.quantity}</td>
                        <td className="py-3 text-right">{getDisplayAmount(item.rate || 0)}</td>
                        <td className="py-3 text-right font-medium">{getDisplayAmount(item.amount || 0)}</td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-gray-500">No items found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Summary Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{getDisplayAmount(order.subtotal || 0)}</span>
                </div>
                {order.taxAmount && order.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Tax ({order.taxRate || 0}%):</span>
                    <span>{getDisplayAmount(order.taxAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Amount:</span>
                  <span>{getDisplayAmount(order.totalAmount || 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes and Terms */}
          {(order.notes || order.terms) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {order.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
                  </CardContent>
                </Card>
              )}
              {order.terms && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Terms & Conditions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{order.terms}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseOrderModal;

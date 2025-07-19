
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, MapPin, Mail, Phone, Building, FileText, Globe } from 'lucide-react';
import { useCompanyData } from '@/hooks/useCompanyData';
import { getCurrencyByCountry } from '@/data/countryCurrencyMapping';
import { countryPhoneCodes } from '@/data/countryPhoneCodes';

interface PurchaseOrderModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
}

const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({ order, isOpen, onClose }) => {
  const { companyData } = useCompanyData();
  
  if (!order) return null;

  // Get company and supplier country info
  const companyCountry = companyData?.country || 'US';
  const supplierCountry = order.supplier?.country || companyCountry;
  
  const companyCurrency = getCurrencyByCountry(companyCountry);
  const supplierCurrency = getCurrencyByCountry(supplierCountry);

  // Format currency with appropriate currency symbol
  const formatCurrency = (amount: number, countryCode: string) => {
    const currencyInfo = getCurrencyByCountry(countryCode);
    return `${currencyInfo.symbol}${amount.toFixed(2)}`;
  };

  // Enhanced function to format phone numbers with proper spacing
  const formatPhoneNumber = (phoneNumber: string, countryCode: string) => {
    if (!phoneNumber) return '';
    
    const countryInfo = countryPhoneCodes[countryCode];
    const code = countryInfo?.code || '';
    
    let cleanPhoneNumber = phoneNumber.replace(/^\+?\d{1,4}\s*/, '').trim();
    
    if (!cleanPhoneNumber) {
      cleanPhoneNumber = phoneNumber;
    }
    
    return `${code} ${cleanPhoneNumber}`.trim();
  };

  // Get the correct amount to display based on currency conversion
  const getDisplayAmount = (amount: number) => {
    // Use the company amount from currencyAmounts if available, otherwise use the original amount
    const companyAmount = order.currencyAmounts?.companyAmount || amount;
    return formatCurrency(companyAmount, companyCountry);
  };

  // Check if dual currency display is needed
  const showDualCurrency = companyCountry !== supplierCountry && order.conversionRate;

  // Get status color for order status
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <FileText className="w-8 h-8 text-primary" />
              <div>
                <DialogTitle className="text-3xl font-bold">Purchase Order</DialogTitle>
                <p className="text-lg text-muted-foreground">#{order.purchaseNumber || order.id}</p>
              </div>
            </div>
            {order.status && (
              <Badge className={`px-3 py-1 text-sm font-medium border ${getStatusColor(order.status)}`}>
                {order.status.toUpperCase()}
              </Badge>
            )}
          </div>
          
          {/* Total Amount Display */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border">
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-primary">
                {getDisplayAmount(order.totalAmount || 0)}
              </p>
              {showDualCurrency && (
                <p className="text-lg text-muted-foreground mt-1">
                  {formatCurrency(order.supplierAmount || 0, supplierCountry)}
                </p>
              )}
            </div>
          </div>

          {/* Dates Section */}
          <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Issue Date</p>
                <p className="text-sm text-muted-foreground">
                  {order.issueDate ? order.issueDate.toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Due Date</p>
                <p className="text-sm text-muted-foreground">
                  {order.dueDate ? order.dueDate.toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Two Column Layout - Company and Supplier Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Information */}
            <Card className="border-2 border-green-200 bg-green-50/50">
              <CardHeader className="bg-gradient-to-r from-green-100 to-green-50 border-b border-green-200">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="w-5 h-5 text-green-600" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2 p-3 bg-background rounded border">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    Contact Details
                  </p>
                  <div className="space-y-1">
                    <p className="font-semibold">{companyData?.companyName || 'Company Name'}</p>
                    {companyData?.streetAddress && <p className="text-sm">{companyData.streetAddress}</p>}
                    {companyData?.city && <p className="text-sm">{companyData.city}</p>}
                    <p className="text-sm"><strong>Country:</strong> {companyCountry}</p>
                    {companyData?.phone && (
                      <p className="text-sm flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span className="font-mono">{formatPhoneNumber(companyData.phone, companyCountry)}</span>
                      </p>
                    )}
                    {companyData?.email && (
                      <p className="text-sm flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {companyData.email}
                      </p>
                    )}
                    {companyData?.website && (
                      <p className="text-sm flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {companyData.website}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Supplier Information */}
            <Card className="border-2 border-yellow-200 bg-yellow-50/50">
              <CardHeader className="bg-gradient-to-r from-yellow-100 to-yellow-50 border-b border-yellow-200">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="w-5 h-5 text-yellow-600" />
                  Supplier Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2 p-3 bg-background rounded border">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    Contact Details
                  </p>
                  <div className="space-y-1">
                    <p className="font-semibold">{order.supplier?.name || 'N/A'}</p>
                    {order.supplier?.address && <p className="text-sm">{order.supplier.address}</p>}
                    {order.supplier?.city && <p className="text-sm">{order.supplier.city}</p>}
                    {order.supplier?.country && <p className="text-sm"><strong>Country:</strong> {order.supplier.country}</p>}
                    {order.supplier?.phone && (
                      <p className="text-sm flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span className="font-mono">{formatPhoneNumber(order.supplier.phone, supplierCountry)}</span>
                      </p>
                    )}
                    {order.supplier?.email && (
                      <p className="text-sm flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {order.supplier.email}
                      </p>
                    )}
                    {order.supplier?.website && (
                      <p className="text-sm flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {order.supplier.website}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Items Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left">Description</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-center">Tax</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items?.length > 0 ? order.items.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="text-left">
                          <div>
                            <p className="font-medium">{item.description || item.itemName}</p>
                            {item.details && <p className="text-sm text-muted-foreground">{item.details}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">{getDisplayAmount(item.rate || 0)}</TableCell>
                        <TableCell className="text-center">{item.taxRate || 0}%</TableCell>
                        <TableCell className="text-right font-medium">{getDisplayAmount(item.amount || 0)}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No items found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Summary Section */}
          <Card className="bg-gradient-to-r from-blue-50 to-blue-25 border-2 border-blue-200">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between text-base">
                  <span>Subtotal:</span>
                  <span>{getDisplayAmount(order.subtotal || 0)}</span>
                </div>
                {showDualCurrency && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal ({supplierCurrency.code}):</span>
                    <span>{formatCurrency(order.supplierSubtotal || 0, supplierCountry)}</span>
                  </div>
                )}
                {order.taxAmount && order.taxAmount > 0 && (
                  <>
                    <div className="flex justify-between text-base">
                      <span>Tax ({order.taxRate || 0}%):</span>
                      <span>{getDisplayAmount(order.taxAmount)}</span>
                    </div>
                    {showDualCurrency && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Tax ({supplierCurrency.code}):</span>
                        <span>{formatCurrency(order.supplierTaxAmount || 0, supplierCountry)}</span>
                      </div>
                    )}
                  </>
                )}
                <Separator className="bg-blue-300" />
                <div className="flex justify-between text-xl font-bold text-blue-900">
                  <span>Total Amount:</span>
                  <span>{getDisplayAmount(order.totalAmount || 0)}</span>
                </div>
                {showDualCurrency && (
                  <div className="flex justify-between text-lg font-semibold text-blue-700">
                    <span>Total ({supplierCurrency.code}):</span>
                    <span>{formatCurrency(order.supplierAmount || 0, supplierCountry)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes and Terms */}
          {(order.notes || order.terms) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {order.notes && (
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-yellow-800">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap text-yellow-900">{order.notes}</p>
                  </CardContent>
                </Card>
              )}
              {order.terms && (
                <Card className="bg-purple-50 border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-purple-800">Terms & Conditions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap text-purple-900">{order.terms}</p>
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

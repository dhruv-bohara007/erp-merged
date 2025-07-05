
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, MapPin, Building, Mail, Phone, Globe } from 'lucide-react';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { useClients } from '@/hooks/useFirestore';
import type { Invoice } from '@/hooks/useFirestore';

interface InvoiceDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
}

const InvoiceDetailsModal = ({ open, onOpenChange, invoice }: InvoiceDetailsModalProps) => {
  const { convertCurrency, formatCurrency, getCurrencyInfo, loading } = useCurrencyConverter();
  const { clients } = useClients();
  const [clientDetails, setClientDetails] = useState<any>(null);

  useEffect(() => {
    if (invoice) {
      const client = clients.find(c => c.id === invoice.clientId);
      setClientDetails(client);
    }
  }, [invoice, clients]);

  if (!invoice) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Assume company is in India (IN) and client country from client details
  const companyCountry = 'IN';
  const clientCountry = clientDetails?.country || 'IN';
  
  const companyCurrency = getCurrencyInfo(companyCountry);
  const clientCurrency = getCurrencyInfo(clientCountry);
  
  // Convert total amount to client currency if different
  const convertedAmount = companyCountry !== clientCountry 
    ? convertCurrency(invoice.totalAmount, companyCountry, clientCountry)
    : invoice.totalAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Invoice Details - {invoice.invoiceNumber}</span>
            <Badge className={getStatusColor(invoice.status)}>
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold text-lg">{invoice.clientName}</h4>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <Mail className="h-4 w-4" />
                  {invoice.clientEmail}
                </div>
              </div>
              
              {clientDetails && (
                <>
                  {clientDetails.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      {clientDetails.phone}
                    </div>
                  )}
                  
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mt-0.5" />
                    <div>
                      {clientDetails.address && <div>{clientDetails.address}</div>}
                      <div>
                        {clientDetails.city && `${clientDetails.city}, `}
                        {clientDetails.state && `${clientDetails.state} `}
                        {clientDetails.pincode}
                      </div>
                      {clientDetails.country && (
                        <div className="flex items-center gap-1 mt-1">
                          <Globe className="h-3 w-3" />
                          {clientDetails.country}
                        </div>
                      )}
                    </div>
                  </div>

                  {clientDetails.taxInfo && clientDetails.taxInfo.id && (
                    <div className="text-sm">
                      <span className="font-medium">{clientDetails.taxInfo.type}:</span> {clientDetails.taxInfo.id}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Invoice Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Issue Date:</span>
                <div className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  {invoice.issueDate.toLocaleDateString()}
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span>Due Date:</span>
                <div className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  {invoice.dueDate.toLocaleDateString()}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(invoice.subtotal, companyCountry)}</span>
                </div>
                
                {invoice.cgst > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>CGST:</span>
                    <span>{formatCurrency(invoice.cgst, companyCountry)}</span>
                  </div>
                )}
                
                {invoice.sgst > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>SGST:</span>
                    <span>{formatCurrency(invoice.sgst, companyCountry)}</span>
                  </div>
                )}
                
                {invoice.igst > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>IGST:</span>
                    <span>{formatCurrency(invoice.igst, companyCountry)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span>Total Tax:</span>
                  <span>{formatCurrency(invoice.totalGst, companyCountry)}</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total Amount ({companyCurrency.code}):</span>
                  <span className="text-green-600">
                    {formatCurrency(invoice.totalAmount, companyCountry)}
                  </span>
                </div>
                
                {companyCountry !== clientCountry && !loading && (
                  <div className="p-3 bg-blue-50 rounded-lg border">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-800">
                        Client Amount ({clientCurrency.code}):
                      </span>
                      <span className="font-semibold text-blue-800">
                        {formatCurrency(convertedAmount, clientCountry)}
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Converted amount for client reference
                    </p>
                  </div>
                )}
                
                {loading && companyCountry !== clientCountry && (
                  <div className="text-sm text-gray-500">
                    Converting to {clientCurrency.name}...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Items */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Description</th>
                    <th className="text-right py-2">Qty</th>
                    <th className="text-right py-2">Rate</th>
                    <th className="text-right py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{item.description}</td>
                      <td className="text-right py-2">{item.quantity}</td>
                      <td className="text-right py-2">{formatCurrency(item.rate, companyCountry)}</td>
                      <td className="text-right py-2">{formatCurrency(item.amount, companyCountry)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Notes and Terms */}
        {(invoice.notes || invoice.terms) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {invoice.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{invoice.notes}</p>
                </CardContent>
              </Card>
            )}
            
            {invoice.terms && (
              <Card>
                <CardHeader>
                  <CardTitle>Terms & Conditions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{invoice.terms}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDetailsModal;

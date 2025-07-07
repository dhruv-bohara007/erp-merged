
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Download } from 'lucide-react';
import { Invoice } from '@/hooks/useFirestore';

interface InvoiceViewProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InvoiceView = ({ invoice, open, onOpenChange }: InvoiceViewProps) => {
  if (!invoice) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownloadPDF = () => {
    // Create a basic PDF content with detailed tax breakdown
    const content = `
INVOICE

Invoice Number: ${invoice.invoiceNumber}
Client: ${invoice.clientName}
Email: ${invoice.clientEmail}
State: ${invoice.clientState || 'N/A'}

Issue Date: ${invoice.issueDate?.toLocaleDateString()}
Due Date: ${invoice.dueDate?.toLocaleDateString()}

Items:
${invoice.items?.map(item => 
  `${item.description} - Qty: ${item.quantity} - Rate: ₹${item.rate} - Amount: ₹${item.amount}`
).join('\n')}

Subtotal: ₹${(invoice.subtotal || 0).toLocaleString()}
${invoice.cgst > 0 ? `CGST: ₹${(invoice.cgst || 0).toLocaleString()}` : ''}
${invoice.sgst > 0 ? `SGST: ₹${(invoice.sgst || 0).toLocaleString()}` : ''}
${invoice.igst > 0 ? `IGST: ₹${(invoice.igst || 0).toLocaleString()}` : ''}
Total Tax: ₹${(invoice.totalGst || 0).toLocaleString()}

TOTAL AMOUNT: ₹${(invoice.totalAmountINR || invoice.totalAmount || 0).toLocaleString()}

Notes: ${invoice.notes || 'N/A'}
Terms: ${invoice.terms || 'N/A'}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${invoice.invoiceNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Invoice Details</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Header */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">Invoice #{invoice.invoiceNumber}</CardTitle>
                  <Badge className={getStatusColor(invoice.status || 'draft')}>
                    {(invoice.status || 'draft').charAt(0).toUpperCase() + (invoice.status || 'draft').slice(1)}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{formatCurrency(invoice.totalAmountINR || invoice.totalAmount || 0)}</p>
                  <p className="text-sm text-gray-500">Total Amount (incl. tax)</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">{invoice.clientName}</p>
                  <p className="text-sm text-gray-600">{invoice.clientEmail}</p>
                  {invoice.clientState && (
                    <p className="text-sm text-gray-600">State: {invoice.clientState}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">Issue Date: {invoice.issueDate?.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">Due Date: {invoice.dueDate?.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoice.items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity} × {formatCurrency(item.rate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(item.amount || 0)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Totals with Tax Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(invoice.subtotal || 0)}</span>
                </div>
                
                {/* Tax Breakdown - only show non-zero tax amounts */}
                {invoice.cgst > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>CGST:</span>
                    <span>{formatCurrency(invoice.cgst || 0)}</span>
                  </div>
                )}
                
                {invoice.sgst > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>SGST:</span>
                    <span>{formatCurrency(invoice.sgst || 0)}</span>
                  </div>
                )}
                
                {invoice.igst > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>IGST:</span>
                    <span>{formatCurrency(invoice.igst || 0)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Total Tax:</span>
                  <span>{formatCurrency(invoice.totalGst || 0)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(invoice.totalAmountINR || invoice.totalAmount || 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes and Terms */}
          {(invoice.notes || invoice.terms) && (
            <Card>
              <CardContent className="pt-6">
                {invoice.notes && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Notes:</h4>
                    <p className="text-sm text-gray-600">{invoice.notes}</p>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <h4 className="font-medium mb-2">Terms & Conditions:</h4>
                    <p className="text-sm text-gray-600">{invoice.terms}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceView;

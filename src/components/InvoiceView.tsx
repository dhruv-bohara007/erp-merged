
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Download, MapPin, Building2, Mail, Globe, FileText } from 'lucide-react';
import type { Invoice } from '@/hooks/useFirestore';

interface InvoiceViewProps {
  invoice: Invoice | null;
}

const InvoiceView = ({ invoice }: InvoiceViewProps) => {
  const [isOpen, setIsOpen] = useState(false);

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
    // Enhanced PDF content with company email, website, and tax info
    const companyTaxInfo = invoice.companyTaxInfo?.primaryType && invoice.companyTaxInfo?.primaryId 
      ? `${invoice.companyTaxInfo.primaryType}: ${invoice.companyTaxInfo.primaryId}` 
      : '';

    const content = `
═══════════════════════════════════════
                INVOICE
═══════════════════════════════════════

Invoice Number: ${invoice.invoiceNumber}
Status: ${(invoice.status || 'draft').toUpperCase()}

COMPANY INFORMATION:
${invoice.companyName}
${invoice.companyEmail ? `Email: ${invoice.companyEmail}` : ''}
${invoice.companyWebsite ? `Website: ${invoice.companyWebsite}` : ''}
${invoice.companyPhone ? `Phone: ${invoice.companyPhone}` : ''}
Address: ${invoice.companyAddress}
${invoice.companyCity ? `City: ${invoice.companyCity}` : ''}
${companyTaxInfo ? `Tax Info: ${companyTaxInfo}` : ''}

CLIENT INFORMATION:
Name: ${invoice.clientName}
Email: ${invoice.clientEmail}
Address: ${invoice.clientAddress}
${invoice.clientPhone ? `Phone: ${invoice.clientPhone}` : ''}

DATES:
Issue Date: ${invoice.issueDate?.toLocaleDateString() || 'N/A'}
Due Date: ${invoice.dueDate?.toLocaleDateString() || 'N/A'}

═══════════════════════════════════════
                ITEMS
═══════════════════════════════════════

${invoice.items?.map((item, index) => 
  `${index + 1}. ${item.description}
     Quantity: ${item.quantity}
     Rate: ₹${(item.rate || 0).toLocaleString()}
     Amount: ₹${(item.amount || 0).toLocaleString()}`
).join('\n\n') || 'No items'}

═══════════════════════════════════════
              PAYMENT SUMMARY
═══════════════════════════════════════

Subtotal: ₹${(invoice.subtotal || 0).toLocaleString()}
${(invoice.cgst || 0) > 0 ? `CGST: ₹${invoice.cgst?.toLocaleString()}` : ''}
${(invoice.sgst || 0) > 0 ? `SGST: ₹${invoice.sgst?.toLocaleString()}` : ''}
${(invoice.igst || 0) > 0 ? `IGST: ₹${invoice.igst?.toLocaleString()}` : ''}
Total Tax: ₹${(invoice.totalGst || 0).toLocaleString()}

TOTAL AMOUNT: ₹${(invoice.totalAmount || 0).toLocaleString()}

${invoice.notes ? `Notes: ${invoice.notes}` : ''}
${invoice.terms ? `Terms & Conditions: ${invoice.terms}` : ''}

Generated on: ${new Date().toLocaleString()}
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

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline" size="sm">
        View Invoice
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle className="text-2xl font-bold">
                Invoice #{invoice.invoiceNumber}
              </DialogTitle>
              <Button onClick={handleDownloadPDF} className="bg-blue-600 hover:bg-blue-700">
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
                    <h1 className="text-3xl font-bold mb-2">Invoice #{invoice.invoiceNumber}</h1>
                    <Badge className={getStatusColor(invoice.status || 'draft')}>
                      {(invoice.status || 'draft').charAt(0).toUpperCase() + (invoice.status || 'draft').slice(1)}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-600">
                      ₹{(invoice.totalAmount || 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">Total Amount</p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Company Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                    {(invoice.companyLogoUrl || invoice.logoUrl) && (
                      <img 
                        src={invoice.companyLogoUrl || invoice.logoUrl} 
                        alt="Company Logo" 
                        className="w-20 h-20 object-contain rounded border shadow-sm"
                      />
                    )}
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold">{invoice.companyName}</h3>
                      {invoice.companyEmail && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>{invoice.companyEmail}</span>
                        </div>
                      )}
                      {invoice.companyWebsite && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Globe className="w-4 h-4" />
                          <a 
                            href={invoice.companyWebsite.startsWith('http') ? invoice.companyWebsite : `https://${invoice.companyWebsite}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {invoice.companyWebsite}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Address
                    </h4>
                    <p className="text-gray-700">
                      {invoice.companyAddress}
                      {invoice.companyCity && <><br />{invoice.companyCity}</>}
                    </p>
                  </div>

                  {invoice.companyTaxInfo?.primaryType && invoice.companyTaxInfo?.primaryId && (
                    <div className="bg-blue-50 p-4 rounded border border-blue-200">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        Tax Information
                      </h4>
                      <p className="text-gray-700 font-mono">
                        {invoice.companyTaxInfo.primaryType}: {invoice.companyTaxInfo.primaryId}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Client Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Client Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold">{invoice.clientName}</h3>
                    <p className="text-gray-600">{invoice.clientEmail}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Address
                    </h4>
                    <p className="text-gray-700">{invoice.clientAddress}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-4 h-4" />
                        Issue Date:
                      </span>
                      <span className="font-semibold">
                        {invoice.issueDate?.toLocaleDateString() || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-4 h-4" />
                        Due Date:
                      </span>
                      <span className="font-semibold">
                        {invoice.dueDate?.toLocaleDateString() || 'N/A'}
                      </span>
                    </div>
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
                <div className="space-y-4">
                  {invoice.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded">
                      <div className="flex-1">
                        <p className="font-semibold">{item.description}</p>
                        <p className="text-sm text-gray-600">
                          Qty: {item.quantity} × ₹{(item.rate || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">₹{(item.amount || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-6" />

                <div className="bg-blue-50 p-6 rounded space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold">₹{(invoice.subtotal || 0).toLocaleString()}</span>
                  </div>
                  
                  {(invoice.cgst || 0) > 0 && (
                    <div className="flex justify-between">
                      <span>CGST:</span>
                      <span className="font-semibold">₹{(invoice.cgst || 0).toLocaleString()}</span>
                    </div>
                  )}
                  
                  {(invoice.sgst || 0) > 0 && (
                    <div className="flex justify-between">
                      <span>SGST:</span>
                      <span className="font-semibold">₹{(invoice.sgst || 0).toLocaleString()}</span>
                    </div>
                  )}
                  
                  {(invoice.igst || 0) > 0 && (
                    <div className="flex justify-between">
                      <span>IGST:</span>
                      <span className="font-semibold">₹{(invoice.igst || 0).toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span>Total Tax:</span>
                    <span className="font-semibold">₹{(invoice.totalGst || 0).toLocaleString()}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Amount:</span>
                    <span className="text-green-600">₹{(invoice.totalAmount || 0).toLocaleString()}</span>
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
                      <h4 className="font-semibold mb-2">Notes:</h4>
                      <p className="text-gray-700">{invoice.notes}</p>
                    </div>
                  )}
                  {invoice.terms && (
                    <div>
                      <h4 className="font-semibold mb-2">Terms & Conditions:</h4>
                      <p className="text-gray-700">{invoice.terms}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InvoiceView;

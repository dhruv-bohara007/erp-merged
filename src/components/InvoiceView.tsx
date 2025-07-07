import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Download, MapPin, Globe, Phone, Building, FileText, CreditCard } from 'lucide-react';
import { Invoice } from '@/hooks/useFirestore';
import { getCurrencyByCountry } from '@/data/countryCurrencyMapping';

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

  // Use the stored country fields from the invoice with fallbacks
  const companyCountry = invoice.companyCountry || 'US';
  const clientCountry = invoice.clientCountry || companyCountry;

  const companyCurrency = getCurrencyByCountry(companyCountry);
  const clientCurrency = getCurrencyByCountry(clientCountry);
  
  const formatCurrency = (amount: number, countryCode: string) => {
    const currencyInfo = getCurrencyByCountry(countryCode);
    return `${currencyInfo.symbol}${amount.toFixed(2)}`;
  };

  const getCountryName = (countryCode: string) => {
    const countryNames: Record<string, string> = {
      'US': 'United States',
      'IN': 'India',
      'GB': 'United Kingdom',
      'DE': 'Germany',
      'FR': 'France',
      'IT': 'Italy',
      'ES': 'Spain',
      'NL': 'Netherlands',
      'CA': 'Canada',
      'AU': 'Australia',
      'JP': 'Japan',
      'CN': 'China',
      'SG': 'Singapore',
      'HK': 'Hong Kong',
      'MX': 'Mexico',
      'BR': 'Brazil',
      'ZA': 'South Africa',
      'AE': 'United Arab Emirates',
      'SA': 'Saudi Arabia',
      'DK': 'Denmark',
      'NO': 'Norway',
      'SE': 'Sweden',
      'CH': 'Switzerland',
    };
    return countryNames[countryCode] || countryCode;
  };

  const showDualCurrency = companyCountry !== clientCountry && 
                           invoice.conversionRate;

  const companyToINRRate = invoice.conversionRate?.companyToINR || 1;
  const INRToClientRate = invoice.conversionRate?.INRToClient || 1;

  const convertCompanyToINR = (amount: number) => amount * companyToINRRate;
  const convertINRToClient = (amountINR: number) => amountINR * INRToClientRate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
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
                  {showDualCurrency ? (
                    <div>
                      <p className="text-2xl font-bold">
                        {formatCurrency(invoice.companyAmount || invoice.totalAmount || 0, companyCountry)}
                      </p>
                      <p className="text-lg text-gray-600">
                        {formatCurrency(invoice.clientAmount || convertINRToClient(invoice.totalAmountINR || 0), clientCountry)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Company ({companyCurrency.code}) / Client ({clientCurrency.code})
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-2xl font-bold">
                        {formatCurrency(invoice.totalAmountINR || invoice.totalAmount || 0, companyCountry)}
                      </p>
                      <p className="text-sm text-gray-500">Total Amount (incl. tax)</p>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  {invoice.logoUrl && (
                    <img 
                      src={invoice.logoUrl} 
                      alt="Company Logo" 
                      className="w-16 h-16 object-contain rounded"
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">{invoice.companyName}</h3>
                    {invoice.companyPhone && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {invoice.companyPhone}
                      </p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Address
                  </h4>
                  <p className="text-sm text-gray-600">
                    {invoice.companyAddress}
                    {invoice.companyCity && <><br />{invoice.companyCity}</>}
                    <br />
                    {getCountryName(companyCountry)}
                  </p>
                </div>

                {invoice.companyTaxInfo && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Tax Information
                    </h4>
                    <p className="text-sm text-gray-600">
                      GSTIN: {invoice.companyTaxInfo.gstin}
                      {invoice.companyTaxInfo.pan && (
                        <><br />PAN: {invoice.companyTaxInfo.pan}</>
                      )}
                    </p>
                  </div>
                )}

                {invoice.bankInfo && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Bank Information
                    </h4>
                    <p className="text-sm text-gray-600">
                      {JSON.stringify(invoice.bankInfo)}
                    </p>
                  </div>
                )}

                {invoice.signatureUrl && (
                  <div>
                    <h4 className="font-medium mb-2">Digital Signature</h4>
                    <img 
                      src={invoice.signatureUrl} 
                      alt="Digital Signature" 
                      className="max-w-32 h-16 object-contain border rounded"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg">{invoice.clientName}</h4>
                    <p className="text-sm text-gray-600">{invoice.clientEmail}</p>
                    {invoice.clientPhone && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {invoice.clientPhone}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-gray-600">
                        {invoice.clientAddress && (
                          <p>{invoice.clientAddress}</p>
                        )}
                        {invoice.clientState && (
                          <p>State: {invoice.clientState}</p>
                        )}
                        {invoice.clientPincode && (
                          <p>Pincode: {invoice.clientPincode}</p>
                        )}
                        {!invoice.clientAddress && !invoice.clientState && !invoice.clientPincode && (
                          <p>Address information not available</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Globe className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-gray-600">
                        <p>Country: {getCountryName(clientCountry)} ({clientCurrency.code})</p>
                      </div>
                    </div>

                    {invoice.clientTaxInfo && (
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-gray-600">
                          <p>{invoice.clientTaxInfo.type}: {invoice.clientTaxInfo.id}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-right space-y-2">
                    <div className="flex items-center justify-end gap-2">
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
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Invoice Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoice.items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-gray-600">
                        Qty: {item.quantity} × {formatCurrency(item.rate || 0, companyCountry)} (Item Price)
                        {showDualCurrency && (
                          <span className="text-gray-500 ml-1">
                            ({formatCurrency(convertINRToClient(convertCompanyToINR(item.rate || 0)), clientCountry)})
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(item.amount || 0, companyCountry)}
                      </p>
                      {showDualCurrency && (
                        <p className="text-sm text-gray-600">
                          {formatCurrency(convertINRToClient(convertCompanyToINR(item.amount || 0)), clientCountry)}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">Line Total</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal (Company - {companyCurrency.code}):</span>
                  <div className="text-right">
                    <span>{formatCurrency(invoice.subtotal || 0, companyCountry)}</span>
                  </div>
                </div>
                
                {showDualCurrency && (
                  <div className="flex justify-between">
                    <span>Subtotal (Client - {clientCurrency.code}):</span>
                    <div className="text-right">
                      <span>{formatCurrency(convertINRToClient(convertCompanyToINR(invoice.subtotal || 0)), clientCountry)}</span>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Total Tax (Company - {companyCurrency.code}):</span>
                  <span>{formatCurrency(invoice.totalGst || 0, companyCountry)}</span>
                </div>
                
                {showDualCurrency && (
                  <div className="flex justify-between">
                    <span>Total Tax (Client - {clientCurrency.code}):</span>
                    <span>{formatCurrency(convertINRToClient(convertCompanyToINR(invoice.totalGst || 0)), clientCountry)}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Amount (Company - {companyCurrency.code}):</span>
                  <span>{formatCurrency(invoice.companyAmount || invoice.totalAmount || 0, companyCountry)}</span>
                </div>
                
                {showDualCurrency && (
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Amount (Client - {clientCurrency.code}):</span>
                    <span>{formatCurrency(invoice.clientAmount || convertINRToClient(invoice.totalAmountINR || 0), clientCountry)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

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

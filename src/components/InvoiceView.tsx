
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Download, MapPin, Globe } from 'lucide-react';
import { Invoice } from '@/hooks/useFirestore';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';

interface InvoiceViewProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InvoiceView = ({ invoice, open, onOpenChange }: InvoiceViewProps) => {
  const { getCurrencyInfo } = useCurrencyConverter();

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

  // Get currency information from invoice data
  const companyCurrency = invoice.companyCurrency ? getCurrencyInfo(invoice.companyCurrency) : getCurrencyInfo('IN');
  const clientCurrency = invoice.clientCurrency ? getCurrencyInfo(invoice.clientCurrency) : companyCurrency;
  
  // Format currency with proper symbols and locale
  const formatCurrency = (amount: number, currencyCode: string) => {
    const currencyInfo = getCurrencyInfo(currencyCode);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyInfo.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Convert amount using stored exchange rate
  const convertToINR = (amount: number) => {
    if (invoice.conversionRate?.companyToINR) {
      return amount * invoice.conversionRate.companyToINR;
    }
    return amount;
  };

  // Get client's country name from country code
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
    };
    return countryNames[countryCode] || countryCode;
  };

  // Determine if we should show dual currency display
  const showDualCurrency = invoice.companyCurrency && invoice.companyCurrency !== 'IN' && invoice.conversionRate?.companyToINR;

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
                  <CardTitle className="text-xl">Invoice #{invoke.invoiceNumber}</CardTitle>
                  <Badge className={getStatusColor(invoice.status || 'draft')}>
                    {(invoice.status || 'draft').charAt(0).toUpperCase() + (invoice.status || 'draft').slice(1)}
                  </Badge>
                </div>
                <div className="text-right">
                  {showDualCurrency ? (
                    <div>
                      <p className="text-2xl font-bold">
                        {formatCurrency(invoice.totalAmount || 0, invoice.companyCurrency || 'IN')}
                      </p>
                      <p className="text-lg text-gray-600">
                        {formatCurrency(convertToINR(invoice.totalAmount || 0), 'IN')}
                      </p>
                      <p className="text-sm text-gray-500">Company Currency / INR</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-2xl font-bold">
                        {formatCurrency(invoice.totalAmountINR || invoice.totalAmount || 0, 'IN')}
                      </p>
                      <p className="text-sm text-gray-500">Total Amount (incl. tax)</p>
                    </div>
                  )}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-lg">{invoice.clientName}</h4>
                    <p className="text-sm text-gray-600">{invoice.clientEmail}</p>
                  </div>
                  
                  {/* Full Address Section */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-gray-600">
                        {invoice.clientAddress && (
                          <>
                            <p>{invoice.clientAddress}</p>
                            <p>
                              {invoice.clientCity && `${invoice.clientCity}, `}
                              {invoice.clientState && `${invoice.clientState} `}
                              {invoice.clientPincode}
                            </p>
                          </>
                        )}
                        {!invoice.clientAddress && invoice.clientState && (
                          <p>State: {invoice.clientState}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Globe className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-gray-600">
                        <p>Country: {invoice.clientCountry ? getCountryName(invoice.clientCountry) : 'Not specified'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Currency Information */}
                  {showDualCurrency && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">Currency Information</p>
                      <p className="text-xs text-blue-700">
                        Company: {companyCurrency.name} ({companyCurrency.code})
                      </p>
                      <p className="text-xs text-blue-700">
                        Client: {clientCurrency.name} ({clientCurrency.code})
                      </p>
                      {invoice.conversionRate?.companyToINR && (
                        <p className="text-xs text-blue-700">
                          Exchange Rate: 1 {companyCurrency.code} = ₹{invoice.conversionRate.companyToINR.toFixed(4)}
                        </p>
                      )}
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

          {/* Invoice Items */}
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
                        Qty: {item.quantity} × {showDualCurrency ? 
                          formatCurrency(item.rate || 0, invoice.companyCurrency || 'IN') : 
                          formatCurrency(item.rate || 0, 'IN')
                        }
                      </p>
                    </div>
                    <div className="text-right">
                      {showDualCurrency ? (
                        <div>
                          <p className="font-medium">
                            {formatCurrency(item.amount || 0, invoice.companyCurrency || 'IN')}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(convertToINR(item.amount || 0), 'IN')}
                          </p>
                        </div>
                      ) : (
                        <p className="font-medium">{formatCurrency(item.amount || 0, 'IN')}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Totals with Tax Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <div className="text-right">
                    {showDualCurrency ? (
                      <div>
                        <span>{formatCurrency(invoice.subtotal || 0, invoice.companyCurrency || 'IN')}</span>
                        <div className="text-sm text-gray-600">
                          {formatCurrency(convertToINR(invoice.subtotal || 0), 'IN')}
                        </div>
                      </div>
                    ) : (
                      <span>{formatCurrency(invoice.subtotal || 0, 'IN')}</span>
                    )}
                  </div>
                </div>
                
                {/* Tax Breakdown - only show non-zero tax amounts */}
                {invoice.cgst > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>CGST:</span>
                    <div className="text-right">
                      {showDualCurrency ? (
                        <div>
                          <span>{formatCurrency(invoice.cgst || 0, invoice.companyCurrency || 'IN')}</span>
                          <div className="text-xs text-gray-600">
                            {formatCurrency(convertToINR(invoice.cgst || 0), 'IN')}
                          </div>
                        </div>
                      ) : (
                        <span>{formatCurrency(invoice.cgst || 0, 'IN')}</span>
                      )}
                    </div>
                  </div>
                )}
                
                {invoice.sgst > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>SGST:</span>
                    <div className="text-right">
                      {showDualCurrency ? (
                        <div>
                          <span>{formatCurrency(invoice.sgst || 0, invoice.companyCurrency || 'IN')}</span>
                          <div className="text-xs text-gray-600">
                            {formatCurrency(convertToINR(invoice.sgst || 0), 'IN')}
                          </div>
                        </div>
                      ) : (
                        <span>{formatCurrency(invoice.sgst || 0, 'IN')}</span>
                      )}
                    </div>
                  </div>
                )}
                
                {invoice.igst > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>IGST:</span>
                    <div className="text-right">
                      {showDualCurrency ? (
                        <div>
                          <span>{formatCurrency(invoice.igst || 0, invoice.companyCurrency || 'IN')}</span>
                          <div className="text-xs text-gray-600">
                            {formatCurrency(convertToINR(invoice.igst || 0), 'IN')}
                          </div>
                        </div>
                      ) : (
                        <span>{formatCurrency(invoice.igst || 0, 'IN')}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Sales Tax for non-Indian companies */}
                {invoice.salesTax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Sales Tax:</span>
                    <div className="text-right">
                      {showDualCurrency ? (
                        <div>
                          <span>{formatCurrency(invoice.salesTax || 0, invoice.companyCurrency || 'IN')}</span>
                          <div className="text-xs text-gray-600">
                            {formatCurrency(convertToINR(invoice.salesTax || 0), 'IN')}
                          </div>
                        </div>
                      ) : (
                        <span>{formatCurrency(invoice.salesTax || 0, 'IN')}</span>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Total Tax:</span>
                  <div className="text-right">
                    {showDualCurrency ? (
                      <div>
                        <span>{formatCurrency(invoice.totalGst || invoice.salesTax || 0, invoice.companyCurrency || 'IN')}</span>
                        <div className="text-sm text-gray-600">
                          {formatCurrency(convertToINR(invoice.totalGst || invoice.salesTax || 0), 'IN')}
                        </div>
                      </div>
                    ) : (
                      <span>{formatCurrency(invoice.totalGst || invoice.salesTax || 0, 'IN')}</span>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Amount:</span>
                  <div className="text-right">
                    {showDualCurrency ? (
                      <div>
                        <span>{formatCurrency(invoice.totalAmount || 0, invoice.companyCurrency || 'IN')}</span>
                        <div className="text-base text-gray-700 font-semibold">
                          {formatCurrency(convertToINR(invoice.totalAmount || 0), 'IN')}
                        </div>
                      </div>
                    ) : (
                      <span>{formatCurrency(invoice.totalAmountINR || invoice.totalAmount || 0, 'IN')}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tax Information Summary */}
              {(invoice.companyCurrency || invoice.cgst > 0 || invoice.igst > 0 || invoice.salesTax > 0) && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Tax Information</h4>
                  <p className="text-xs text-gray-600">
                    {invoice.companyCurrency === 'IN' || (!invoice.companyCurrency && (invoice.cgst > 0 || invoice.igst > 0)) ? 
                      `GST based on company location (${getCountryName('IN')})` :
                      `Sales Tax based on company location (${getCountryName(invoice.companyCurrency || 'US')})`
                    }
                  </p>
                  {invoice.conversionRate?.companyToINR && (
                    <p className="text-xs text-gray-600 mt-1">
                      Exchange rates: 1 {companyCurrency.code} = ₹{invoice.conversionRate.companyToINR.toFixed(4)}
                    </p>
                  )}
                </div>
              )}
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

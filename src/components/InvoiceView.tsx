
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
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'sent': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleDownloadPDF = () => {
    const content = `
═══════════════════════════════════════
                INVOICE
═══════════════════════════════════════

Invoice Number: ${invoice.invoiceNumber}
Status: ${(invoice.status || 'draft').toUpperCase()}

Company: ${invoice.companyName}
Address: ${invoice.companyAddress}
${invoice.companyPhone ? `Phone: ${invoice.companyPhone}` : ''}

Client Information:
Name: ${invoice.clientName}
Email: ${invoice.clientEmail}
Address: ${invoice.clientAddress || 'N/A'}
${invoice.clientPhone ? `Phone: ${invoice.clientPhone}` : ''}

Dates:
Issue Date: ${invoice.issueDate?.toLocaleDateString() || 'N/A'}
Due Date: ${invoice.dueDate?.toLocaleDateString() || 'N/A'}

═══════════════════════════════════════
                ITEMS
═══════════════════════════════════════

${invoice.items?.map((item, index) => 
  `${index + 1}. ${item.description}
     Quantity: ${item.quantity}
     Rate: ${(item.rate || 0).toLocaleString()}
     Amount: ${(item.amount || 0).toLocaleString()}`
).join('\n\n') || 'No items'}

═══════════════════════════════════════
              PAYMENT SUMMARY
═══════════════════════════════════════

Subtotal: ${(invoice.subtotal || 0).toLocaleString()}
${(invoice.cgst || 0) > 0 ? `CGST: ${invoice.cgst?.toLocaleString()}` : ''}
${(invoice.sgst || 0) > 0 ? `SGST: ${invoice.sgst?.toLocaleString()}` : ''}
${(invoice.igst || 0) > 0 ? `IGST: ${invoice.igst?.toLocaleString()}` : ''}
Total Tax: ${(invoice.totalGst || 0).toLocaleString()}

TOTAL AMOUNT: ${(invoice.totalAmountINR || invoice.totalAmount || 0).toLocaleString()}

${invoice.companyTaxInfo?.gstin ? `Company GSTIN: ${invoice.companyTaxInfo.gstin}` : ''}
${invoice.clientTaxInfo?.id ? `Client Tax ID: ${invoice.clientTaxInfo.id} (${invoice.clientTaxInfo.type || 'N/A'})` : ''}

${invoice.bankInfo ? `
Bank Information:
${(invoice.bankInfo as any)?.bankName ? `Bank Name: ${(invoice.bankInfo as any).bankName}` : ''}
${(invoice.bankInfo as any)?.accountNumber ? `Account Number: ${(invoice.bankInfo as any).accountNumber}` : ''}
${(invoice.bankInfo as any)?.routingCode || (invoice.bankInfo as any)?.ifscCode ? `Routing Code: ${(invoice.bankInfo as any)?.routingCode || (invoice.bankInfo as any)?.ifscCode}` : ''}` : ''}

${invoice.notes ? `Notes: ${invoice.notes}` : ''}
${invoice.terms ? `Terms & Conditions: ${invoice.terms}` : ''}

Generated on: ${new Date().toLocaleString()}
    `;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
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

  // Force re-render key to ensure changes are visible
  const modalKey = `invoice-view-${invoice.id}-${Date.now()}`;

  return (
    <Dialog key={modalKey} open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto bg-white">
        <DialogHeader className="border-b border-gray-200 pb-6">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-3xl font-bold text-gray-900">
              Invoice Details
            </DialogTitle>
            <Button
              onClick={handleDownloadPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2 font-semibold"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-8 p-4">
          {/* Invoice Header */}
          <Card className="border-2 border-gray-200 shadow-xl rounded-xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b-2 border-gray-200 rounded-t-xl">
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <h1 className="text-4xl font-bold text-gray-900 mb-3">
                    Invoice #{invoice.invoiceNumber}
                  </h1>
                  <Badge className={`${getStatusColor(invoice.status || 'draft')} px-4 py-2 text-base font-semibold border-2 rounded-full`}>
                    {(invoice.status || 'draft').charAt(0).toUpperCase() + (invoice.status || 'draft').slice(1)}
                  </Badge>
                </div>
                <div className="text-right">
                  {showDualCurrency ? (
                    <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-lg">
                      <p className="text-4xl font-bold text-green-600 mb-2">
                        {formatCurrency(invoice.companyAmount || invoice.totalAmount || 0, companyCountry)}
                      </p>
                      <p className="text-2xl text-gray-600 mb-3">
                        {formatCurrency(invoice.clientAmount || convertINRToClient(invoice.totalAmountINR || 0), clientCountry)}
                      </p>
                      <p className="text-sm text-gray-500 font-medium">
                        Company ({companyCurrency.code}) / Client ({clientCurrency.code})
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-lg">
                      <p className="text-4xl font-bold text-green-600 mb-2">
                        {formatCurrency(invoice.totalAmountINR || invoice.totalAmount || 0, companyCountry)}
                      </p>
                      <p className="text-sm text-gray-500 font-medium">Total Amount</p>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Company Information */}
            <Card className="border-2 border-gray-200 shadow-xl rounded-xl">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-gray-200 rounded-t-xl">
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                  <Building className="w-6 h-6 text-green-600" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="flex items-center gap-6">
                  {invoice.logoUrl && (
                    <img 
                      src={invoice.logoUrl} 
                      alt="Company Logo" 
                      className="w-24 h-24 object-contain rounded-xl border-2 border-gray-200 shadow-md"
                    />
                  )}
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900">{invoice.companyName}</h3>
                    {invoice.companyPhone && (
                      <p className="text-gray-600 text-lg flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {invoice.companyPhone}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h4 className="font-bold mb-4 flex items-center gap-3 text-gray-900 text-lg">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    Address
                  </h4>
                  <p className="text-gray-700 leading-relaxed text-base">
                    {invoice.companyAddress}
                    {invoice.companyCity && <><br />{invoice.companyCity}</>}
                    <br />
                    {getCountryName(companyCountry)}
                  </p>
                </div>

                {/* Enhanced Tax Information with proper GSTIN display */}
                {invoice.companyTaxInfo && (
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                    <h4 className="font-bold mb-4 flex items-center gap-3 text-gray-900 text-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Tax Information
                    </h4>
                    {invoice.companyTaxInfo.gstin && (
                      <div className="mb-4 p-3 bg-white rounded-lg border">
                        <span className="font-semibold text-gray-700 text-base">GSTIN: </span>
                        <span className="text-gray-900 font-mono bg-gray-100 px-3 py-1 rounded border text-lg">
                          {invoice.companyTaxInfo.gstin}
                        </span>
                      </div>
                    )}
                    {invoice.companyTaxInfo.pan && (
                      <div className="p-3 bg-white rounded-lg border">
                        <span className="font-semibold text-gray-700 text-base">PAN: </span>
                        <span className="text-gray-900 font-mono bg-gray-100 px-3 py-1 rounded border text-lg">
                          {invoice.companyTaxInfo.pan}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Enhanced Bank Information - Professional Table Format */}
                {invoice.bankInfo && (
                  <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                    <h4 className="font-bold mb-4 flex items-center gap-3 text-gray-900 text-lg">
                      <CreditCard className="w-5 h-5 text-green-600" />
                      Bank Information
                    </h4>
                    <div className="bg-white rounded-lg border-2 border-gray-200 shadow-sm overflow-hidden">
                      <table className="w-full">
                        <tbody>
                          {(invoice.bankInfo as any)?.bankName && (
                            <tr className="border-b border-gray-100">
                              <td className="px-4 py-3 font-semibold text-gray-700 bg-gray-50 w-1/3">Bank Name</td>
                              <td className="px-4 py-3 text-gray-900 font-medium">{(invoice.bankInfo as any).bankName}</td>
                            </tr>
                          )}
                          {(invoice.bankInfo as any)?.accountNumber && (
                            <tr className="border-b border-gray-100">
                              <td className="px-4 py-3 font-semibold text-gray-700 bg-gray-50">Account Number</td>
                              <td className="px-4 py-3 text-gray-900 font-mono text-lg">{(invoice.bankInfo as any).accountNumber}</td>
                            </tr>
                          )}
                          {((invoice.bankInfo as any)?.routingCode || (invoice.bankInfo as any)?.ifscCode) && (
                            <tr>
                              <td className="px-4 py-3 font-semibold text-gray-700 bg-gray-50">Routing Code</td>
                              <td className="px-4 py-3 text-gray-900 font-mono text-lg">
                                {(invoice.bankInfo as any)?.routingCode || (invoice.bankInfo as any)?.ifscCode}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {invoice.signatureUrl && (
                  <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                    <h4 className="font-bold mb-4 text-gray-900 text-lg">Digital Signature</h4>
                    <img 
                      src={invoice.signatureUrl} 
                      alt="Digital Signature" 
                      className="max-w-48 h-24 object-contain border-2 rounded-lg bg-white p-3 shadow-sm"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card className="border-2 border-gray-200 shadow-xl rounded-xl">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b-2 border-gray-200 rounded-t-xl">
                <CardTitle className="text-xl font-bold text-gray-900">Client Information</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{invoice.clientName}</h3>
                  <p className="text-gray-600 text-lg">{invoice.clientEmail}</p>
                  {invoice.clientPhone && (
                    <p className="text-gray-600 text-lg flex items-center gap-2 mt-2">
                      <Phone className="w-4 h-4" />
                      {invoice.clientPhone}
                    </p>
                  )}
                </div>
                
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h4 className="font-bold mb-4 flex items-center gap-3 text-gray-900 text-lg">
                    <MapPin className="w-5 h-5 text-orange-600" />
                    Address
                  </h4>
                  <div className="text-gray-700 leading-relaxed text-base">
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
                
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                  <h4 className="font-bold mb-4 flex items-center gap-3 text-gray-900 text-lg">
                    <Globe className="w-5 h-5 text-blue-600" />
                    Country & Currency
                  </h4>
                  <div className="text-gray-700 text-base">
                    <p>Country: {getCountryName(clientCountry)} ({clientCurrency.code})</p>
                  </div>
                </div>

                {/* Enhanced Client Tax Information - Properly display clientTaxInfo.id */}
                {invoice.clientTaxInfo && (
                  <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                    <h4 className="font-bold mb-4 flex items-center gap-3 text-gray-900 text-lg">
                      <FileText className="w-5 h-5 text-yellow-600" />
                      Tax Information
                    </h4>
                    {invoice.clientTaxInfo.id && (
                      <div className="p-3 bg-white rounded-lg border">
                        <span className="font-semibold text-gray-700 text-base">
                          {invoice.clientTaxInfo.type || 'Tax ID'}: 
                        </span>
                        <span className="ml-2 text-gray-900 font-mono bg-gray-100 px-3 py-1 rounded border text-lg">
                          {invoice.clientTaxInfo.id}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-3 text-gray-700 font-medium text-base">
                      <Calendar className="w-5 h-5" />
                      Issue Date:
                    </span>
                    <span className="font-semibold text-gray-900 text-base">
                      {invoice.issueDate?.toLocaleDateString() || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-3 text-gray-700 font-medium text-base">
                      <Calendar className="w-5 h-5" />
                      Due Date:
                    </span>
                    <span className="font-semibold text-gray-900 text-base">
                      {invoice.dueDate?.toLocaleDateString() || 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Items */}
          <Card className="border-2 border-gray-200 shadow-xl rounded-xl">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-gray-200 rounded-t-xl">
              <CardTitle className="text-xl font-bold text-gray-900">Invoice Items</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                {invoice.items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 shadow-sm">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-lg mb-2">{item.description}</p>
                      <p className="text-gray-600 text-base">
                        Qty: <span className="font-semibold">{item.quantity}</span> × {formatCurrency(item.rate || 0, companyCountry)} (Item Price)
                        {showDualCurrency && (
                          <span className="text-gray-500 ml-1">
                            ({formatCurrency(convertINRToClient(convertCompanyToINR(item.rate || 0)), clientCountry)})
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-2xl text-green-600">
                        {formatCurrency(item.amount || 0, companyCountry)}
                      </p>
                      {showDualCurrency && (
                        <p className="text-lg text-gray-600">
                          {formatCurrency(convertINRToClient(convertCompanyToINR(item.amount || 0)), clientCountry)}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">Line Total</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-8 bg-gray-400 h-0.5" />

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl border-2 border-blue-200 space-y-4">
                <div className="flex justify-between text-gray-700 text-lg">
                  <span className="font-semibold">Subtotal (Company - {companyCurrency.code}):</span>
                  <span className="font-bold">{formatCurrency(invoice.subtotal || 0, companyCountry)}</span>
                </div>
                
                {showDualCurrency && (
                  <div className="flex justify-between text-gray-700 text-lg">
                    <span className="font-semibold">Subtotal (Client - {clientCurrency.code}):</span>
                    <span className="font-bold">{formatCurrency(convertINRToClient(convertCompanyToINR(invoice.subtotal || 0)), clientCountry)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-gray-700 text-lg">
                  <span className="font-semibold">Total Tax (Company - {companyCurrency.code}):</span>
                  <span className="font-bold">{formatCurrency(invoice.totalGst || 0, companyCountry)}</span>
                </div>
                
                {showDualCurrency && (
                  <div className="flex justify-between text-gray-700 text-lg">
                    <span className="font-semibold">Total Tax (Client - {clientCurrency.code}):</span>
                    <span className="font-bold">{formatCurrency(convertINRToClient(convertCompanyToINR(invoice.totalGst || 0)), clientCountry)}</span>
                  </div>
                )}
                
                <Separator className="bg-gray-500 h-0.5" />
                
                <div className="flex justify-between font-bold text-2xl text-green-700">
                  <span>Total Amount (Company - {companyCurrency.code}):</span>
                  <span>{formatCurrency(invoice.companyAmount || invoice.totalAmount || 0, companyCountry)}</span>
                </div>
                
                {showDualCurrency && (
                  <div className="flex justify-between font-bold text-2xl text-green-700">
                    <span>Total Amount (Client - {clientCurrency.code}):</span>
                    <span>{formatCurrency(invoice.clientAmount || convertINRToClient(invoice.totalAmountINR || 0), clientCountry)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes and Terms */}
          {(invoice.notes || invoice.terms) && (
            <Card className="border-2 border-gray-200 shadow-xl rounded-xl">
              <CardContent className="p-8">
                {invoice.notes && (
                  <div className="mb-8 bg-blue-50 p-6 rounded-xl border border-blue-200">
                    <h4 className="font-bold mb-4 text-gray-900 text-lg">Notes:</h4>
                    <p className="text-gray-700 leading-relaxed text-base">{invoice.notes}</p>
                  </div>
                )}
                {invoice.terms && (
                  <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                    <h4 className="font-bold mb-4 text-gray-900 text-lg">Terms & Conditions:</h4>
                    <p className="text-gray-700 leading-relaxed text-base">{invoice.terms}</p>
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

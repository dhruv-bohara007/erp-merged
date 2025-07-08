
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

  const handleDownloadPDF = async () => {
    try {
      // Create a more comprehensive HTML content for PDF conversion
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .company-info, .client-info { width: 45%; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .items-table th { background-color: #f5f5f5; font-weight: bold; }
            .totals { text-align: right; margin-top: 20px; }
            .total-row { font-weight: bold; font-size: 1.2em; }
            h1, h2, h3 { color: #333; }
            .status { padding: 5px 10px; border-radius: 5px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>INVOICE</h1>
            <h2>Invoice #${invoice.invoiceNumber}</h2>
            <span class="status">${(invoice.status || 'draft').toUpperCase()}</span>
          </div>
          
          <div class="invoice-info">
            <div class="company-info">
              <h3>Company Information</h3>
              <p><strong>${invoice.companyName}</strong></p>
              <p>${invoice.companyAddress}</p>
              ${invoice.companyPhone ? `<p>Phone: ${invoice.companyPhone}</p>` : ''}
              ${invoice.companyTaxInfo?.gstin ? `<p>GSTIN: ${invoice.companyTaxInfo.gstin}</p>` : ''}
              ${invoice.companyTaxInfo?.pan ? `<p>PAN: ${invoice.companyTaxInfo.pan}</p>` : ''}
            </div>
            
            <div class="client-info">
              <h3>Client Information</h3>
              <p><strong>${invoice.clientName}</strong></p>
              <p>${invoice.clientEmail}</p>
              <p>${invoice.clientAddress}</p>
              ${invoice.clientPhone ? `<p>Phone: ${invoice.clientPhone}</p>` : ''}
              ${invoice.clientTaxInfo?.id ? `<p>${invoice.clientTaxInfo.type || 'Tax ID'}: ${invoice.clientTaxInfo.id}</p>` : ''}
            </div>
          </div>
          
          <p><strong>Issue Date:</strong> ${invoice.issueDate?.toLocaleDateString() || 'N/A'}</p>
          <p><strong>Due Date:</strong> ${invoice.dueDate?.toLocaleDateString() || 'N/A'}</p>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items?.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>${formatCurrency(item.rate || 0, companyCountry)}</td>
                  <td>${formatCurrency(item.amount || 0, companyCountry)}</td>
                </tr>
              `).join('') || '<tr><td colspan="4">No items</td></tr>'}
            </tbody>
          </table>
          
          <div class="totals">
            <p>Subtotal: ${formatCurrency(invoice.subtotal || 0, companyCountry)}</p>
            <p>Total Tax: ${formatCurrency(invoice.totalGst || 0, companyCountry)}</p>
            <p class="total-row">Total Amount: ${formatCurrency(invoice.companyAmount || invoice.totalAmount || 0, companyCountry)}</p>
          </div>
          
          ${invoice.notes ? `<div><h3>Notes:</h3><p>${invoice.notes}</p></div>` : ''}
          ${invoice.terms ? `<div><h3>Terms & Conditions:</h3><p>${invoice.terms}</p></div>` : ''}
          
          <p><em>Generated on: ${new Date().toLocaleString()}</em></p>
        </body>
        </html>
      `;

      // Create a new window for printing/PDF generation
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Wait a moment for content to load, then trigger print
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      } else {
        // Fallback: create a blob and download as HTML
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice-${invoice.invoiceNumber}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to text download if PDF generation fails
      const content = `Invoice #${invoice.invoiceNumber}\nCompany: ${invoice.companyName}\nClient: ${invoice.clientName}\nTotal: ${formatCurrency(invoice.companyAmount || invoice.totalAmount || 0, companyCountry)}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${invoice.invoiceNumber}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
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

                {/* Enhanced Tax Information - Properly fetch from companyTaxInfo */}
                {invoice.companyTaxInfo && (
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                    <h4 className="font-bold mb-4 flex items-center gap-3 text-gray-900 text-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Tax Information
                    </h4>
                    <div className="space-y-3">
                      {invoice.companyTaxInfo.gstin && (
                        <div className="p-3 bg-white rounded-lg border">
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

                {/* Business Owner Signature - Updated heading */}
                {invoice.signatureUrl && (
                  <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                    <h4 className="font-bold mb-4 text-gray-900 text-lg">Business Owner Signature</h4>
                    <img 
                      src={invoice.signatureUrl} 
                      alt="Business Owner Signature" 
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

          {/* Invoice Items - Enhanced Table Format */}
          <Card className="border-2 border-gray-200 shadow-xl rounded-xl">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-gray-200 rounded-t-xl">
              <CardTitle className="text-xl font-bold text-gray-900">Invoice Items</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-bold text-gray-900">Description</TableHead>
                      <TableHead className="font-bold text-gray-900 text-center">Quantity</TableHead>
                      <TableHead className="font-bold text-gray-900 text-right">Rate</TableHead>
                      <TableHead className="font-bold text-gray-900 text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items?.map((item, index) => (
                      <TableRow key={index} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-900">
                          {item.description}
                        </TableCell>
                        <TableCell className="text-center text-gray-700">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right text-gray-700">
                          {formatCurrency(item.rate || 0, companyCountry)}
                          {showDualCurrency && (
                            <div className="text-sm text-gray-500">
                              ({formatCurrency(convertINRToClient(convertCompanyToINR(item.rate || 0)), clientCountry)})
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          {formatCurrency(item.amount || 0, companyCountry)}
                          {showDualCurrency && (
                            <div className="text-sm text-gray-500">
                              ({formatCurrency(convertINRToClient(convertCompanyToINR(item.amount || 0)), clientCountry)})
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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

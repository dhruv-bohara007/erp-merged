
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Download, Building, MapPin, Mail, Globe, FileText } from 'lucide-react';
import { Invoice } from '@/hooks/useFirestore';
import { getCurrencyByCountry } from '@/data/countryCurrencyMapping';

interface InvoiceViewProps {
  invoice: Invoice;
}

const InvoiceView = ({ invoice }: InvoiceViewProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'sent': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const companyCountry = invoice.companyCountry || 'US';
  const clientCountry = invoice.clientCountry || companyCountry;

  const companyCurrency = getCurrencyByCountry(companyCountry);
  const clientCurrency = getCurrencyByCountry(clientCountry);
  
  const formatCurrency = (amount: number, countryCode: string) => {
    const currencyInfo = getCurrencyByCountry(countryCode);
    return `${currencyInfo.symbol}${amount.toFixed(2)}`;
  };

  const showDualCurrency = companyCountry !== clientCountry && invoice.conversionRate;

  const handleDownloadPDF = () => {
    const companyInfo = `
Company: ${invoice.companyName}
${invoice.companyEmail ? `Email: ${invoice.companyEmail}` : ''}
${invoice.companyWebsite ? `Website: ${invoice.companyWebsite}` : ''}
Address: ${invoice.companyAddress}
${invoice.companyPhone ? `Phone: ${invoice.companyPhone}` : ''}`;

    const taxInfo = `
Tax Information:
${invoice.companyTaxInfo?.gstin ? `Company GSTIN: ${invoice.companyTaxInfo.gstin}` : ''}
${invoice.companyTaxInfo?.pan ? `Company PAN: ${invoice.companyTaxInfo.pan}` : ''}
${invoice.clientTaxInfo?.id ? `Client Tax ID: ${invoice.clientTaxInfo.id} (${invoice.clientTaxInfo.type || 'N/A'})` : ''}`;

    const bankInfo = invoice.companyBankDetails ? `
Bank Information:
Bank Name: ${invoice.companyBankDetails.bankName || 'N/A'}
Account Number: ${invoice.companyBankDetails.accountNumber || 'N/A'}
IFSC Code: ${invoice.companyBankDetails.ifscCode || 'N/A'}
Account Holder: ${invoice.companyBankDetails.accountHolderName || 'N/A'}` : '';

    const content = `
═══════════════════════════════════════
                INVOICE
═══════════════════════════════════════

Invoice Number: ${invoice.invoiceNumber}
Status: ${(invoice.status || 'draft').toUpperCase()}

${companyInfo}

Client Information:
Name: ${invoice.clientName}
Email: ${invoice.clientEmail}
Address: ${invoice.clientAddress}
State: ${invoice.clientState}
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

TOTAL AMOUNT: ${(invoice.totalAmount || 0).toLocaleString()}

${taxInfo}
${bankInfo}

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

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
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
            <div className="flex items-center gap-4">
              {showDualCurrency ? (
                <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-lg">
                  <p className="text-4xl font-bold text-green-600 mb-2">
                    {formatCurrency(invoice.companyAmount || invoice.totalAmount || 0, companyCountry)}
                  </p>
                  <p className="text-2xl text-gray-600 mb-3">
                    {formatCurrency(invoice.clientAmount || 0, clientCountry)}
                  </p>
                  <p className="text-sm text-gray-500 font-medium">
                    Company ({companyCurrency.code}) / Client ({clientCurrency.code})
                  </p>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-lg">
                  <p className="text-4xl font-bold text-green-600 mb-2">
                    {formatCurrency(invoice.totalAmount || 0, companyCountry)}
                  </p>
                  <p className="text-sm text-gray-500 font-medium">Total Amount</p>
                </div>
              )}
              <Button
                onClick={handleDownloadPDF}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2 font-semibold"
              >
                <Download className="w-5 h-5" />
                Download PDF
              </Button>
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
              {invoice.companyLogoUrl && (
                <img 
                  src={invoice.companyLogoUrl} 
                  alt="Company Logo" 
                  className="w-32 h-32 object-contain rounded-xl border-2 border-gray-200 shadow-md"
                />
              )}
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-900">{invoice.companyName}</h3>
                {invoice.companyEmail && (
                  <p className="text-gray-600 text-lg flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {invoice.companyEmail}
                  </p>
                )}
                {invoice.companyWebsite && (
                  <p className="text-blue-600 text-lg hover:underline flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <a href={invoice.companyWebsite} target="_blank" rel="noopener noreferrer">
                      {invoice.companyWebsite}
                    </a>
                  </p>
                )}
                {invoice.companyPhone && (
                  <p className="text-gray-600 text-lg">{invoice.companyPhone}</p>
                )}
              </div>
            </div>
            
            {invoice.companyAddress && (
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h4 className="font-bold mb-4 flex items-center gap-3 text-gray-900 text-lg">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Address
                </h4>
                <p className="text-gray-700 leading-relaxed text-base">
                  {invoice.companyAddress}
                </p>
              </div>
            )}

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

            {invoice.companyBankDetails && (
              <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                <h4 className="font-bold mb-4 text-gray-900 text-lg">Bank Information</h4>
                <div className="space-y-2 text-base">
                  <p><span className="font-semibold">Bank:</span> {invoice.companyBankDetails.bankName}</p>
                  <p><span className="font-semibold">Account:</span> {invoice.companyBankDetails.accountNumber}</p>
                  <p><span className="font-semibold">IFSC:</span> {invoice.companyBankDetails.ifscCode}</p>
                  <p><span className="font-semibold">Account Holder:</span> {invoice.companyBankDetails.accountHolderName}</p>
                </div>
              </div>
            )}

            {invoice.ownerSignatureUrl && (
              <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                <h4 className="font-bold mb-4 text-gray-900 text-lg">Digital Signature</h4>
                <img 
                  src={invoice.ownerSignatureUrl} 
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
            </div>

            {invoice.clientAddress && (
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h4 className="font-bold mb-4 flex items-center gap-3 text-gray-900 text-lg">
                  <MapPin className="w-5 h-5 text-orange-600" />
                  Address
                </h4>
                <p className="text-gray-700 leading-relaxed text-base">
                  {invoice.clientAddress}<br />
                  {invoice.clientState}
                  {invoice.clientPincode && ` - ${invoice.clientPincode}`}
                </p>
              </div>
            )}

            {invoice.clientPhone && (
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                <h4 className="font-bold mb-3 text-gray-900 text-lg">Phone</h4>
                <p className="text-gray-700 text-base">{invoice.clientPhone}</p>
              </div>
            )}

            {invoice.clientTaxInfo && (
              <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                <h4 className="font-bold mb-4 flex items-center gap-3 text-gray-900 text-lg">
                  <FileText className="w-5 h-5 text-yellow-600" />
                  Tax Information
                </h4>
                <div className="p-3 bg-white rounded-lg border">
                  <span className="font-semibold text-gray-700 text-base">
                    {invoice.clientTaxInfo.type || 'Tax ID'}: 
                  </span>
                  <span className="ml-2 text-gray-900 font-mono bg-gray-100 px-3 py-1 rounded border text-lg">
                    {invoice.clientTaxInfo.id}
                  </span>
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium text-base">Issue Date:</span>
                <span className="font-semibold text-gray-900 text-base">
                  {invoice.issueDate?.toLocaleDateString() || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium text-base">Due Date:</span>
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
                    Qty: <span className="font-semibold">{item.quantity}</span> × {formatCurrency(item.rate || 0, companyCountry)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-2xl text-green-600">
                    {formatCurrency(item.amount || 0, companyCountry)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-8 bg-gray-400 h-0.5" />

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl border-2 border-blue-200 space-y-4">
            <div className="flex justify-between text-gray-700 text-lg">
              <span className="font-semibold">Subtotal:</span>
              <span className="font-bold">{formatCurrency(invoice.subtotal || 0, companyCountry)}</span>
            </div>
            
            {(invoice.cgst || 0) > 0 && (
              <div className="flex justify-between text-gray-700 text-lg">
                <span className="font-semibold">CGST:</span>
                <span className="font-bold">{formatCurrency(invoice.cgst || 0, companyCountry)}</span>
              </div>
            )}
            
            {(invoice.sgst || 0) > 0 && (
              <div className="flex justify-between text-gray-700 text-lg">
                <span className="font-semibold">SGST:</span>
                <span className="font-bold">{formatCurrency(invoice.sgst || 0, companyCountry)}</span>
              </div>
            )}
            
            {(invoice.igst || 0) > 0 && (
              <div className="flex justify-between text-gray-700 text-lg">
                <span className="font-semibold">IGST:</span>
                <span className="font-bold">{formatCurrency(invoice.igst || 0, companyCountry)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-gray-700 text-lg">
              <span className="font-semibold">Total Tax:</span>
              <span className="font-bold">{formatCurrency(invoice.totalGst || 0, companyCountry)}</span>
            </div>
            
            <Separator className="bg-gray-500 h-0.5" />
            
            <div className="flex justify-between font-bold text-2xl text-green-700">
              <span>Total Amount:</span>
              <span>{formatCurrency(invoice.totalAmount || 0, companyCountry)}</span>
            </div>
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
  );
};

export default InvoiceView;

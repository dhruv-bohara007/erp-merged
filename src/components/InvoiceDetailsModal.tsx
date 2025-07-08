
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Download, MapPin, Building, CreditCard, FileText } from 'lucide-react';
import { Invoice } from '@/hooks/useFirestore';
import { CompanyData } from '@/hooks/useCompanyData';
import { Client } from '@/hooks/useFirestore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCurrencyByCountry } from '@/data/countryCurrencyMapping';

interface InvoiceDetailsModalProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InvoiceDetailsModal = ({ invoice, open, onOpenChange }: InvoiceDetailsModalProps) => {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [clientData, setClientData] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAdditionalData = async () => {
      if (!invoice || !open) return;
      
      setLoading(true);
      try {
        console.log('Fetching company data for companyId:', invoice.companyId);
        console.log('Fetching client data for clientId:', invoice.clientId);

        // Fetch company data
        if (invoice.companyId) {
          const companyDoc = await getDoc(doc(db, 'companies', invoice.companyId));
          if (companyDoc.exists()) {
            console.log('Company data found:', companyDoc.data());
            setCompanyData(companyDoc.data() as CompanyData);
          }
        }

        // Fetch client data
        if (invoice.clientId) {
          const clientDoc = await getDoc(doc(db, 'clients', invoice.clientId));
          if (clientDoc.exists()) {
            console.log('Client data found:', clientDoc.data());
            setClientData(clientDoc.data() as Client);
          }
        }
      } catch (error) {
        console.error('Error fetching additional data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdditionalData();
  }, [invoice, open]);

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
    const companyInfo = companyData ? `
Company: ${companyData.companyName}
Address: ${companyData.streetAddress}, ${companyData.city}, ${companyData.country}
Phone: ${companyData.phone}
Email: ${companyData.email}` : `Company: ${invoice.companyName || 'N/A'}`;

    const bankInfo = invoice.bankInfo || companyData?.bankInfo ? `
Bank Information:
${invoice.bankInfo ? `
Bank Name: ${(invoice.bankInfo as any).bankName || 'N/A'}
Account Number: ${(invoice.bankInfo as any).accountNumber || 'N/A'}
Routing Code: ${(invoice.bankInfo as any).routingCode || (invoice.bankInfo as any).ifscCode || 'N/A'}` : ''}
${companyData?.bankInfo ? `
Bank Name: ${(companyData.bankInfo as any).bankName || 'N/A'}
Account Number: ${(companyData.bankInfo as any).accountNumber || 'N/A'}
Routing Code: ${(companyData.bankInfo as any).routingCode || (companyData.bankInfo as any).ifscCode || 'N/A'}` : ''}` : '';

    const taxInfo = `
Tax Information:
${invoice.companyTaxInfo?.gstin ? `Company GSTIN: ${invoice.companyTaxInfo.gstin}` : ''}
${invoice.clientTaxInfo?.id ? `Client Tax ID: ${invoice.clientTaxInfo.id} (${invoice.clientTaxInfo.type || 'N/A'})` : ''}`;

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
Address: ${invoice.clientAddress || clientData?.address || 'N/A'}
${clientData?.phone ? `Phone: ${clientData.phone}` : ''}

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

  const companyCountry = invoice.companyCountry || 'US';
  const clientCountry = invoice.clientCountry || companyCountry;

  const companyCurrency = getCurrencyByCountry(companyCountry);
  const clientCurrency = getCurrencyByCountry(clientCountry);
  
  const formatCurrency = (amount: number, countryCode: string) => {
    const currencyInfo = getCurrencyByCountry(countryCode);
    return `${currencyInfo.symbol}${amount.toFixed(2)}`;
  };

  const showDualCurrency = companyCountry !== clientCountry && invoice.conversionRate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto bg-white">
        <DialogHeader className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-gray-900">Invoice Details</DialogTitle>
            <Button
              onClick={handleDownloadPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-md transition-all duration-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </DialogHeader>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading invoice details...</p>
          </div>
        )}

        <div className="space-y-8 p-2">
          {/* Invoice Header */}
          <Card className="border-2 border-gray-100 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoice #{invoice.invoiceNumber}</h1>
                  <Badge className={`${getStatusColor(invoice.status || 'draft')} px-3 py-1 text-sm font-medium border`}>
                    {(invoice.status || 'draft').charAt(0).toUpperCase() + (invoice.status || 'draft').slice(1)}
                  </Badge>
                </div>
                <div className="text-right">
                  {showDualCurrency ? (
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-3xl font-bold text-green-600 mb-1">
                        {formatCurrency(invoice.companyAmount || invoice.totalAmount || 0, companyCountry)}
                      </p>
                      <p className="text-xl text-gray-600 mb-2">
                        {formatCurrency(invoice.clientAmount || 0, clientCountry)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Company ({companyCurrency.code}) / Client ({clientCurrency.code})
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-3xl font-bold text-green-600 mb-1">
                        {formatCurrency(invoice.totalAmount || 0, companyCountry)}
                      </p>
                      <p className="text-sm text-gray-500">Total Amount</p>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Company Information */}
            <Card className="border-2 border-gray-100 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Building className="w-5 h-5 text-green-600" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {companyData ? (
                  <>
                    <div className="flex items-center gap-4">
                      {companyData.logoUrl && (
                        <img 
                          src={companyData.logoUrl} 
                          alt="Company Logo" 
                          className="w-20 h-20 object-contain rounded-lg border border-gray-200"
                        />
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{companyData.companyName}</h3>
                        <p className="text-gray-600">{companyData.email}</p>
                        <p className="text-gray-600">{companyData.phone}</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-900">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        Address
                      </h4>
                      <p className="text-gray-700 leading-relaxed">
                        {companyData.streetAddress}<br />
                        {companyData.city}, {companyData.country}
                      </p>
                    </div>

                    {/* Tax Information with proper GSTIN display */}
                    {(companyData.taxInfo || invoice.companyTaxInfo) && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-900">
                          <FileText className="w-4 h-4 text-blue-600" />
                          Tax Information
                        </h4>
                        {invoice.companyTaxInfo?.gstin && (
                          <div className="mb-2">
                            <span className="font-medium text-gray-700">GSTIN: </span>
                            <span className="text-gray-900 font-mono bg-white px-2 py-1 rounded border">
                              {invoice.companyTaxInfo.gstin}
                            </span>
                          </div>
                        )}
                        {companyData.taxInfo?.primaryType && (
                          <div>
                            <span className="font-medium text-gray-700">{companyData.taxInfo.primaryType}: </span>
                            <span className="text-gray-900">{companyData.taxInfo.primaryId}</span>
                            {companyData.taxInfo.secondaryId && (
                              <>
                                <br />
                                <span className="font-medium text-gray-700">Secondary ID: </span>
                                <span className="text-gray-900">{companyData.taxInfo.secondaryId}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bank Information - Formatted Table */}
                    {(companyData.bankInfo || invoice.bankInfo) && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-900">
                          <CreditCard className="w-4 h-4 text-green-600" />
                          Bank Information
                        </h4>
                        <div className="bg-white rounded border overflow-hidden">
                          <table className="w-full text-sm">
                            <tbody>
                              {(invoice.bankInfo as any)?.bankName && (
                                <tr className="border-b border-gray-100">
                                  <td className="px-3 py-2 font-medium text-gray-700 bg-gray-50">Bank Name</td>
                                  <td className="px-3 py-2 text-gray-900">{(invoice.bankInfo as any).bankName}</td>
                                </tr>
                              )}
                              {(invoice.bankInfo as any)?.accountNumber && (
                                <tr className="border-b border-gray-100">
                                  <td className="px-3 py-2 font-medium text-gray-700 bg-gray-50">Account Number</td>
                                  <td className="px-3 py-2 text-gray-900 font-mono">{(invoice.bankInfo as any).accountNumber}</td>
                                </tr>
                              )}
                              {((invoice.bankInfo as any)?.routingCode || (invoice.bankInfo as any)?.ifscCode) && (
                                <tr>
                                  <td className="px-3 py-2 font-medium text-gray-700 bg-gray-50">Routing Code</td>
                                  <td className="px-3 py-2 text-gray-900 font-mono">
                                    {(invoice.bankInfo as any)?.routingCode || (invoice.bankInfo as any)?.ifscCode}
                                  </td>
                                </tr>
                              )}
                              {!(invoice.bankInfo as any)?.bankName && (companyData.bankInfo as any)?.bankName && (
                                <tr className="border-b border-gray-100">
                                  <td className="px-3 py-2 font-medium text-gray-700 bg-gray-50">Bank Name</td>
                                  <td className="px-3 py-2 text-gray-900">{(companyData.bankInfo as any).bankName}</td>
                                </tr>
                              )}
                              {!(invoice.bankInfo as any)?.accountNumber && (companyData.bankInfo as any)?.accountNumber && (
                                <tr className="border-b border-gray-100">
                                  <td className="px-3 py-2 font-medium text-gray-700 bg-gray-50">Account Number</td>
                                  <td className="px-3 py-2 text-gray-900 font-mono">{(companyData.bankInfo as any).accountNumber}</td>
                                </tr>
                              )}
                              {!((invoice.bankInfo as any)?.routingCode || (invoice.bankInfo as any)?.ifscCode) && 
                               ((companyData.bankInfo as any)?.routingCode || (companyData.bankInfo as any)?.ifscCode) && (
                                <tr>
                                  <td className="px-3 py-2 font-medium text-gray-700 bg-gray-50">Routing Code</td>
                                  <td className="px-3 py-2 text-gray-900 font-mono">
                                    {(companyData.bankInfo as any)?.routingCode || (companyData.bankInfo as any)?.ifscCode}
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {companyData.signatureUrl && (
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-3 text-gray-900">Digital Signature</h4>
                        <img 
                          src={companyData.signatureUrl} 
                          alt="Digital Signature" 
                          className="max-w-40 h-20 object-contain border rounded bg-white p-2"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {loading ? (
                      <div>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto mb-2"></div>
                        Loading company information...
                      </div>
                    ) : (
                      'Company information not available'
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card className="border-2 border-gray-100 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
                <CardTitle className="text-lg font-semibold text-gray-900">Client Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900">{invoice.clientName}</h3>
                  <p className="text-gray-600">{invoice.clientEmail}</p>
                </div>

                {(clientData || invoice.clientAddress) && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-900">
                      <MapPin className="w-4 h-4 text-orange-600" />
                      Address
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                      {invoice.clientAddress || clientData?.address}<br />
                      {clientData?.city && `${clientData.city}, `}
                      {clientData?.state && `${clientData.state} `}
                      {clientData?.pincode}<br />
                      {clientData?.country}
                    </p>
                  </div>
                )}

                {(clientData?.phone || invoice.clientPhone) && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 text-gray-900">Phone</h4>
                    <p className="text-gray-700">{invoice.clientPhone || clientData?.phone}</p>
                  </div>
                )}

                {/* Client Tax Information - Properly display clientTaxInfo.id */}
                {(invoice.clientTaxInfo || clientData?.taxInfo || clientData?.gstin) && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-900">
                      <FileText className="w-4 h-4 text-yellow-600" />
                      Tax Information
                    </h4>
                    {invoice.clientTaxInfo?.id && (
                      <div className="mb-2">
                        <span className="font-medium text-gray-700">
                          {invoice.clientTaxInfo.type || 'Tax ID'}: 
                        </span>
                        <span className="ml-2 text-gray-900 font-mono bg-white px-2 py-1 rounded border">
                          {invoice.clientTaxInfo.id}
                        </span>
                      </div>
                    )}
                    {clientData?.taxInfo?.id && (
                      <div className="mb-2">
                        <span className="font-medium text-gray-700">
                          {clientData.taxInfo.type || 'Tax ID'}: 
                        </span>
                        <span className="ml-2 text-gray-900 font-mono bg-white px-2 py-1 rounded border">
                          {clientData.taxInfo.id}
                        </span>
                      </div>
                    )}
                    {clientData?.gstin && (
                      <div>
                        <span className="font-medium text-gray-700">GSTIN: </span>
                        <span className="text-gray-900 font-mono bg-white px-2 py-1 rounded border">
                          {clientData.gstin}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4" />
                      Issue Date:
                    </span>
                    <span className="font-medium text-gray-900">
                      {invoice.issueDate?.toLocaleDateString() || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4" />
                      Due Date:
                    </span>
                    <span className="font-medium text-gray-900">
                      {invoice.dueDate?.toLocaleDateString() || 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Items */}
          <Card className="border-2 border-gray-100 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
              <CardTitle className="text-lg font-semibold text-gray-900">Invoice Items</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {invoice.items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{item.description}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Qty: <span className="font-medium">{item.quantity}</span> × {formatCurrency(item.rate || 0, companyCountry)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-green-600">
                        {formatCurrency(item.amount || 0, companyCountry)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-6 bg-gray-300" />

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span className="font-medium">Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(invoice.subtotal || 0, companyCountry)}</span>
                </div>
                
                {(invoice.cgst || 0) > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span className="font-medium">CGST:</span>
                    <span className="font-semibold">{formatCurrency(invoice.cgst || 0, companyCountry)}</span>
                  </div>
                )}
                
                {(invoice.sgst || 0) > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span className="font-medium">SGST:</span>
                    <span className="font-semibold">{formatCurrency(invoice.sgst || 0, companyCountry)}</span>
                  </div>
                )}
                
                {(invoice.igst || 0) > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span className="font-medium">IGST:</span>
                    <span className="font-semibold">{formatCurrency(invoice.igst || 0, companyCountry)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-gray-700">
                  <span className="font-medium">Total Tax:</span>
                  <span className="font-semibold">{formatCurrency(invoice.totalGst || 0, companyCountry)}</span>
                </div>
                
                <Separator className="bg-gray-400" />
                
                <div className="flex justify-between font-bold text-xl text-green-700">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(invoice.totalAmount || 0, companyCountry)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes and Terms */}
          {(invoice.notes || invoice.terms) && (
            <Card className="border-2 border-gray-100 shadow-lg">
              <CardContent className="p-6">
                {invoice.notes && (
                  <div className="mb-6 bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 text-gray-900">Notes:</h4>
                    <p className="text-gray-700 leading-relaxed">{invoice.notes}</p>
                  </div>
                )}
                {invoice.terms && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 text-gray-900">Terms & Conditions:</h4>
                    <p className="text-gray-700 leading-relaxed">{invoice.terms}</p>
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

export default InvoiceDetailsModal;

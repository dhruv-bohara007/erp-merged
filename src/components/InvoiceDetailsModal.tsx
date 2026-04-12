
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
        console.log('Invoice companyTaxInfo:', invoice.companyTaxInfo);
        console.log('Invoice clientTaxInfo:', invoice.clientTaxInfo);
        console.log('Invoice bankInfo:', invoice.bankInfo);

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
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'sent': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      case 'partially-paid': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'paid-after-due': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'draft': return '🟡 Created';
      case 'sent': return '🟠 Pending';
      case 'pending': return '🟠 Pending';
      case 'partially-paid': return '🟡 Partially Paid';
      case 'paid': return '🟢 Paid';
      case 'overdue': return '🔴 Overdue';
      case 'paid-after-due': return '🔵 Paid (After Due Date)';
      default: return '🟡 Created';
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

  // Force re-render key to ensure changes are visible
  const modalKey = `invoice-modal-${invoice.id}-${Date.now()}`;

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

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600">Loading invoice details...</p>
          </div>
        )}

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
                    {getStatusDisplay(invoice.status || 'draft')}
                  </Badge>
                </div>
                <div className="text-right">
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
                {companyData ? (
                  <>
                    <div className="flex items-center gap-6">
                      {companyData.logoUrl && (
                        <img 
                          src={companyData.logoUrl} 
                          alt="Company Logo" 
                          className="w-24 h-24 object-contain rounded-xl border-2 border-gray-200 shadow-md"
                        />
                      )}
                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-gray-900">{companyData.companyName}</h3>
                        <p className="text-gray-600 text-lg">{companyData.email}</p>
                        <p className="text-gray-600 text-lg">{companyData.phone}</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                      <h4 className="font-bold mb-4 flex items-center gap-3 text-gray-900 text-lg">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        Address
                      </h4>
                      <p className="text-gray-700 leading-relaxed text-base">
                        {companyData.streetAddress}<br />
                        {companyData.city}, {companyData.country}
                      </p>
                    </div>

                    {/* Enhanced Tax Information with proper GSTIN display */}
                    {(companyData.taxInfo || invoice.companyTaxInfo) && (
                      <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                        <h4 className="font-bold mb-4 flex items-center gap-3 text-gray-900 text-lg">
                          <FileText className="w-5 h-5 text-blue-600" />
                          Tax Information
                        </h4>
                        {invoice.companyTaxInfo?.gstin && (
                          <div className="mb-4 p-3 bg-white rounded-lg border">
                            <span className="font-semibold text-gray-700 text-base">GSTIN: </span>
                            <span className="text-gray-900 font-mono bg-gray-100 px-3 py-1 rounded border text-lg">
                              {invoice.companyTaxInfo.gstin}
                            </span>
                          </div>
                        )}
                        {companyData.taxInfo?.primaryType && (
                          <div className="p-3 bg-white rounded-lg border">
                            <span className="font-semibold text-gray-700 text-base">{companyData.taxInfo.primaryType}: </span>
                            <span className="text-gray-900 text-base">{companyData.taxInfo.primaryId}</span>
                            {companyData.taxInfo.secondaryId && (
                              <>
                                <br />
                                <span className="font-semibold text-gray-700 text-base">Secondary ID: </span>
                                <span className="text-gray-900 text-base">{companyData.taxInfo.secondaryId}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Enhanced Bank Information - Professional Table Format */}
                    {(companyData.bankInfo || invoice.bankInfo) && (
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
                              {!(invoice.bankInfo as any)?.bankName && (companyData.bankInfo as any)?.bankName && (
                                <tr className="border-b border-gray-100">
                                  <td className="px-4 py-3 font-semibold text-gray-700 bg-gray-50">Bank Name</td>
                                  <td className="px-4 py-3 text-gray-900 font-medium">{(companyData.bankInfo as any).bankName}</td>
                                </tr>
                              )}
                              {!(invoice.bankInfo as any)?.accountNumber && (companyData.bankInfo as any)?.accountNumber && (
                                <tr className="border-b border-gray-100">
                                  <td className="px-4 py-3 font-semibold text-gray-700 bg-gray-50">Account Number</td>
                                  <td className="px-4 py-3 text-gray-900 font-mono text-lg">{(companyData.bankInfo as any).accountNumber}</td>
                                </tr>
                              )}
                              {!((invoice.bankInfo as any)?.routingCode || (invoice.bankInfo as any)?.ifscCode) && 
                               ((companyData.bankInfo as any)?.routingCode || (companyData.bankInfo as any)?.ifscCode) && (
                                <tr>
                                  <td className="px-4 py-3 font-semibold text-gray-700 bg-gray-50">Routing Code</td>
                                  <td className="px-4 py-3 text-gray-900 font-mono text-lg">
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
                      <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                        <h4 className="font-bold mb-4 text-gray-900 text-lg">Digital Signature</h4>
                        <img 
                          src={companyData.signatureUrl} 
                          alt="Digital Signature" 
                          className="max-w-48 h-24 object-contain border-2 rounded-lg bg-white p-3 shadow-sm"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    {loading ? (
                      <div>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-3"></div>
                        <p className="text-lg">Loading company information...</p>
                      </div>
                    ) : (
                      <p className="text-lg">Company information not available</p>
                    )}
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

                {(clientData || invoice.clientAddress) && (
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <h4 className="font-bold mb-4 flex items-center gap-3 text-gray-900 text-lg">
                      <MapPin className="w-5 h-5 text-orange-600" />
                      Address
                    </h4>
                    <p className="text-gray-700 leading-relaxed text-base">
                      {invoice.clientAddress || clientData?.address}<br />
                      {clientData?.city && `${clientData.city}, `}
                      {clientData?.state && `${clientData.state} `}
                      {clientData?.pincode}<br />
                      {clientData?.country}
                    </p>
                  </div>
                )}

                {(clientData?.phone || invoice.clientPhone) && (
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                    <h4 className="font-bold mb-3 text-gray-900 text-lg">Phone</h4>
                    <p className="text-gray-700 text-base">{invoice.clientPhone || clientData?.phone}</p>
                  </div>
                )}

                {/* Enhanced Client Tax Information - Properly display clientTaxInfo.id */}
                {(invoice.clientTaxInfo || clientData?.taxInfo || clientData?.gstin) && (
                  <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                    <h4 className="font-bold mb-4 flex items-center gap-3 text-gray-900 text-lg">
                      <FileText className="w-5 h-5 text-yellow-600" />
                      Tax Information
                    </h4>
                    {invoice.clientTaxInfo?.id && (
                      <div className="mb-4 p-3 bg-white rounded-lg border">
                        <span className="font-semibold text-gray-700 text-base">
                          {invoice.clientTaxInfo.type || 'Tax ID'}: 
                        </span>
                        <span className="ml-2 text-gray-900 font-mono bg-gray-100 px-3 py-1 rounded border text-lg">
                          {invoice.clientTaxInfo.id}
                        </span>
                      </div>
                    )}
                    {clientData?.taxInfo?.id && (
                      <div className="mb-4 p-3 bg-white rounded-lg border">
                        <span className="font-semibold text-gray-700 text-base">
                          {clientData.taxInfo.type || 'Tax ID'}: 
                        </span>
                        <span className="ml-2 text-gray-900 font-mono bg-gray-100 px-3 py-1 rounded border text-lg">
                          {clientData.taxInfo.id}
                        </span>
                      </div>
                    )}
                    {clientData?.gstin && (
                      <div className="p-3 bg-white rounded-lg border">
                        <span className="font-semibold text-gray-700 text-base">GSTIN: </span>
                        <span className="text-gray-900 font-mono bg-gray-100 px-3 py-1 rounded border text-lg">
                          {clientData.gstin}
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
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDetailsModal;

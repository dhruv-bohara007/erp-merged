
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Download, MapPin, Globe, Building, CreditCard, FileText, Phone } from 'lucide-react';
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
          } else {
            console.log('Company document does not exist');
          }
        }

        // Fetch client data
        if (invoice.clientId) {
          const clientDoc = await getDoc(doc(db, 'clients', invoice.clientId));
          if (clientDoc.exists()) {
            console.log('Client data found:', clientDoc.data());
            setClientData(clientDoc.data() as Client);
          } else {
            console.log('Client document does not exist');
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
      case 'paid': return 'bg-green-50 text-green-700 border-green-200';
      case 'sent': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'draft': return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'overdue': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const handleDownloadPDF = () => {
    const content = `
INVOICE DETAILS
===============

Invoice Number: ${invoice.invoiceNumber}
Company: ${invoice.companyName}
GSTIN: ${invoice.GSTIN || 'N/A'}

Client: ${invoice.clientName}
Email: ${invoice.clientEmail}
${invoice.clientTaxInfo?.id ? `${invoice.clientTaxInfo.type}: ${invoice.clientTaxInfo.id}` : ''}

Issue Date: ${invoice.issueDate?.toLocaleDateString()}
Due Date: ${invoice.dueDate?.toLocaleDateString()}

ITEMS:
${invoice.items?.map(item => 
  `${item.description} - Qty: ${item.quantity} - Rate: ${item.rate} - Amount: ${item.amount}`
).join('\n')}

FINANCIAL SUMMARY:
Subtotal: ${(invoice.subtotal || 0).toLocaleString()}
Total Tax: ${(invoice.totalGst || 0).toLocaleString()}
TOTAL AMOUNT: ${(invoice.totalAmount || 0).toLocaleString()}

Notes: ${invoice.notes || 'N/A'}
Terms: ${invoice.terms || 'N/A'}
    `;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${invoice.invoiceNumber}.txt`;
    a.style.display = 'none';
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

  const formatBankInfo = (bankInfo: any) => {
    if (!bankInfo || typeof bankInfo !== 'object') return null;
    
    // Handle different possible bank info structures
    const bankName = bankInfo.bankName || bankInfo.bank_name || 'N/A';
    const accountNumber = bankInfo.accountNumber || bankInfo.account_number || 'N/A';
    const routingCode = bankInfo.routingCode || bankInfo.routing_code || bankInfo.ifscCode || bankInfo.ifsc_code || 'N/A';
    const routingType = bankInfo.routingType || bankInfo.routing_type || 'Routing Code';
    
    return { bankName, accountNumber, routingCode, routingType };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto bg-white">
        <DialogHeader className="border-b pb-6 bg-gradient-to-r from-blue-50 to-indigo-50 -m-6 p-6 mb-6">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-3xl font-bold text-gray-900">Invoice Details</DialogTitle>
            <Button
              variant="default"
              size="lg"
              onClick={handleDownloadPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              <Download className="w-5 h-5 mr-2" />
              Download PDF
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-8 py-2">
          {/* Invoice Header */}
          <Card className="border-2 border-blue-100 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white -m-6 p-6 mb-6">
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <h1 className="text-4xl font-bold">Invoice #{invoice.invoiceNumber}</h1>
                  <Badge className={`${getStatusColor(invoice.status || 'draft')} font-semibold px-4 py-2 text-sm`}>
                    {(invoice.status || 'draft').charAt(0).toUpperCase() + (invoice.status || 'draft').slice(1)}
                  </Badge>
                </div>
                <div className="text-right">
                  {showDualCurrency ? (
                    <div className="space-y-2">
                      <p className="text-4xl font-bold">
                        {formatCurrency(invoice.companyAmount || invoice.totalAmount || 0, companyCountry)}
                      </p>
                      <p className="text-xl opacity-90">
                        {formatCurrency(invoice.clientAmount || 0, clientCountry)}
                      </p>
                      <p className="text-sm opacity-80">
                        Company ({companyCurrency.code}) / Client ({clientCurrency.code})
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-4xl font-bold">
                        {formatCurrency(invoice.totalAmount || 0, companyCountry)}
                      </p>
                      <p className="text-sm opacity-80 font-medium">Total Amount</p>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Company Information */}
            <Card className="border-2 border-blue-100 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                  <Building className="w-6 h-6 text-blue-600" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="flex items-center gap-4">
                  {(companyData?.logoUrl || invoice.logoUrl) && (
                    <div className="flex-shrink-0">
                      <img 
                        src={companyData?.logoUrl || invoice.logoUrl} 
                        alt="Company Logo" 
                        className="w-20 h-20 object-contain rounded-lg border-2 border-gray-200 shadow-sm"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900">{invoice.companyName}</h3>
                    {companyData?.email && (
                      <p className="text-gray-600 text-lg">{companyData.email}</p>
                    )}
                    {(companyData?.phone || invoice.companyPhone) && (
                      <p className="text-gray-600 flex items-center gap-2 text-lg">
                        <Phone className="w-4 h-4" />
                        {companyData?.phone || invoice.companyPhone}
                      </p>
                    )}
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div>
                  <h4 className="font-bold mb-3 flex items-center gap-2 text-lg text-gray-900">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    Address
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <p className="text-gray-700 leading-relaxed">
                      {invoice.companyAddress || companyData?.streetAddress}<br />
                      {invoice.companyCity || companyData?.city}<br />
                      {companyCountry === 'IN' ? 'India' : companyCountry}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold mb-3 flex items-center gap-2 text-lg text-gray-900">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Tax Information
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">GSTIN:</span>
                      <span className="text-gray-800 font-mono bg-white px-3 py-1 rounded border">
                        {invoice.GSTIN || 'Not Available'}
                      </span>
                    </div>
                    {companyData?.taxInfo?.secondaryId && (
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">Secondary ID:</span>
                        <span className="text-gray-800 font-mono bg-white px-3 py-1 rounded border">
                          {companyData.taxInfo.secondaryId}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {(companyData?.bankInfo || invoice.bankInfo) && (
                  <div>
                    <h4 className="font-bold mb-3 flex items-center gap-2 text-lg text-gray-900">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      Bank Information
                    </h4>
                    <div className="bg-gray-50 rounded-lg border overflow-hidden">
                      <Table>
                        <TableBody>
                          {(() => {
                            const bankDetails = formatBankInfo(companyData?.bankInfo || invoice.bankInfo);
                            if (!bankDetails) return (
                              <TableRow>
                                <TableCell colSpan={2} className="text-center text-gray-500 py-4">
                                  No bank information available
                                </TableCell>
                              </TableRow>
                            );
                            
                            return (
                              <>
                                <TableRow className="border-gray-200 hover:bg-gray-100">
                                  <TableCell className="font-semibold text-gray-700 py-3 w-1/3">Bank Name</TableCell>
                                  <TableCell className="text-gray-800 py-3 font-medium">{bankDetails.bankName}</TableCell>
                                </TableRow>
                                <TableRow className="border-gray-200 hover:bg-gray-100">
                                  <TableCell className="font-semibold text-gray-700 py-3">Account Number</TableCell>
                                  <TableCell className="text-gray-800 py-3 font-mono">{bankDetails.accountNumber}</TableCell>
                                </TableRow>
                                <TableRow className="border-gray-200 hover:bg-gray-100">
                                  <TableCell className="font-semibold text-gray-700 py-3">{bankDetails.routingType}</TableCell>
                                  <TableCell className="text-gray-800 py-3 font-mono">{bankDetails.routingCode}</TableCell>
                                </TableRow>
                              </>
                            );
                          })()}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {(companyData?.signatureUrl || invoice.signatureUrl) && (
                  <div>
                    <h4 className="font-bold mb-3 text-lg text-gray-900">Digital Signature</h4>
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <img 
                        src={companyData?.signatureUrl || invoice.signatureUrl} 
                        alt="Digital Signature" 
                        className="max-w-40 h-20 object-contain border-2 border-gray-200 rounded bg-white p-2"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card className="border-2 border-green-100 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b-2 border-green-200">
                <CardTitle className="text-xl font-bold text-gray-900">Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{invoice.clientName}</h3>
                  <p className="text-gray-600 text-lg">{invoice.clientEmail}</p>
                  {(clientData?.phone || invoice.clientPhone) && (
                    <p className="text-gray-600 flex items-center gap-2 text-lg">
                      <Phone className="w-4 h-4" />
                      {clientData?.phone || invoice.clientPhone}
                    </p>
                  )}
                </div>

                <Separator className="my-4" />
                
                <div>
                  <h4 className="font-bold mb-3 flex items-center gap-2 text-lg text-gray-900">
                    <MapPin className="w-5 h-5 text-green-600" />
                    Address
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <p className="text-gray-700 leading-relaxed">
                      {invoice.clientAddress || clientData?.address}<br />
                      {invoice.clientState || clientData?.state} {invoice.clientPincode || clientData?.pincode}<br />
                      {clientCountry === 'GB' ? 'United Kingdom' : clientCountry}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold mb-3 flex items-center gap-2 text-lg text-gray-900">
                    <Globe className="w-5 h-5 text-green-600" />
                    Country & Currency
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <p className="text-gray-700">
                      <span className="font-semibold">Country:</span> {clientCountry === 'GB' ? 'United Kingdom' : clientCountry} ({clientCurrency.code})
                    </p>
                  </div>
                </div>

                {(invoice.clientTaxInfo?.id || clientData?.taxInfo?.id) && (
                  <div>
                    <h4 className="font-bold mb-3 flex items-center gap-2 text-lg text-gray-900">
                      <FileText className="w-5 h-5 text-green-600" />
                      Tax Information
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">
                          {invoice.clientTaxInfo?.type || clientData?.taxInfo?.type || 'Tax ID'}:
                        </span>
                        <span className="text-gray-800 font-mono bg-white px-3 py-1 rounded border">
                          {invoice.clientTaxInfo?.id || clientData?.taxInfo?.id}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <Separator className="my-4" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-gray-700">Issue Date:</span>
                    </div>
                    <span className="font-bold text-gray-900 text-lg">{invoice.issueDate?.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-orange-600" />
                      <span className="font-semibold text-gray-700">Due Date:</span>
                    </div>
                    <span className="font-bold text-gray-900 text-lg">{invoice.dueDate?.toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Items */}
          <Card className="border-2 border-yellow-100 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-b-2 border-yellow-200">
              <CardTitle className="text-xl font-bold text-gray-900">Invoice Items</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {invoice.items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-lg">{item.description}</p>
                      <p className="text-gray-600 mt-2">
                        <span className="font-semibold">Qty:</span> {item.quantity} × {formatCurrency(item.rate || 0, companyCountry)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-2xl text-gray-900">
                        {formatCurrency(item.amount || 0, companyCountry)}
                      </p>
                      <p className="text-sm text-gray-500 font-medium">Line Total</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-8" />

              <div className="space-y-4">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold text-gray-700">Subtotal:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(invoice.subtotal || 0, companyCountry)}</span>
                </div>
                
                {(invoice.cgst || 0) > 0 && (
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold text-gray-700">CGST:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(invoice.cgst || 0, companyCountry)}</span>
                  </div>
                )}
                
                {(invoice.sgst || 0) > 0 && (
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold text-gray-700">SGST:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(invoice.sgst || 0, companyCountry)}</span>
                  </div>
                )}
                
                {(invoice.igst || 0) > 0 && (
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold text-gray-700">IGST:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(invoice.igst || 0, companyCountry)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg">
                  <span className="font-semibold text-gray-700">Total Tax:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(invoice.totalGst || 0, companyCountry)}</span>
                </div>
                
                <Separator className="border-2" />
                
                <div className="flex justify-between font-bold text-2xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-lg shadow-lg">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(invoice.totalAmount || 0, companyCountry)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes and Terms */}
          {(invoice.notes || invoice.terms) && (
            <Card className="border-2 border-purple-100 shadow-lg">
              <CardContent className="p-6">
                {invoice.notes && (
                  <div className="mb-6">
                    <h4 className="font-bold mb-3 text-xl text-gray-900">Notes:</h4>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <p className="text-gray-700 leading-relaxed text-lg">{invoice.notes}</p>
                    </div>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <h4 className="font-bold mb-3 text-xl text-gray-900">Terms & Conditions:</h4>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <p className="text-gray-700 leading-relaxed text-lg">{invoice.terms}</p>
                    </div>
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

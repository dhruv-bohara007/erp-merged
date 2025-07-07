
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Download, MapPin, Globe, Building, CreditCard, FileText } from 'lucide-react';
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
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'sent': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-gray-900">Invoice Details</DialogTitle>
            <Button
              variant="default"
              size="sm"
              onClick={handleDownloadPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors duration-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </DialogHeader>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading additional details...</p>
          </div>
        )}

        <div className="space-y-6 py-4">
          {/* Invoice Header */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50 border-b">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-gray-900">Invoice #{invoice.invoiceNumber}</h1>
                  <Badge className={`${getStatusColor(invoice.status || 'draft')} font-medium`}>
                    {(invoice.status || 'draft').charAt(0).toUpperCase() + (invoice.status || 'draft').slice(1)}
                  </Badge>
                </div>
                <div className="text-right">
                  {showDualCurrency ? (
                    <div className="space-y-1">
                      <p className="text-3xl font-bold text-gray-900">
                        {formatCurrency(invoice.companyAmount || invoice.totalAmount || 0, companyCountry)}
                      </p>
                      <p className="text-lg text-gray-600">
                        {formatCurrency(invoice.clientAmount || 0, clientCountry)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Company ({companyCurrency.code}) / Client ({clientCurrency.code})
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-3xl font-bold text-gray-900">
                        {formatCurrency(invoice.totalAmount || 0, companyCountry)}
                      </p>
                      <p className="text-sm text-gray-500 font-medium">Total Amount</p>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Information */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="bg-blue-50 border-b">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Building className="w-5 h-5 text-blue-600" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                {companyData ? (
                  <>
                    <div className="flex items-center gap-4">
                      {companyData.logoUrl && (
                        <div className="flex-shrink-0">
                          <img 
                            src={companyData.logoUrl} 
                            alt="Company Logo" 
                            className="w-16 h-16 object-contain rounded-lg border border-gray-200"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900">{companyData.companyName}</h3>
                        <p className="text-gray-600">{companyData.email}</p>
                        {companyData.phone && (
                          <p className="text-gray-600">{companyData.phone}</p>
                        )}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-900">
                        <MapPin className="w-4 h-4 text-gray-600" />
                        Address
                      </h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-700">
                          {companyData.streetAddress}<br />
                          {companyData.city}, {companyData.country}
                        </p>
                      </div>
                    </div>

                    {(companyData.taxInfo || invoice.GSTIN) && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-900">
                          <FileText className="w-4 h-4 text-gray-600" />
                          Tax Information
                        </h4>
                        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                          {invoice.GSTIN && (
                            <p className="text-gray-700">
                              <span className="font-medium">GSTIN:</span> {invoice.GSTIN}
                            </p>
                          )}
                          {companyData.taxInfo?.secondaryId && (
                            <p className="text-gray-700">
                              <span className="font-medium">Secondary ID:</span> {companyData.taxInfo.secondaryId}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {companyData.bankInfo && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-900">
                          <CreditCard className="w-4 h-4 text-gray-600" />
                          Bank Information
                        </h4>
                        <div className="bg-gray-50 rounded-lg overflow-hidden">
                          <Table>
                            <TableBody>
                              {(() => {
                                const bankDetails = formatBankInfo(companyData.bankInfo);
                                if (!bankDetails) return null;
                                
                                return (
                                  <>
                                    <TableRow className="border-gray-200">
                                      <TableCell className="font-medium text-gray-700 py-2">Bank Name</TableCell>
                                      <TableCell className="text-gray-600 py-2">{bankDetails.bankName}</TableCell>
                                    </TableRow>
                                    <TableRow className="border-gray-200">
                                      <TableCell className="font-medium text-gray-700 py-2">Account Number</TableCell>
                                      <TableCell className="text-gray-600 py-2">{bankDetails.accountNumber}</TableCell>
                                    </TableRow>
                                    <TableRow className="border-gray-200">
                                      <TableCell className="font-medium text-gray-700 py-2">{bankDetails.routingType}</TableCell>
                                      <TableCell className="text-gray-600 py-2">{bankDetails.routingCode}</TableCell>
                                    </TableRow>
                                  </>
                                );
                              })()}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {companyData.signatureUrl && (
                      <div>
                        <h4 className="font-semibold mb-3 text-gray-900">Digital Signature</h4>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <img 
                            src={companyData.signatureUrl} 
                            alt="Digital Signature" 
                            className="max-w-32 h-16 object-contain border border-gray-200 rounded"
                          />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {loading ? (
                      <div className="space-y-2">
                        <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                        <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                      </div>
                    ) : (
                      <p>Company information not available</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="bg-green-50 border-b">
                <CardTitle className="text-lg font-semibold text-gray-900">Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{invoice.clientName}</h3>
                  <p className="text-gray-600">{invoice.clientEmail}</p>
                </div>

                {clientData ? (
                  <>
                    <Separator />
                    
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-900">
                        <MapPin className="w-4 h-4 text-gray-600" />
                        Address
                      </h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-700">
                          {clientData.address}<br />
                          {clientData.city}, {clientData.state} {clientData.pincode}<br />
                          {clientData.country}
                        </p>
                      </div>
                    </div>

                    {clientData.phone && (
                      <div>
                        <h4 className="font-semibold mb-2 text-gray-900">Phone</h4>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-gray-700">{clientData.phone}</p>
                        </div>
                      </div>
                    )}

                    {(clientData.taxInfo || invoice.clientTaxInfo) && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-900">
                          <FileText className="w-4 h-4 text-gray-600" />
                          Tax Information
                        </h4>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          {invoice.clientTaxInfo?.id ? (
                            <p className="text-gray-700">
                              <span className="font-medium">{invoice.clientTaxInfo.type}:</span> {invoice.clientTaxInfo.id}
                            </p>
                          ) : clientData.taxInfo?.id ? (
                            <p className="text-gray-700">
                              <span className="font-medium">{clientData.taxInfo.type}:</span> {clientData.taxInfo.id}
                            </p>
                          ) : (
                            <p className="text-gray-500 italic">No tax information available</p>
                          )}
                        </div>
                      </div>
                    )}

                    {clientData.gstin && (
                      <div>
                        <h4 className="font-semibold mb-2 text-gray-900">GSTIN</h4>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-gray-700">{clientData.gstin}</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    {loading ? (
                      <div className="space-y-2">
                        <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                        <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                      </div>
                    ) : (
                      <p>Client information not available</p>
                    )}
                  </div>
                )}

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Issue Date:</span>
                    </div>
                    <span className="font-medium text-gray-900">{invoice.issueDate?.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Due Date:</span>
                    </div>
                    <span className="font-medium text-gray-900">{invoice.dueDate?.toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Items */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="bg-yellow-50 border-b">
              <CardTitle className="text-lg font-semibold text-gray-900">Invoice Items</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {invoice.items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{item.description}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Qty: <span className="font-medium">{item.quantity}</span> × {formatCurrency(item.rate || 0, companyCountry)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg text-gray-900">
                        {formatCurrency(item.amount || 0, companyCountry)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <div className="space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span className="font-medium">{formatCurrency(invoice.subtotal || 0, companyCountry)}</span>
                </div>
                
                {(invoice.cgst || 0) > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>CGST:</span>
                    <span className="font-medium">{formatCurrency(invoice.cgst || 0, companyCountry)}</span>
                  </div>
                )}
                
                {(invoice.sgst || 0) > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>SGST:</span>
                    <span className="font-medium">{formatCurrency(invoice.sgst || 0, companyCountry)}</span>
                  </div>
                )}
                
                {(invoice.igst || 0) > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>IGST:</span>
                    <span className="font-medium">{formatCurrency(invoice.igst || 0, companyCountry)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-gray-700">
                  <span>Total Tax:</span>
                  <span className="font-medium">{formatCurrency(invoice.totalGst || 0, companyCountry)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-bold text-xl text-gray-900 bg-blue-50 p-3 rounded-lg">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(invoice.totalAmount || 0, companyCountry)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes and Terms */}
          {(invoice.notes || invoice.terms) && (
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="pt-6 p-6">
                {invoice.notes && (
                  <div className="mb-6">
                    <h4 className="font-semibold mb-3 text-gray-900">Notes:</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 leading-relaxed">{invoice.notes}</p>
                    </div>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <h4 className="font-semibold mb-3 text-gray-900">Terms & Conditions:</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 leading-relaxed">{invoice.terms}</p>
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

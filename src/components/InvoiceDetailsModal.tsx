
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
        // Fetch company data
        const companyDoc = await getDoc(doc(db, 'companies', invoice.companyId || ''));
        if (companyDoc.exists()) {
          setCompanyData(companyDoc.data() as CompanyData);
        }

        // Fetch client data
        const clientDoc = await getDoc(doc(db, 'clients', invoice.clientId));
        if (clientDoc.exists()) {
          setClientData(clientDoc.data() as Client);
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

Issue Date: ${invoice.issueDate?.toLocaleDateString()}
Due Date: ${invoice.dueDate?.toLocaleDateString()}

Items:
${invoice.items?.map(item => 
  `${item.description} - Qty: ${item.quantity} - Rate: ${item.rate} - Amount: ${item.amount}`
).join('\n')}

Subtotal: ${(invoice.subtotal || 0).toLocaleString()}
Total Tax: ${(invoice.totalGst || 0).toLocaleString()}
TOTAL AMOUNT: ${(invoice.totalAmount || 0).toLocaleString()}

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

        {loading && (
          <div className="text-center py-4">Loading additional details...</div>
        )}

        <div className="space-y-6">
          {/* Invoice Header */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold">Invoice #{invoice.invoiceNumber}</h1>
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
                        {formatCurrency(invoice.clientAmount || 0, clientCountry)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Company ({companyCurrency.code}) / Client ({clientCurrency.code})
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-2xl font-bold">
                        {formatCurrency(invoice.totalAmount || 0, companyCountry)}
                      </p>
                      <p className="text-sm text-gray-500">Total Amount</p>
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
                {companyData && (
                  <>
                    <div className="flex items-center gap-4">
                      {companyData.logoUrl && (
                        <img 
                          src={companyData.logoUrl} 
                          alt="Company Logo" 
                          className="w-16 h-16 object-contain rounded"
                        />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold">{companyData.companyName}</h3>
                        <p className="text-sm text-gray-600">{companyData.email}</p>
                        <p className="text-sm text-gray-600">{companyData.phone}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Address
                      </h4>
                      <p className="text-sm text-gray-600">
                        {companyData.streetAddress}<br />
                        {companyData.city}, {companyData.country}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Tax Information
                      </h4>
                      <p className="text-sm text-gray-600">
                        {companyData.taxInfo.primaryType}: {companyData.taxInfo.primaryId}
                        {companyData.taxInfo.secondaryId && (
                          <><br />Secondary ID: {companyData.taxInfo.secondaryId}</>
                        )}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Bank Information
                      </h4>
                      <p className="text-sm text-gray-600">
                        Bank: {companyData.bankInfo.bankName}<br />
                        Account: {companyData.bankInfo.accountNumber}<br />
                        {companyData.bankInfo.routingType}: {companyData.bankInfo.routingCode}
                      </p>
                    </div>

                    {companyData.signatureUrl && (
                      <div>
                        <h4 className="font-medium mb-2">Digital Signature</h4>
                        <img 
                          src={companyData.signatureUrl} 
                          alt="Digital Signature" 
                          className="max-w-32 h-16 object-contain border rounded"
                        />
                      </div>
                    )}
                  </>
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
                  <h3 className="text-lg font-semibold">{invoice.clientName}</h3>
                  <p className="text-sm text-gray-600">{invoice.clientEmail}</p>
                </div>

                {clientData && (
                  <>
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Address
                      </h4>
                      <p className="text-sm text-gray-600">
                        {clientData.address}<br />
                        {clientData.city}, {clientData.state} {clientData.pincode}<br />
                        {clientData.country}
                      </p>
                    </div>

                    {clientData.phone && (
                      <div>
                        <h4 className="font-medium mb-2">Phone</h4>
                        <p className="text-sm text-gray-600">{clientData.phone}</p>
                      </div>
                    )}

                    {clientData.taxInfo && (
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Tax Information
                        </h4>
                        <p className="text-sm text-gray-600">
                          {clientData.taxInfo.type}: {clientData.taxInfo.id}
                        </p>
                      </div>
                    )}

                    {clientData.gstin && (
                      <div>
                        <h4 className="font-medium mb-2">GSTIN</h4>
                        <p className="text-sm text-gray-600">{clientData.gstin}</p>
                      </div>
                    )}
                  </>
                )}

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
                  <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-gray-600">
                        Qty: {item.quantity} × {formatCurrency(item.rate || 0, companyCountry)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(item.amount || 0, companyCountry)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(invoice.subtotal || 0, companyCountry)}</span>
                </div>
                
                {(invoice.cgst || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>CGST:</span>
                    <span>{formatCurrency(invoice.cgst || 0, companyCountry)}</span>
                  </div>
                )}
                
                {(invoice.sgst || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>SGST:</span>
                    <span>{formatCurrency(invoice.sgst || 0, companyCountry)}</span>
                  </div>
                )}
                
                {(invoice.igst || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>IGST:</span>
                    <span>{formatCurrency(invoice.igst || 0, companyCountry)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Total Tax:</span>
                  <span>{formatCurrency(invoice.totalGst || 0, companyCountry)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(invoice.totalAmount || 0, companyCountry)}</span>
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

export default InvoiceDetailsModal;

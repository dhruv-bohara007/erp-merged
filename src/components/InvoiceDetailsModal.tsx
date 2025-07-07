
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, MapPin, Globe, Building, CreditCard, FileText, Phone } from 'lucide-react';
import { Invoice } from '@/hooks/useFirestore';
import { CompanyData } from '@/hooks/useCompanyData';
import { Client } from '@/hooks/useFirestore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCurrencyByCountry } from '@/data/countryCurrencyMapping';
import 'bootstrap/dist/css/bootstrap.min.css';

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
      case 'paid': return 'success';
      case 'sent': return 'primary';
      case 'draft': return 'secondary';
      case 'overdue': return 'danger';
      default: return 'secondary';
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
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${invoice.invoiceNumber}.txt`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    
    const bankName = bankInfo.bankName || bankInfo.bank_name || 'N/A';
    const accountNumber = bankInfo.accountNumber || bankInfo.account_number || 'N/A';
    const routingCode = bankInfo.routingCode || bankInfo.routing_code || bankInfo.ifscCode || bankInfo.ifsc_code || 'N/A';
    const routingType = bankInfo.routingType || bankInfo.routing_type || 'Routing Code';
    
    return { bankName, accountNumber, routingCode, routingType };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="modal-dialog modal-xl" style={{ maxWidth: '1200px', width: '90vw' }}>
        <div className="modal-content">
          <DialogHeader className="modal-header bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center w-100">
              <DialogTitle className="modal-title h3 mb-0">Invoice Details</DialogTitle>
              <Button
                variant="outline"
                className="btn btn-light"
                onClick={handleDownloadPDF}
              >
                <Download className="me-2" style={{ width: '16px', height: '16px' }} />
                Download PDF
              </Button>
            </div>
          </DialogHeader>

          <div className="modal-body p-4">
            {/* Invoice Header */}
            <div className="card mb-4 border-primary">
              <div className="card-header bg-primary text-white">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h1 className="h2 mb-2">Invoice #{invoice.invoiceNumber}</h1>
                    <Badge className={`badge bg-${getStatusColor(invoice.status || 'draft')}`}>
                      {(invoice.status || 'draft').charAt(0).toUpperCase() + (invoice.status || 'draft').slice(1)}
                    </Badge>
                  </div>
                  <div className="text-end">
                    {showDualCurrency ? (
                      <div>
                        <p className="h2 mb-1">
                          {formatCurrency(invoice.companyAmount || invoice.totalAmount || 0, companyCountry)}
                        </p>
                        <p className="h5 mb-1 opacity-75">
                          {formatCurrency(invoice.clientAmount || 0, clientCountry)}
                        </p>
                        <small className="opacity-75">
                          Company ({companyCurrency.code}) / Client ({clientCurrency.code})
                        </small>
                      </div>
                    ) : (
                      <div>
                        <p className="h2 mb-1">
                          {formatCurrency(invoice.totalAmount || 0, companyCountry)}
                        </p>
                        <small className="opacity-75">Total Amount</small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              {/* Company Information */}
              <div className="col-lg-6 mb-4">
                <div className="card h-100 border-info">
                  <div className="card-header bg-info text-white">
                    <h5 className="card-title mb-0 d-flex align-items-center">
                      <Building className="me-2" style={{ width: '20px', height: '20px' }} />
                      Company Information
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                      {(companyData?.logoUrl || invoice.logoUrl) && (
                        <img 
                          src={companyData?.logoUrl || invoice.logoUrl} 
                          alt="Company Logo" 
                          className="me-3 border rounded"
                          style={{ width: '80px', height: '80px', objectFit: 'contain' }}
                        />
                      )}
                      <div>
                        <h4 className="mb-1">{invoice.companyName}</h4>
                        {companyData?.email && (
                          <p className="text-muted mb-1">{companyData.email}</p>
                        )}
                        {(companyData?.phone || invoice.companyPhone) && (
                          <p className="text-muted mb-0 d-flex align-items-center">
                            <Phone className="me-1" style={{ width: '16px', height: '16px' }} />
                            {companyData?.phone || invoice.companyPhone}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <hr />
                    
                    <div className="mb-3">
                      <h6 className="d-flex align-items-center mb-2">
                        <MapPin className="me-2 text-info" style={{ width: '18px', height: '18px' }} />
                        Address
                      </h6>
                      <div className="bg-light p-3 rounded border">
                        <address className="mb-0">
                          {invoice.companyAddress || companyData?.streetAddress}<br />
                          {invoice.companyCity || companyData?.city}<br />
                          {companyCountry === 'IN' ? 'India' : companyCountry}
                        </address>
                      </div>
                    </div>

                    <div className="mb-3">
                      <h6 className="d-flex align-items-center mb-2">
                        <FileText className="me-2 text-info" style={{ width: '18px', height: '18px' }} />
                        Tax Information
                      </h6>
                      <div className="bg-light p-3 rounded border">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <strong>GSTIN:</strong>
                          <span className="badge bg-secondary font-monospace fs-6">
                            {invoice.GSTIN || 'Not Available'}
                          </span>
                        </div>
                        {companyData?.taxInfo?.secondaryId && (
                          <div className="d-flex justify-content-between align-items-center">
                            <strong>Secondary ID:</strong>
                            <span className="badge bg-secondary font-monospace fs-6">
                              {companyData.taxInfo.secondaryId}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {(companyData?.bankInfo || invoice.bankInfo) && (
                      <div className="mb-3">
                        <h6 className="d-flex align-items-center mb-2">
                          <CreditCard className="me-2 text-info" style={{ width: '18px', height: '18px' }} />
                          Bank Information
                        </h6>
                        <div className="table-responsive">
                          <table className="table table-sm table-bordered">
                            <tbody>
                              {(() => {
                                const bankDetails = formatBankInfo(companyData?.bankInfo || invoice.bankInfo);
                                if (!bankDetails) return (
                                  <tr>
                                    <td colSpan={2} className="text-center text-muted">
                                      No bank information available
                                    </td>
                                  </tr>
                                );
                                
                                return (
                                  <>
                                    <tr>
                                      <td className="fw-bold bg-light" style={{ width: '40%' }}>Bank Name</td>
                                      <td>{bankDetails.bankName}</td>
                                    </tr>
                                    <tr>
                                      <td className="fw-bold bg-light">Account Number</td>
                                      <td className="font-monospace">{bankDetails.accountNumber}</td>
                                    </tr>
                                    <tr>
                                      <td className="fw-bold bg-light">{bankDetails.routingType}</td>
                                      <td className="font-monospace">{bankDetails.routingCode}</td>
                                    </tr>
                                  </>
                                );
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {(companyData?.signatureUrl || invoice.signatureUrl) && (
                      <div>
                        <h6 className="mb-2">Digital Signature</h6>
                        <div className="bg-light p-3 rounded border">
                          <img 
                            src={companyData?.signatureUrl || invoice.signatureUrl} 
                            alt="Digital Signature" 
                            className="border rounded bg-white p-2"
                            style={{ maxWidth: '160px', height: '80px', objectFit: 'contain' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Client Information */}
              <div className="col-lg-6 mb-4">
                <div className="card h-100 border-success">
                  <div className="card-header bg-success text-white">
                    <h5 className="card-title mb-0">Client Information</h5>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <h4 className="mb-1">{invoice.clientName}</h4>
                      <p className="text-muted mb-1">{invoice.clientEmail}</p>
                      {(clientData?.phone || invoice.clientPhone) && (
                        <p className="text-muted mb-0 d-flex align-items-center">
                          <Phone className="me-1" style={{ width: '16px', height: '16px' }} />
                          {clientData?.phone || invoice.clientPhone}
                        </p>
                      )}
                    </div>

                    <hr />
                    
                    <div className="mb-3">
                      <h6 className="d-flex align-items-center mb-2">
                        <MapPin className="me-2 text-success" style={{ width: '18px', height: '18px' }} />
                        Address
                      </h6>
                      <div className="bg-light p-3 rounded border">
                        <address className="mb-0">
                          {invoice.clientAddress || clientData?.address}<br />
                          {invoice.clientState || clientData?.state} {invoice.clientPincode || clientData?.pincode}<br />
                          {clientCountry === 'GB' ? 'United Kingdom' : clientCountry}
                        </address>
                      </div>
                    </div>

                    <div className="mb-3">
                      <h6 className="d-flex align-items-center mb-2">
                        <Globe className="me-2 text-success" style={{ width: '18px', height: '18px' }} />
                        Country & Currency
                      </h6>
                      <div className="bg-light p-3 rounded border">
                        <p className="mb-0">
                          <strong>Country:</strong> {clientCountry === 'GB' ? 'United Kingdom' : clientCountry} ({clientCurrency.code})
                        </p>
                      </div>
                    </div>

                    {(invoice.clientTaxInfo?.id || clientData?.taxInfo?.id) && (
                      <div className="mb-3">
                        <h6 className="d-flex align-items-center mb-2">
                          <FileText className="me-2 text-success" style={{ width: '18px', height: '18px' }} />
                          Tax Information
                        </h6>
                        <div className="bg-light p-3 rounded border">
                          <div className="d-flex justify-content-between align-items-center">
                            <strong>
                              {invoice.clientTaxInfo?.type || clientData?.taxInfo?.type || 'Tax ID'}:
                            </strong>
                            <span className="badge bg-secondary font-monospace fs-6">
                              {invoice.clientTaxInfo?.id || clientData?.taxInfo?.id}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <hr />

                    <div className="row">
                      <div className="col-sm-6 mb-3">
                        <div className="d-flex align-items-center justify-content-between p-3 bg-primary bg-opacity-10 rounded border border-primary border-opacity-25">
                          <div className="d-flex align-items-center">
                            <Calendar className="me-2 text-primary" style={{ width: '18px', height: '18px' }} />
                            <strong>Issue Date:</strong>
                          </div>
                          <span className="fw-bold">{invoice.issueDate?.toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="col-sm-6 mb-3">
                        <div className="d-flex align-items-center justify-content-between p-3 bg-warning bg-opacity-10 rounded border border-warning border-opacity-25">
                          <div className="d-flex align-items-center">
                            <Calendar className="me-2 text-warning" style={{ width: '18px', height: '18px' }} />
                            <strong>Due Date:</strong>
                          </div>
                          <span className="fw-bold">{invoice.dueDate?.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Items */}
            <div className="card mb-4 border-warning">
              <div className="card-header bg-warning text-dark">
                <h5 className="card-title mb-0">Invoice Items</h5>
              </div>
              <div className="card-body">
                <div className="mb-4">
                  {invoice.items?.map((item, index) => (
                    <div key={index} className="d-flex justify-content-between align-items-center p-3 mb-3 bg-light rounded border">
                      <div className="flex-grow-1">
                        <h6 className="mb-1">{item.description}</h6>
                        <p className="text-muted mb-0">
                          <strong>Qty:</strong> {item.quantity} × {formatCurrency(item.rate || 0, companyCountry)}
                        </p>
                      </div>
                      <div className="text-end">
                        <h5 className="mb-0">
                          {formatCurrency(item.amount || 0, companyCountry)}
                        </h5>
                        <small className="text-muted">Line Total</small>
                      </div>
                    </div>
                  ))}
                </div>

                <hr />

                <div className="row">
                  <div className="col-md-6 offset-md-6">
                    <table className="table table-borderless">
                      <tbody>
                        <tr>
                          <td className="fw-bold">Subtotal:</td>
                          <td className="text-end fw-bold">{formatCurrency(invoice.subtotal || 0, companyCountry)}</td>
                        </tr>
                        
                        {(invoice.cgst || 0) > 0 && (
                          <tr>
                            <td className="fw-bold">CGST:</td>
                            <td className="text-end fw-bold">{formatCurrency(invoice.cgst || 0, companyCountry)}</td>
                          </tr>
                        )}
                        
                        {(invoice.sgst || 0) > 0 && (
                          <tr>
                            <td className="fw-bold">SGST:</td>
                            <td className="text-end fw-bold">{formatCurrency(invoice.sgst || 0, companyCountry)}</td>
                          </tr>
                        )}
                        
                        {(invoice.igst || 0) > 0 && (
                          <tr>
                            <td className="fw-bold">IGST:</td>
                            <td className="text-end fw-bold">{formatCurrency(invoice.igst || 0, companyCountry)}</td>
                          </tr>
                        )}
                        
                        <tr>
                          <td className="fw-bold">Total Tax:</td>
                          <td className="text-end fw-bold">{formatCurrency(invoice.totalGst || 0, companyCountry)}</td>
                        </tr>
                        
                        <tr className="table-primary">
                          <td className="fw-bold h5">Total Amount:</td>
                          <td className="text-end fw-bold h5">{formatCurrency(invoice.totalAmount || 0, companyCountry)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes and Terms */}
            {(invoice.notes || invoice.terms) && (
              <div className="card border-secondary">
                <div className="card-body">
                  {invoice.notes && (
                    <div className="mb-4">
                      <h5 className="card-title">Notes:</h5>
                      <div className="bg-light p-3 rounded border">
                        <p className="mb-0">{invoice.notes}</p>
                      </div>
                    </div>
                  )}
                  {invoice.terms && (
                    <div>
                      <h5 className="card-title">Terms & Conditions:</h5>
                      <div className="bg-light p-3 rounded border">
                        <p className="mb-0">{invoice.terms}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDetailsModal;

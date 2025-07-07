
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Download, MapPin, Globe, Phone, Building, FileText, CreditCard } from 'lucide-react';
import { Invoice } from '@/hooks/useFirestore';
import { getCurrencyByCountry } from '@/data/countryCurrencyMapping';
import jsPDF from 'jspdf';

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
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = 30;

    // Header
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INVOICE', margin, yPosition);
    
    // Invoice number and status
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Invoice #${invoice.invoiceNumber}`, pageWidth - margin - 50, yPosition);
    pdf.text(`Status: ${invoice.status?.toUpperCase() || 'DRAFT'}`, pageWidth - margin - 50, yPosition + 10);
    
    yPosition += 30;

    // Company Information
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('From:', margin, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(invoice.companyName || '', margin, yPosition);
    yPosition += 8;
    if (invoice.companyAddress) {
      pdf.text(invoice.companyAddress, margin, yPosition);
      yPosition += 8;
    }
    if (invoice.companyPhone) {
      pdf.text(`Phone: ${invoice.companyPhone}`, margin, yPosition);
      yPosition += 8;
    }

    // Client Information
    yPosition += 10;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Bill To:', margin, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(invoice.clientName, margin, yPosition);
    yPosition += 8;
    pdf.text(invoice.clientEmail, margin, yPosition);
    yPosition += 8;
    if (invoice.clientAddress) {
      pdf.text(invoice.clientAddress, margin, yPosition);
      yPosition += 8;
    }

    // Dates
    yPosition += 10;
    pdf.text(`Issue Date: ${invoice.issueDate?.toLocaleDateString()}`, margin, yPosition);
    pdf.text(`Due Date: ${invoice.dueDate?.toLocaleDateString()}`, pageWidth - margin - 80, yPosition);
    yPosition += 20;

    // Items table header
    pdf.setFont('helvetica', 'bold');
    pdf.text('Description', margin, yPosition);
    pdf.text('Qty', pageWidth - 120, yPosition);
    pdf.text('Rate', pageWidth - 80, yPosition);
    pdf.text('Amount', pageWidth - 40, yPosition);
    yPosition += 5;
    
    // Line under header
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Items
    pdf.setFont('helvetica', 'normal');
    invoice.items?.forEach((item) => {
      pdf.text(item.description, margin, yPosition);
      pdf.text(item.quantity.toString(), pageWidth - 120, yPosition);
      pdf.text(`₹${item.rate?.toFixed(2)}`, pageWidth - 80, yPosition);
      pdf.text(`₹${item.amount?.toFixed(2)}`, pageWidth - 40, yPosition);
      yPosition += 12;
    });

    yPosition += 10;
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 15;

    // Totals
    const totalsX = pageWidth - 100;
    pdf.text(`Subtotal: ₹${(invoice.subtotal || 0).toFixed(2)}`, totalsX, yPosition);
    yPosition += 10;
    
    if (invoice.cgst > 0) {
      pdf.text(`CGST: ₹${(invoice.cgst || 0).toFixed(2)}`, totalsX, yPosition);
      yPosition += 10;
    }
    if (invoice.sgst > 0) {
      pdf.text(`SGST: ₹${(invoice.sgst || 0).toFixed(2)}`, totalsX, yPosition);
      yPosition += 10;
    }
    if (invoice.igst > 0) {
      pdf.text(`IGST: ₹${(invoice.igst || 0).toFixed(2)}`, totalsX, yPosition);
      yPosition += 10;
    }
    
    pdf.text(`Total Tax: ₹${(invoice.totalGst || 0).toFixed(2)}`, totalsX, yPosition);
    yPosition += 15;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text(`TOTAL: ₹${(invoice.totalAmountINR || invoice.totalAmount || 0).toFixed(2)}`, totalsX, yPosition);

    // Notes and Terms
    if (invoice.notes || invoice.terms) {
      yPosition += 30;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      
      if (invoice.notes) {
        pdf.text('Notes:', margin, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        pdf.text(invoice.notes, margin, yPosition);
        yPosition += 15;
      }
      
      if (invoice.terms) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Terms & Conditions:', margin, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        pdf.text(invoice.terms, margin, yPosition);
      }
    }

    pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
                <p className="text-sm text-gray-500 mt-1">#{invoice.invoiceNumber}</p>
              </div>
              <Badge className={`${getStatusColor(invoice.status || 'draft')} border font-medium px-3 py-1`}>
                {(invoice.status || 'draft').charAt(0).toUpperCase() + (invoice.status || 'draft').slice(1)}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(invoice.totalAmountINR || invoice.totalAmount || 0, companyCountry)}
              </div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                className="mt-2"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Company and Client Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* From - Company Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Building className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">From</h3>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  {invoice.logoUrl && (
                    <img 
                      src={invoice.logoUrl} 
                      alt="Company Logo" 
                      className="w-12 h-12 object-contain rounded border bg-white p-1"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{invoice.companyName}</h4>
                    {invoice.companyPhone && (
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" />
                        {invoice.companyPhone}
                      </p>
                    )}
                  </div>
                </div>
                
                {invoice.companyAddress && (
                  <div className="text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p>{invoice.companyAddress}</p>
                        {invoice.companyCity && <p>{invoice.companyCity}</p>}
                        <p>{getCountryName(companyCountry)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {invoice.companyTaxInfo && (
                  <div className="text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p>GSTIN: {invoice.companyTaxInfo.gstin}</p>
                        {invoice.companyTaxInfo.pan && <p>PAN: {invoice.companyTaxInfo.pan}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* To - Client Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">T</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Bill To</h3>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{invoice.clientName}</h4>
                  <p className="text-sm text-gray-600">{invoice.clientEmail}</p>
                  {invoice.clientPhone && (
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3" />
                      {invoice.clientPhone}
                    </p>
                  )}
                </div>
                
                <div className="text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      {invoice.clientAddress && <p>{invoice.clientAddress}</p>}
                      {invoice.clientState && <p>State: {invoice.clientState}</p>}
                      {invoice.clientPincode && <p>Pincode: {invoice.clientPincode}</p>}
                      <p>Country: {getCountryName(clientCountry)}</p>
                    </div>
                  </div>
                </div>

                {invoice.clientTaxInfo && (
                  <div className="text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p>{invoice.clientTaxInfo.type}: {invoice.clientTaxInfo.id}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 rounded-lg p-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Issue Date</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {invoice.issueDate?.toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Due Date</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {invoice.dueDate?.toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Currency</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {companyCurrency.code} ({companyCurrency.symbol})
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <Badge className={`${getStatusColor(invoice.status || 'draft')} border text-xs mt-1`}>
                {(invoice.status || 'draft').charAt(0).toUpperCase() + (invoice.status || 'draft').slice(1)}
              </Badge>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Items</h3>
            
            <div className="border rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="bg-gray-50 px-4 py-3 grid grid-cols-12 gap-4 font-medium text-sm text-gray-700">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Rate</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>
              
              {/* Table Body */}
              <div className="divide-y">
                {invoice.items?.map((item, index) => (
                  <div key={index} className="px-4 py-4 grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-6">
                      <p className="font-medium text-gray-900">{item.description}</p>
                    </div>
                    <div className="col-span-2 text-center text-gray-600">
                      {item.quantity}
                    </div>
                    <div className="col-span-2 text-right text-gray-600">
                      {formatCurrency(item.rate || 0, companyCountry)}
                    </div>
                    <div className="col-span-2 text-right font-medium text-gray-900">
                      {formatCurrency(item.amount || 0, companyCountry)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end">
              <div className="w-full max-w-sm space-y-2">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(invoice.subtotal || 0, companyCountry)}</span>
                </div>
                
                {(invoice.cgst || 0) > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">CGST:</span>
                    <span>{formatCurrency(invoice.cgst || 0, companyCountry)}</span>
                  </div>
                )}
                
                {(invoice.sgst || 0) > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">SGST:</span>
                    <span>{formatCurrency(invoice.sgst || 0, companyCountry)}</span>
                  </div>
                )}
                
                {(invoice.igst || 0) > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">IGST:</span>
                    <span>{formatCurrency(invoice.igst || 0, companyCountry)}</span>
                  </div>
                )}
                
                <div className="flex justify-between py-2 border-t">
                  <span className="text-gray-600">Total Tax:</span>
                  <span className="font-medium">{formatCurrency(invoice.totalGst || 0, companyCountry)}</span>
                </div>
                
                <div className="flex justify-between py-3 border-t-2 border-gray-900">
                  <span className="text-lg font-bold text-gray-900">Total:</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(invoice.totalAmountINR || invoice.totalAmount || 0, companyCountry)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes and Terms */}
          {(invoice.notes || invoice.terms) && (
            <div className="space-y-4 border-t pt-6">
              {invoice.notes && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Terms & Conditions</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{invoice.terms}</p>
                </div>
              )}
            </div>
          )}

          {/* Digital Signature */}
          {invoice.signatureUrl && (
            <div className="border-t pt-6">
              <div className="flex justify-end">
                <div className="text-center">
                  <img 
                    src={invoice.signatureUrl} 
                    alt="Digital Signature" 
                    className="max-w-32 h-16 object-contain border-b border-gray-300 mb-2"
                  />
                  <p className="text-xs text-gray-500">Authorized Signature</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceView;

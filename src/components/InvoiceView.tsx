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
      // Use the stored country fields from the invoice with fallbacks
      const companyCountry = invoice.companyCountry || 'US';
      const clientCountry = invoice.clientCountry || companyCountry;

      const companyCurrency = getCurrencyByCountry(companyCountry);
      const clientCurrency = getCurrencyByCountry(clientCountry);
      
      const formatCurrency = (amount: number, countryCode: string) => {
        const currencyInfo = getCurrencyByCountry(countryCode);
        return `${currencyInfo.symbol}${amount.toFixed(2)}`;
      };

      const showDualCurrency = companyCountry !== clientCountry && invoice.conversionRate;
      const companyToINRRate = invoice.conversionRate?.companyToINR || 1;
      const INRToClientRate = invoice.conversionRate?.INRToClient || 1;

      const convertCompanyToINR = (amount: number) => amount * companyToINRRate;
      const convertINRToClient = (amountINR: number) => amountINR * INRToClientRate;

      // Create comprehensive HTML for professional PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6; 
              color: #1f2937;
              background: #ffffff;
              padding: 20px;
            }
            .container { max-width: 800px; margin: 0 auto; }
            
            /* Header Section */
            .invoice-header { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start;
              margin-bottom: 40px;
              padding: 30px;
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              border-radius: 12px;
              border: 2px solid #e2e8f0;
            }
            .logo-section {
              display: flex;
              align-items: center;
              gap: 20px;
            }
            .company-logo { 
              width: 80px; 
              height: 80px; 
              object-fit: contain;
              border-radius: 8px;
              border: 2px solid #e5e7eb;
            }
            .invoice-title {
              font-size: 48px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 10px;
            }
            .invoice-number {
              font-size: 24px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 15px;
            }
            .invoice-status {
              display: inline-block;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: 600;
              text-transform: uppercase;
              font-size: 14px;
              border: 2px solid;
            }
            .status-paid { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
            .status-sent { background: #dbeafe; color: #1e40af; border-color: #bfdbfe; }
            .status-draft { background: #f3f4f6; color: #374151; border-color: #d1d5db; }
            .status-overdue { background: #fee2e2; color: #dc2626; border-color: #fecaca; }
            
            .total-amount {
              text-align: right;
              background: white;
              padding: 20px;
              border-radius: 12px;
              border: 2px solid #e5e7eb;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .amount-primary {
              font-size: 32px;
              font-weight: bold;
              color: #059669;
              margin-bottom: 8px;
            }
            .amount-secondary {
              font-size: 18px;
              color: #6b7280;
            }

            /* Dates Section */
            .dates-section {
              display: flex;
              gap: 30px;
              margin: 20px 0;
              padding: 20px;
              background: #f9fafb;
              border-radius: 8px;
            }
            .date-item {
              display: flex;
              align-items: center;
              gap: 8px;
              font-weight: 600;
            }

            /* Two Column Layout */
            .two-column {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              margin: 40px 0;
            }
            
            /* Card Styles */
            .info-card {
              background: white;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .card-header {
              padding: 20px;
              font-size: 18px;
              font-weight: bold;
              color: #1f2937;
              border-bottom: 2px solid #e5e7eb;
            }
            .company-header { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); }
            .client-header { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); }
            
            .card-content { padding: 25px; }
            .info-section {
              margin-bottom: 25px;
              padding: 20px;
              background: #f9fafb;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
            }
            .section-title {
              font-weight: bold;
              color: #374151;
              margin-bottom: 12px;
              font-size: 16px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            
            /* Table Styles */
            .bank-table, .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
              background: white;
              border-radius: 8px;
              overflow: hidden;
              border: 1px solid #e5e7eb;
            }
            .bank-table th, .bank-table td,
            .items-table th, .items-table td {
              padding: 12px 16px;
              text-align: left;
              border-bottom: 1px solid #e5e7eb;
            }
            .bank-table th, .items-table th {
              background: #f9fafb;
              font-weight: 600;
              color: #374151;
            }
            .bank-table tr:last-child td,
            .items-table tr:last-child td {
              border-bottom: none;
            }
            .items-table th:nth-child(2),
            .items-table td:nth-child(2) { text-align: center; }
            .items-table th:nth-child(3),
            .items-table th:nth-child(4),
            .items-table td:nth-child(3),
            .items-table td:nth-child(4) { text-align: right; }
            
            /* Signature Section */
            .signature-section {
              margin-top: 25px;
              padding: 20px;
              background: linear-gradient(135deg, #faf5ff 0%, #e9d5ff 100%);
              border-radius: 8px;
              border: 1px solid #d8b4fe;
            }
            .signature-image {
              max-width: 200px;
              height: 80px;
              object-contain;
              border: 2px solid white;
              border-radius: 8px;
              background: white;
              padding: 10px;
              margin-top: 10px;
            }
            
            /* Summary Section */
            .summary-section {
              margin-top: 40px;
              padding: 30px;
              background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
              border-radius: 12px;
              border: 2px solid #bfdbfe;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 12px;
              font-size: 16px;
            }
            .summary-total {
              font-size: 20px;
              font-weight: bold;
              padding-top: 15px;
              border-top: 2px solid #60a5fa;
              color: #1e40af;
            }
            
            /* Notes Section */
            .notes-section {
              margin-top: 30px;
              padding: 25px;
              background: #fefce8;
              border-radius: 8px;
              border: 1px solid #fde047;
            }
            
            /* Footer */
            .invoice-footer {
              margin-top: 40px;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              padding: 20px;
              border-top: 1px solid #e5e7eb;
            }
            
            .dual-currency {
              font-size: 14px;
              color: #6b7280;
              margin-top: 4px;
            }
            
            @media print {
              body { padding: 0; }
              .container { max-width: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header Section -->
            <div class="invoice-header">
              <div class="logo-section">
                ${invoice.logoUrl ? `<img src="${invoice.logoUrl}" alt="Company Logo" class="company-logo">` : ''}
                <div>
                  <div class="invoice-title">INVOICE</div>
                  <div class="invoice-number">#${invoice.invoiceNumber}</div>
                  <span class="invoice-status status-${invoice.status || 'draft'}">
                    ${(invoice.status || 'draft').toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div class="total-amount">
                <div class="amount-primary">
                  ${formatCurrency(invoice.companyAmount || invoice.totalAmount || 0, companyCountry)}
                </div>
                ${showDualCurrency ? `
                  <div class="amount-secondary">
                    ${formatCurrency(invoice.clientAmount || convertINRToClient(invoice.totalAmountINR || 0), clientCountry)}
                  </div>
                  <div style="font-size: 12px; color: #9ca3af; margin-top: 8px;">
                    ${companyCurrency.code} / ${clientCurrency.code}
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Dates Section -->
            <div class="dates-section">
              <div class="date-item">
                <strong>Issue Date:</strong> ${invoice.issueDate?.toLocaleDateString() || 'N/A'}
              </div>
              <div class="date-item">
                <strong>Due Date:</strong> ${invoice.dueDate?.toLocaleDateString() || 'N/A'}
              </div>
            </div>

            <!-- Two Column Layout -->
            <div class="two-column">
              <!-- Company Information -->
              <div class="info-card">
                <div class="card-header company-header">Company Information</div>
                <div class="card-content">
                  <div class="info-section">
                    <div class="section-title">📍 Contact Details</div>
                    <div><strong>${invoice.companyName}</strong></div>
                    <div>${invoice.companyAddress}</div>
                    ${invoice.companyCity ? `<div>${invoice.companyCity}</div>` : ''}
                    ${invoice.companyPhone ? `<div>📞 ${invoice.companyPhone}</div>` : ''}
                  </div>

                  ${invoice.companyTaxInfo && (invoice.companyTaxInfo.gstin || invoice.companyTaxInfo.pan) ? `
                    <div class="info-section">
                      <div class="section-title">🏛️ Tax Information</div>
                      ${invoice.companyTaxInfo.gstin ? `<div><strong>GSTIN:</strong> ${invoice.companyTaxInfo.gstin}</div>` : ''}
                      ${invoice.companyTaxInfo.pan ? `<div><strong>PAN:</strong> ${invoice.companyTaxInfo.pan}</div>` : ''}
                    </div>
                  ` : ''}

                  ${invoice.bankInfo ? `
                    <div class="info-section">
                      <div class="section-title">🏦 Bank Information</div>
                      <table class="bank-table">
                        <tbody>
                          ${(invoice.bankInfo as any)?.bankName ? `
                            <tr>
                              <td><strong>Bank Name</strong></td>
                              <td>${(invoice.bankInfo as any).bankName}</td>
                            </tr>
                          ` : ''}
                          ${(invoice.bankInfo as any)?.accountNumber ? `
                            <tr>
                              <td><strong>Account Number</strong></td>
                              <td>${(invoice.bankInfo as any).accountNumber}</td>
                            </tr>
                          ` : ''}
                          ${((invoice.bankInfo as any)?.routingCode || (invoice.bankInfo as any)?.ifscCode) ? `
                            <tr>
                              <td><strong>Routing Code</strong></td>
                              <td>${(invoice.bankInfo as any)?.routingCode || (invoice.bankInfo as any)?.ifscCode}</td>
                            </tr>
                          ` : ''}
                        </tbody>
                      </table>
                    </div>
                  ` : ''}

                  ${invoice.signatureUrl ? `
                    <div class="signature-section">
                      <div class="section-title">✍️ Business Owner Signature</div>
                      <img src="${invoice.signatureUrl}" alt="Business Owner Signature" class="signature-image">
                    </div>
                  ` : ''}
                </div>
              </div>

              <!-- Client Information -->
              <div class="info-card">
                <div class="card-header client-header">Client Information</div>
                <div class="card-content">
                  <div class="info-section">
                    <div class="section-title">👤 Contact Details</div>
                    <div><strong>${invoice.clientName}</strong></div>
                    <div>📧 ${invoice.clientEmail}</div>
                    ${invoice.clientPhone ? `<div>📞 ${invoice.clientPhone}</div>` : ''}
                  </div>

                  <div class="info-section">
                    <div class="section-title">📍 Address</div>
                    ${invoice.clientAddress ? `<div>${invoice.clientAddress}</div>` : ''}
                    ${invoice.clientState ? `<div>State: ${invoice.clientState}</div>` : ''}
                    ${invoice.clientPincode ? `<div>Pincode: ${invoice.clientPincode}</div>` : ''}
                  </div>

                  ${invoice.clientTaxInfo?.id ? `
                    <div class="info-section">
                      <div class="section-title">🏛️ Tax Information</div>
                      <div><strong>${invoice.clientTaxInfo.type || 'Tax ID'}:</strong> ${invoice.clientTaxInfo.id}</div>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>

            <!-- Invoice Items -->
            <div class="info-card">
              <div class="card-header" style="background: linear-gradient(135deg, #faf5ff 0%, #e9d5ff 100%);">Invoice Items</div>
              <div class="card-content">
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
                        <td><strong>${item.description}</strong></td>
                        <td>${item.quantity}</td>
                        <td>
                          ${formatCurrency(item.rate || 0, companyCountry)}
                          ${showDualCurrency ? `
                            <div class="dual-currency">
                              (${formatCurrency(convertINRToClient(convertCompanyToINR(item.rate || 0)), clientCountry)})
                            </div>
                          ` : ''}
                        </td>
                        <td>
                          <strong>${formatCurrency(item.amount || 0, companyCountry)}</strong>
                          ${showDualCurrency ? `
                            <div class="dual-currency">
                              (${formatCurrency(convertINRToClient(convertCompanyToINR(item.amount || 0)), clientCountry)})
                            </div>
                          ` : ''}
                        </td>
                      </tr>
                    `).join('') || '<tr><td colspan="4" style="text-align: center; color: #6b7280;">No items</td></tr>'}
                  </tbody>
                </table>

                <!-- Summary Section -->
                <div class="summary-section">
                  <div class="summary-row">
                    <span><strong>Subtotal (${companyCurrency.code}):</strong></span>
                    <span><strong>${formatCurrency(invoice.subtotal || 0, companyCountry)}</strong></span>
                  </div>
                  ${showDualCurrency ? `
                    <div class="summary-row">
                      <span>Subtotal (${clientCurrency.code}):</span>
                      <span>${formatCurrency(convertINRToClient(convertCompanyToINR(invoice.subtotal || 0)), clientCountry)}</span>
                    </div>
                  ` : ''}
                  <div class="summary-row">
                    <span><strong>Total Tax (${companyCurrency.code}):</strong></span>
                    <span><strong>${formatCurrency(invoice.totalGst || 0, companyCountry)}</strong></span>
                  </div>
                  ${showDualCurrency ? `
                    <div class="summary-row">
                      <span>Total Tax (${clientCurrency.code}):</span>
                      <span>${formatCurrency(convertINRToClient(convertCompanyToINR(invoice.totalGst || 0)), clientCountry)}</span>
                    </div>
                  ` : ''}
                  <div class="summary-row summary-total">
                    <span>Total Amount (${companyCurrency.code}):</span>
                    <span>${formatCurrency(invoice.companyAmount || invoice.totalAmount || 0, companyCountry)}</span>
                  </div>
                  ${showDualCurrency ? `
                    <div class="summary-row summary-total">
                      <span>Total Amount (${clientCurrency.code}):</span>
                      <span>${formatCurrency(invoice.clientAmount || convertINRToClient(invoice.totalAmountINR || 0), clientCountry)}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>

            <!-- Notes and Terms -->
            ${(invoice.notes || invoice.terms) ? `
              <div class="notes-section">
                ${invoice.notes ? `
                  <div style="margin-bottom: 20px;">
                    <div class="section-title">📝 Notes</div>
                    <p>${invoice.notes}</p>
                  </div>
                ` : ''}
                ${invoice.terms ? `
                  <div>
                    <div class="section-title">📋 Terms & Conditions</div>
                    <p>${invoice.terms}</p>
                  </div>
                ` : ''}
              </div>
            ` : ''}

            <!-- Footer -->
            <div class="invoice-footer">
              <p><em>Generated on: ${new Date().toLocaleString()}</em></p>
              <p>Thank you for your business!</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Create a new window and trigger print dialog for PDF generation
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Wait for content to load, then trigger print dialog
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          // Note: The print dialog allows users to save as PDF
          // Close window after a delay to allow print dialog to open
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        }, 500);
      } else {
        // Fallback: create downloadable HTML file if popup is blocked
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice-${invoice.invoiceNumber}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('Print dialog blocked. Downloaded HTML file instead. Use browser print to save as PDF.');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Simple fallback
      const companyCountry = invoice.companyCountry || 'US';
      const formatCurrency = (amount: number, countryCode: string) => {
        const currencyInfo = getCurrencyByCountry(countryCode);
        return `${currencyInfo.symbol}${amount.toFixed(2)}`;
      };
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

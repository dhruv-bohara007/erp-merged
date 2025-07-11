import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Download, MapPin, Globe, Phone, Building, FileText, CreditCard, Mail, ExternalLink } from 'lucide-react';
import { Invoice } from '@/hooks/useFirestore';
import { getCurrencyByCountry } from '@/data/countryCurrencyMapping';
import { countryPhoneCodes } from '@/data/countryPhoneCodes';

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

  // Enhanced function to format phone numbers with proper spacing and alignment
  const formatPhoneNumber = (phoneNumber: string, countryCode: string) => {
    if (!phoneNumber) return '';
    
    // Get country code from countryPhoneCodes
    const countryInfo = countryPhoneCodes[countryCode];
    const code = countryInfo?.code || '';
    
    // Remove any existing country code from the phone number to avoid duplication
    let cleanPhoneNumber = phoneNumber.replace(/^\+?\d{1,4}\s*/, '').trim();
    
    // If the phone number is empty after cleaning, use the original
    if (!cleanPhoneNumber) {
      cleanPhoneNumber = phoneNumber;
    }
    
    // Format with consistent spacing: country code + single space + phone number
    return `${code} ${cleanPhoneNumber}`.trim();
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

      // Create clean HTML matching the reference design
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.5; 
              color: #333;
              background: #fff;
              padding: 40px;
            }
            .container { max-width: 800px; margin: 0 auto; }
            
            /* Header Section */
            .invoice-header { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start;
              margin-bottom: 40px;
              page-break-inside: avoid;
            }
            .header-left {
              display: flex;
              align-items: center;
              gap: 20px;
            }
            .company-logo { 
              width: 60px; 
              height: 60px; 
              border-radius: 50%;
              background: #4F46E5;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 24px;
              font-weight: bold;
              flex-shrink: 0;
            }
            .header-info h1 {
              font-size: 28px;
              font-weight: bold;
              color: #1F2937;
              margin-bottom: 4px;
            }
            .invoice-number {
              font-size: 16px;
              color: #6B7280;
              margin-bottom: 8px;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 500;
              text-transform: uppercase;
              background: #DBEAFE;
              color: #1E40AF;
              border: 1px solid #BFDBFE;
            }
            .header-right {
              text-align: right;
            }
            .total-amount {
              font-size: 32px;
              font-weight: bold;
              color: #4F46E5;
              margin-bottom: 4px;
            }
            .total-secondary {
              font-size: 16px;
              color: #6B7280;
              margin-bottom: 8px;
            }
            .currency-note {
              font-size: 12px;
              color: #9CA3AF;
            }

            /* Dates Section */
            .dates-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 40px;
              font-size: 14px;
              color: #6B7280;
            }

            /* Two Column Layout */
            .two-column {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              margin-bottom: 40px;
            }
            
            .info-section {
              background: #F9FAFB;
              padding: 24px;
              border-radius: 8px;
              border: 1px solid #E5E7EB;
            }
            .info-section h3 {
              font-size: 18px;
              font-weight: 600;
              color: #1F2937;
              margin-bottom: 16px;
            }
            .info-group {
              margin-bottom: 16px;
            }
            .info-group:last-child {
              margin-bottom: 0;
            }
            .info-label {
              font-size: 14px;
              font-weight: 500;
              color: #374151;
              margin-bottom: 8px;
            }
            .info-value {
              font-size: 14px;
              color: #6B7280;
              line-height: 1.4;
            }
            .contact-item {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 4px;
            }
            .contact-icon {
              width: 16px;
              height: 16px;
              color: #6B7280;
            }

            /* Items Table */
            .items-section {
              margin-bottom: 40px;
            }
            .items-section h3 {
              font-size: 18px;
              font-weight: 600;
              color: #1F2937;
              margin-bottom: 16px;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
              background: white;
              border: 1px solid #E5E7EB;
              border-radius: 8px;
              overflow: hidden;
            }
            .items-table th {
              background: #F9FAFB;
              padding: 12px 16px;
              text-align: left;
              font-size: 12px;
              font-weight: 500;
              color: #6B7280;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              border-bottom: 1px solid #E5E7EB;
            }
            .items-table td {
              padding: 12px 16px;
              font-size: 14px;
              color: #374151;
              border-bottom: 1px solid #F3F4F6;
            }
            .items-table tr:last-child td {
              border-bottom: none;
            }
            .items-table th:nth-child(2), .items-table td:nth-child(2) { text-align: center; }
            .items-table th:nth-child(3), .items-table td:nth-child(3) { text-align: right; }
            .items-table th:nth-child(4), .items-table td:nth-child(4) { text-align: center; }
            .items-table th:nth-child(5), .items-table td:nth-child(5) { text-align: right; }

            /* Totals Section */
            .totals-section {
              background: #F9FAFB;
              padding: 24px;
              border-radius: 8px;
              border: 1px solid #E5E7EB;
              margin-bottom: 40px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              font-size: 14px;
            }
            .total-row.final {
              font-size: 16px;
              font-weight: bold;
              color: #4F46E5;
              padding-top: 8px;
              border-top: 1px solid #E5E7EB;
              margin-top: 8px;
            }
            .dual-currency {
              font-size: 12px;
              color: #9CA3AF;
              margin-left: 8px;
            }

            /* Terms Section */
            .terms-section {
              background: #F9FAFB;
              padding: 24px;
              border-radius: 8px;
              border: 1px solid #E5E7EB;
              margin-bottom: 40px;
            }
            .terms-section h4 {
              font-size: 16px;
              font-weight: 600;
              color: #1F2937;
              margin-bottom: 12px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .terms-content {
              font-size: 14px;
              color: #6B7280;
              line-height: 1.5;
            }

            /* Footer */
            .footer {
              text-align: center;
              color: #9CA3AF;
              font-size: 16px;
              font-weight: 500;
              padding: 20px 0;
              border-top: 1px solid #E5E7EB;
            }

            /* Utility classes */
            .text-right { text-align: right; }
            .font-mono { font-family: 'Monaco', 'Menlo', monospace; }
            
            @media print {
              body { padding: 20px; }
              .container { max-width: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="invoice-header">
              <div class="header-left">
                <div class="company-logo">
                  ${invoice.logoUrl ? `<img src="${invoice.logoUrl}" alt="Logo" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;">` : '💼'}
                </div>
                <div class="header-info">
                  <h1>INVOICE</h1>
                  <div class="invoice-number">#${invoice.invoiceNumber}</div>
                  <span class="status-badge">${(invoice.status || 'SENT').toUpperCase()}</span>
                </div>
              </div>
              <div class="header-right">
                <div class="total-amount">${formatCurrency(invoice.companyAmount || invoice.totalAmount || 0, companyCountry)}</div>
                ${showDualCurrency ? `
                  <div class="total-secondary">${formatCurrency(invoice.clientAmount || convertINRToClient(invoice.totalAmountINR || 0), clientCountry)}</div>
                  <div class="currency-note">${companyCurrency.code} / ${clientCurrency.code}</div>
                ` : ''}
              </div>
            </div>

            <!-- Dates -->
            <div class="dates-section">
              <div>Issue Date: ${invoice.issueDate?.toLocaleDateString() || 'N/A'}</div>
              <div>Due Date: ${invoice.dueDate?.toLocaleDateString() || 'N/A'}</div>
            </div>

            <!-- Company and Client Information -->
            <div class="two-column">
              <div class="info-section">
                <h3>Company Information</h3>
                
                <div class="info-group">
                  <div class="info-label">Contact Details</div>
                  <div class="info-value">
                    <div class="contact-item">
                      <span>📧</span>
                      <span>${invoice.companyEmail || 'contact1@abc.com'}</span>
                    </div>
                    <div class="contact-item">
                      <span>📞</span>
                      <span class="font-mono">${formatPhoneNumber(invoice.companyPhone || '+1 8398042911', companyCountry)}</span>
                    </div>
                    <div class="contact-item">
                      <span>🌐</span>
                      <span>${invoice.companyWebsite || 'www.testcompany1.com'}</span>
                    </div>
                    <div class="contact-item">
                      <span>📍</span>
                      <span>${invoice.companyAddress || '121 Business Park'}, ${invoice.companyCity ? invoice.companyCity + ', ' : ''}Country: ${(() => {
                        const countryNames = {
                          'US': 'United States', 'IN': 'India', 'GB': 'United Kingdom', 'DE': 'Germany',
                          'FR': 'France', 'IT': 'Italy', 'ES': 'Spain', 'NL': 'Netherlands', 'CA': 'Canada',
                          'AU': 'Australia', 'JP': 'Japan', 'CN': 'China', 'SG': 'Singapore', 'HK': 'Hong Kong',
                          'MX': 'Mexico', 'BR': 'Brazil', 'ZA': 'South Africa', 'AE': 'United Arab Emirates',
                          'SA': 'Saudi Arabia', 'DK': 'Denmark', 'NO': 'Norway', 'SE': 'Sweden', 'CH': 'Switzerland'
                        };
                        return countryNames[companyCountry] || companyCountry;
                      })()}</span>
                    </div>
                  </div>
                </div>

                ${invoice.companyTaxInfo && invoice.companyTaxInfo.primaryType && invoice.companyTaxInfo.primaryId ? `
                  <div class="info-group">
                    <div class="info-label">Tax Information</div>
                    <div class="info-value">
                      <div class="contact-item">
                        <span>🏛️</span>
                        <span>${invoice.companyTaxInfo.primaryType}: ${invoice.companyTaxInfo.primaryId}</span>
                      </div>
                    </div>
                  </div>
                ` : ''}

                ${invoice.bankInfo ? `
                  <div class="info-group">
                    <div class="info-label">Bank Information</div>
                    <div class="info-value">
                      <div class="contact-item">
                        <span>🏦</span>
                        <span>Bank Name: ${(invoice.bankInfo as any)?.bankName || 'HDFC'}</span>
                      </div>
                      <div class="contact-item">
                        <span>💳</span>
                        <span>Account Number: ${(invoice.bankInfo as any)?.accountNumber || 'CA123'}</span>
                      </div>
                      <div class="contact-item">
                        <span>🔢</span>
                        <span>Routing Code: ${(invoice.bankInfo as any)?.routingCode || (invoice.bankInfo as any)?.ifscCode || '123455'}</span>
                      </div>
                    </div>
                  </div>
                ` : ''}

                ${invoice.signatureUrl ? `
                  <div class="info-group">
                    <div class="info-label">Authorized Signatory</div>
                    <div class="info-value">
                      <div style="text-align: center; padding: 12px; border: 1px solid #E5E7EB; border-radius: 4px; background: white; margin-bottom: 8px;">
                        <img src="${invoice.signatureUrl}" alt="Signature" style="max-width: 100%; max-height: 80px; object-fit: contain;" />
                      </div>
                      <div style="font-weight: 500; color: #374151;">${invoice.businessOwnerName || 'Mahesh P Pai'}</div>
                      <div style="font-size: 12px; color: #6B7280; font-style: italic;">${invoice.businessOwnerPosition || 'CEO'}</div>
                    </div>
                  </div>
                ` : ''}
              </div>

              <div class="info-section">
                <h3>Client Information</h3>
                
                <div class="info-group">
                  <div class="info-label">Contact Details</div>
                  <div class="info-value">
                    <div class="contact-item">
                      <span>👤</span>
                      <span>${invoice.clientName || 'Peter'}</span>
                    </div>
                    <div class="contact-item">
                      <span>📧</span>
                      <span>${invoice.clientEmail || 'peter@gmail.com'}</span>
                    </div>
                    ${invoice.clientPhone ? `
                      <div class="contact-item">
                        <span>📞</span>
                        <span class="font-mono">${formatPhoneNumber(invoice.clientPhone, clientCountry)}</span>
                      </div>
                    ` : ''}
                  </div>
                </div>

                <div class="info-group">
                  <div class="info-label">Address</div>
                  <div class="info-value">
                    <div class="contact-item">
                      <span>📍</span>
                      <span>${invoice.clientAddress || 'State: stateUK, Postcode: 77557, UK'}</span>
                    </div>
                  </div>
                </div>

                ${invoice.clientTaxInfo?.id ? `
                  <div class="info-group">
                    <div class="info-label">Tax Information</div>
                    <div class="info-value">
                      <div class="contact-item">
                        <span>🏛️</span>
                        <span>${invoice.clientTaxInfo.type || 'Company Number'}: ${invoice.clientTaxInfo.id}</span>
                      </div>
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Invoice Items -->
            <div class="items-section">
              <h3>Invoice Items</h3>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Rate</th>
                    <th>Discount</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoice.items?.map(item => {
                    const discountRate = typeof item.discount === 'string' ? parseFloat(item.discount) || 0 : item.discount || 0;
                    const discountAmount = (item.rate || 0) * (item.quantity || 0) * (discountRate / 100);
                    const itemSubtotal = (item.rate || 0) * (item.quantity || 0);
                    const itemAmountAfterDiscount = itemSubtotal - discountAmount;
                    
                    return `
                      <tr>
                        <td>${item.description}</td>
                        <td style="text-align: center;">${item.quantity}</td>
                        <td style="text-align: right;">
                          ${formatCurrency(item.rate || 0, companyCountry)}
                          ${showDualCurrency ? `<span class="dual-currency">(${formatCurrency(convertINRToClient(convertCompanyToINR(item.rate || 0)), clientCountry)})</span>` : ''}
                        </td>
                        <td style="text-align: center;">
                          ${discountRate > 0 ? `${discountRate}%` : '--'}
                        </td>
                        <td style="text-align: right; font-weight: 600;">
                          ${formatCurrency(item.amount || itemAmountAfterDiscount, companyCountry)}
                          ${showDualCurrency ? `<span class="dual-currency">(${formatCurrency(convertINRToClient(convertCompanyToINR(item.amount || itemAmountAfterDiscount)), clientCountry)})</span>` : ''}
                        </td>
                      </tr>
                    `;
                  }).join('') || '<tr><td colspan="5" style="text-align: center; color: #6B7280;">No items</td></tr>'}
                </tbody>
              </table>

              <!-- Totals -->
              <div class="totals-section">
                <div class="total-row">
                  <span>Subtotal (${companyCurrency.code}):</span>
                  <span>${formatCurrency(invoice.subtotal || 0, companyCountry)}</span>
                </div>
                ${showDualCurrency ? `
                  <div class="total-row">
                    <span>Subtotal (${clientCurrency.code}):</span>
                    <span>${formatCurrency(convertINRToClient(convertCompanyToINR(invoice.subtotal || 0)), clientCountry)}</span>
                  </div>
                ` : ''}
                <div class="total-row">
                  <span>Total Tax (${companyCurrency.code}):</span>
                  <span>${formatCurrency(invoice.totalGst || 0, companyCountry)}</span>
                </div>
                ${showDualCurrency ? `
                  <div class="total-row">
                    <span>Total Tax (${clientCurrency.code}):</span>
                    <span>${formatCurrency(convertINRToClient(convertCompanyToINR(invoice.totalGst || 0)), clientCountry)}</span>
                  </div>
                ` : ''}
                <div class="total-row final">
                  <span>Total Amount (${companyCurrency.code}):</span>
                  <span>${formatCurrency(invoice.companyAmount || invoice.totalAmount || 0, companyCountry)}</span>
                </div>
                ${showDualCurrency ? `
                  <div class="total-row final">
                    <span>Total Amount (${clientCurrency.code}):</span>
                    <span>${formatCurrency(invoice.clientAmount || convertINRToClient(invoice.totalAmountINR || 0), clientCountry)}</span>
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Terms & Conditions -->
            <div class="terms-section">
              <h4>📋 Terms & Conditions</h4>
              <div class="terms-content">
                ${invoice.terms || 'Payment due within 30 days of invoice date.'}
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              Thank you for your business!
            </div>
          </div>
        </body>
        </html>
      `;

      // Create a new window and trigger print dialog for PDF generation
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Wait for content to load, then trigger print dialog
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            // Close window after print dialog
            setTimeout(() => {
              printWindow.close();
            }, 1000);
          }, 500);
        };
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
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto bg-white dark:bg-white dark:text-gray-900">
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
                        <span className="font-mono text-sm">{formatPhoneNumber(invoice.companyPhone, companyCountry)}</span>
                      </p>
                    )}
                    {invoice.companyEmail && (
                      <p className="text-gray-600 text-lg flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {invoice.companyEmail}
                      </p>
                    )}
                    {invoice.companyWebsite && (
                      <p className="text-gray-600 text-lg flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        <a 
                          href={invoice.companyWebsite.startsWith('http') ? invoice.companyWebsite : `https://${invoice.companyWebsite}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {invoice.companyWebsite}
                        </a>
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

                {/* Enhanced Tax Information - Display primaryType and primaryId */}
                {invoice.companyTaxInfo && invoice.companyTaxInfo.primaryType && invoice.companyTaxInfo.primaryId && (
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                    <h4 className="font-bold mb-4 flex items-center gap-3 text-gray-900 text-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Tax Information
                    </h4>
                    <div className="p-3 bg-white rounded-lg border">
                      <span className="font-semibold text-gray-700 text-base">
                        {invoice.companyTaxInfo.primaryType}: 
                      </span>
                      <span className="ml-2 text-gray-900 font-mono bg-gray-100 px-3 py-1 rounded border text-lg">
                        {invoice.companyTaxInfo.primaryId}
                      </span>
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

                {/* Business Owner Signature - Updated with Name and Position */}
                {invoice.signatureUrl && (
                  <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                    <h4 className="font-bold mb-4 text-gray-900 text-lg">Authorized Signatory</h4>
                    <img 
                      src={invoice.signatureUrl} 
                      alt="Authorized Signatory"
                      className="max-w-48 h-24 object-contain border-2 rounded-lg bg-white p-3 shadow-sm mb-4"
                    />
                    {/* Business Owner Details */}
                    <div className="mt-4 pt-4 border-t border-purple-200">
                      {invoice.businessOwnerName && (
                        <div className="font-semibold text-gray-900 text-base mb-2">
                          {invoice.businessOwnerName}
                        </div>
                      )}
                      {invoice.businessOwnerPosition && (
                        <div className="text-gray-600 italic text-sm">
                          {invoice.businessOwnerPosition}
                        </div>
                      )}
                    </div>
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
                      <span className="font-mono text-sm">{formatPhoneNumber(invoice.clientPhone, clientCountry)}</span>
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
                       <TableHead className="font-bold text-gray-900 text-center">Discount</TableHead>
                       <TableHead className="font-bold text-gray-900 text-right">Amount</TableHead>
                     </TableRow>
                   </TableHeader>
                  <TableBody>
                     {invoice.items?.map((item, index) => {
                       const discountRate = typeof item.discount === 'string' ? parseFloat(item.discount) || 0 : item.discount || 0;
                       const discountAmount = (item.rate || 0) * (item.quantity || 0) * (discountRate / 100);
                       const itemSubtotal = (item.rate || 0) * (item.quantity || 0);
                       const itemAmountAfterDiscount = itemSubtotal - discountAmount;
                       
                       return (
                         <TableRow key={index} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-gray-900">
                              <div className="font-semibold">{item.description}</div>
                            </TableCell>
                           <TableCell className="text-center text-gray-700 font-medium">
                             {item.quantity}
                           </TableCell>
                           <TableCell className="text-right text-gray-700">
                             <div className="font-semibold">{formatCurrency(item.rate || 0, companyCountry)}</div>
                             {showDualCurrency && (
                               <div className="text-sm text-gray-500">
                                 ({formatCurrency(convertINRToClient(convertCompanyToINR(item.rate || 0)), clientCountry)})
                               </div>
                             )}
                           </TableCell>
                           <TableCell className="text-center">
                             {discountRate > 0 ? (
                               <div className="space-y-1">
                                 <div className="text-orange-600 font-semibold">{discountRate}%</div>
                                 <div className="text-sm text-gray-600">
                                   -{formatCurrency(discountAmount, companyCountry)}
                                   {showDualCurrency && (
                                     <div className="text-xs text-gray-500">
                                       (-{formatCurrency(convertINRToClient(convertCompanyToINR(discountAmount)), clientCountry)})
                                     </div>
                                   )}
                                 </div>
                               </div>
                             ) : (
                               <span className="text-gray-400">—</span>
                             )}
                           </TableCell>
                           <TableCell className="text-right font-bold text-green-600">
                             <div className="font-bold">{formatCurrency(item.amount || itemAmountAfterDiscount, companyCountry)}</div>
                             {showDualCurrency && (
                               <div className="text-sm text-gray-500">
                                 ({formatCurrency(convertINRToClient(convertCompanyToINR(item.amount || itemAmountAfterDiscount)), clientCountry)})
                               </div>
                             )}
                           </TableCell>
                         </TableRow>
                       );
                     })}
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

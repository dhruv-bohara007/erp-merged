import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Download, MapPin, Globe, Phone, Building, FileText, CreditCard, Mail, ExternalLink, Smartphone, Banknote, IndianRupee } from 'lucide-react';
import { Invoice } from '@/hooks/useFirestore';
import { getCurrencyByCountry } from '@/data/countryCurrencyMapping';
import { countryPhoneCodes } from '@/data/countryPhoneCodes';
import { calculateInvoiceStatus, getStatusColor, getStatusDisplay } from '@/utils/invoiceStatusUtils';
import { usePayments } from '@/hooks/useFirestore';

interface InvoiceViewProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InvoiceView = ({ invoice, open, onOpenChange }: InvoiceViewProps) => {
  const { payments } = usePayments();
  
  if (!invoice) return null;

  // Calculate current status based on payments
  const paymentDoc = payments.find(p => p.invoiceId === invoice.id);
  const paidAmount = paymentDoc?.totalPaidUSD || invoice.paidUSD || 0;
  const statusResult = calculateInvoiceStatus(invoice, paidAmount);

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
              margin-bottom: 25px;
              padding: 20px;
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              border-radius: 12px;
              border: 2px solid #e2e8f0;
              page-break-inside: avoid;
            }
            .logo-section {
              display: flex;
              align-items: center;
              gap: 20px;
            }
            .company-logo { 
              width: 140px; 
              height: 140px; 
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
              padding: 6px 14px;
              border-radius: 20px;
              font-weight: 600;
              text-transform: uppercase;
              font-size: 13px;
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
              box-shadow: 0 2px 6px rgba(0,0,0,0.1);
              min-width: 240px;
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

            /* Dates Section - Compact */
            .dates-section {
              gap: 35px;
              margin: 8px 0;
              padding: 12px;
              background: #f9fafb;
              border-radius: 8px;
              page-break-inside: avoid;
            }
            .date-item {
              display: flex;
              align-items: center;
              gap: 6px;
              font-weight: 600;
              font-size: 13px;
            }

            /* Two Column Layout - Increased font sizes */
            .two-column {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin: 8px 0;
              page-break-inside: avoid;
            }
            
            /* Card Styles - Increased font sizes */
            .info-card {
              background: white;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            }
            .card-header {
              padding: 8px 12px;
              font-size: 16px;
              font-weight: bold;
              color: #1f2937;
              border-bottom: 1px solid #e5e7eb;
            }
            .company-header { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); }
            .client-header { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); }
            
            .card-content { padding: 10px; }
            .info-section {
              margin-bottom: 8px;
              padding: 6px;
              background: #f9fafb;
              border-radius: 4px;
              border: 1px solid #e5e7eb;
            }
            .info-section:last-child {
              margin-bottom: 0;
            }
            .section-title {
              font-weight: bold;
              color: #374151;
              margin-bottom: 4px;
              font-size: 14px;
              display: flex;
              align-items: center;
              gap: 4px;
            }
            
            /* Phone number formatting with consistent alignment */
            .phone-number {
              font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
              font-size: 14px;
              letter-spacing: 0.5px;
              word-spacing: 2px;
            }
            
            /* Increased font sizes for company and client info */
            .info-card .card-content > div {
              font-size: 13px;
              line-height: 1.3;
            }
            .info-card .card-content strong {
              font-size: 14px;
            }
            
            /* Table Styles - Fixed alignment */
            .bank-table, .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 4px 0;
              background: white;
              border-radius: 4px;
              overflow: hidden;
              border: 1px solid #e5e7eb;
            }
            .bank-table th, .bank-table td,
            .items-table th, .items-table td {
              padding: 6px 10px;
              text-align: left;
              border-bottom: 1px solid #e5e7eb;
              font-size: 12px;
              line-height: 1.3;
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
            
            /* Fixed table column alignment */
            .items-table th:nth-child(1), .items-table td:nth-child(1) { text-align: left; }
            .items-table th:nth-child(2), .items-table td:nth-child(2) { text-align: center; }
            .items-table th:nth-child(3), .items-table td:nth-child(3) { text-align: center; }
            .items-table th:nth-child(4), .items-table td:nth-child(4) { text-align: right; }
            .items-table th:nth-child(5), .items-table td:nth-child(5) { text-align: center; }
            .items-table th:nth-child(6), .items-table td:nth-child(6) { text-align: right; }
            
            /* Signature Section - Compact */
            .signature-section {
              margin-top: 6px;
              padding: 6px;
              background: linear-gradient(135deg, #faf5ff 0%, #e9d5ff 100%);
              border-radius: 4px;
              border: 1px solid #d8b4fe;
            }
            .signature-image {
              max-width: 100px;
              height: 40px;
              object-fit: contain;
              border: 1px solid white;
              border-radius: 4px;
              background: white;
              padding: 4px;
              margin-top: 4px;
              margin-bottom: 6px;
            }
            .signature-details {
              margin-top: 6px;
              padding-top: 6px;
              border-top: 1px solid #d8b4fe;
            }
            .signature-name {
              font-weight: bold;
              color: #374151;
              margin-bottom: 2px;
              font-size: 12px;
              line-height: 1.2;
            }
            .signature-position {
              color: #6b7280;
              font-style: italic;
              font-size: 11px;
              line-height: 1.2;
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
              margin-top: 30px;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              padding: 20px;
              border-top: 1px solid #e5e7eb;
            }
            
            /* Page break controls */
            .page-break-before {
              page-break-before: always;
              padding-top: 40px;
            }
            
            .no-page-break {
              page-break-inside: avoid;
            }
            
            /* Hide repeated content on subsequent pages */
            @media print {
              body { padding: 0; margin: 0; }
              .container { max-width: none; }
              .invoice-meta { display: none; }
              .page-break-after { page-break-after: always; }
              
              /* First page styles */
              .first-page .invoice-meta { display: block; }
            }
            
            .dual-currency {
              font-size: 14px;
              color: #6b7280;
              margin-top: 4px;
            }
            
          </style>
        </head>
        <body>
          <div class="container first-page">
            <!-- Header Section (First page only) -->
            <div class="invoice-header no-page-break">
              <div class="logo-section">
                ${invoice.logoUrl ? `<img src="${invoice.logoUrl}" alt="Company Logo" class="company-logo">` : ''}
                <div>
                  <div class="invoice-title">INVOICE</div>
                  <div class="invoice-number invoice-meta">#${invoice.invoiceNumber}</div>
                  <span class="invoice-status status-${statusResult.status} invoice-meta">
                    ${getStatusDisplay(statusResult)}
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
                  <div style="font-size: 14px; color: #9ca3af; margin-top: 10px;">
                    ${companyCurrency.code} / ${clientCurrency.code}
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Dates Section (First page only) - Same line display -->
            <div class="dates-section no-page-break invoice-meta" style="display: flex; justify-content: space-between; align-items: center;">
              <div class="date-item">
                <strong>Issue Date:</strong> ${invoice.issueDate?.toLocaleDateString() || 'N/A'}
              </div>
              <div class="date-item">
                <strong>Due Date:</strong> ${invoice.dueDate?.toLocaleDateString() || 'N/A'}
              </div>
            </div>

            <!-- Two Column Layout (First page only) -->
            <div class="two-column no-page-break">
              <!-- Company Information -->
              <div class="info-card">
                <div class="card-header company-header">Company Information</div>
                <div class="card-content">
                  <div class="info-section">
                    <div class="section-title">📍 Contact Details</div>
                    <div style="font-size: 14px; line-height: 1.3;"><strong>${invoice.companyName}</strong></div>
                    <div style="font-size: 13px; line-height: 1.2;">${invoice.companyAddress}</div>
                    ${invoice.companyCity ? `<div style="font-size: 13px; line-height: 1.2;">${invoice.companyCity}</div>` : ''}
                    <div style="font-size: 13px; line-height: 1.2;"><strong>Country:</strong> ${(() => {
                      const countryNames = {
                        'US': 'United States', 'IN': 'India', 'GB': 'United Kingdom', 'DE': 'Germany',
                        'FR': 'France', 'IT': 'Italy', 'ES': 'Spain', 'NL': 'Netherlands', 'CA': 'Canada',
                        'AU': 'Australia', 'JP': 'Japan', 'CN': 'China', 'SG': 'Singapore', 'HK': 'Hong Kong',
                        'MX': 'Mexico', 'BR': 'Brazil', 'ZA': 'South Africa', 'AE': 'United Arab Emirates',
                        'SA': 'Saudi Arabia', 'DK': 'Denmark', 'NO': 'Norway', 'SE': 'Sweden', 'CH': 'Switzerland'
                      };
                      return countryNames[companyCountry] || companyCountry;
                    })()}</div>
                     ${invoice.companyPhone ? `<div style="font-size: 13px; line-height: 1.2;">📞 <span class="phone-number">${formatPhoneNumber(invoice.companyPhone, companyCountry)}</span></div>` : ''}
                     ${invoice.companyEmail ? `<div style="font-size: 13px; line-height: 1.2;">📧 ${invoice.companyEmail}</div>` : ''}
                     ${invoice.companyWebsite ? `<div style="font-size: 13px; line-height: 1.2;">🌐 ${invoice.companyWebsite}</div>` : ''}
                   </div>

                   ${invoice.companyTaxInfo && (invoice.companyTaxInfo.primaryType && invoice.companyTaxInfo.primaryId) ? `
                     <div class="info-section">
                       <div class="section-title">🏛️ Tax Information</div>
                       <div style="font-size: 13px; line-height: 1.2;"><strong>${invoice.companyTaxInfo.primaryType}:</strong> ${invoice.companyTaxInfo.primaryId}</div>
                       ${invoice.totalGst && invoice.subtotal ? `<div style="font-size: 13px; line-height: 1.2;"><strong>Tax Rate:</strong> ${((invoice.totalGst / invoice.subtotal) * 100).toFixed(2)}%</div>` : ''}
                       ${invoice.conversionRate ? `<div style="font-size: 13px; line-height: 1.2;"><strong>Exchange Rate:</strong> ${invoice.conversionRate.companyToINR} (${companyCurrency.code} to INR)</div>` : ''}
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
                      <div class="section-title">✍️ Authorized Signatory</div>
                      <img src="${invoice.signatureUrl}" alt="Authorized Signatory" class="signature-image">
                      <div class="signature-details">
                        ${invoice.businessOwnerName ? `<div class="signature-name">${invoice.businessOwnerName}</div>` : ''}
                        ${invoice.businessOwnerPosition ? `<div class="signature-position">${invoice.businessOwnerPosition}</div>` : ''}
                      </div>
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
                    <div style="font-size: 14px; line-height: 1.3;"><strong>${invoice.clientName}</strong></div>
                    <div style="font-size: 13px; line-height: 1.2;">📧 ${invoice.clientEmail}</div>
                    ${invoice.clientPhone ? `<div style="font-size: 13px; line-height: 1.2;">📞 <span class="phone-number">${formatPhoneNumber(invoice.clientPhone, clientCountry)}</span></div>` : ''}
                  </div>

                  <div class="info-section">
                    <div class="section-title">📍 Address</div>
                    ${invoice.clientAddress ? `<div style="font-size: 13px; line-height: 1.2;">${invoice.clientAddress}</div>` : ''}
                    ${invoice.clientState ? `<div style="font-size: 13px; line-height: 1.2;">State: ${invoice.clientState}</div>` : ''}
                    ${invoice.clientPincode ? `<div style="font-size: 13px; line-height: 1.2;">Pincode: ${invoice.clientPincode}</div>` : ''}
                  </div>

                    ${invoice.clientTaxInfo?.id ? `
                      <div class="info-section">
                        <div class="section-title">🏛️ Tax Information</div>
                        <div style="font-size: 13px; line-height: 1.2;"><strong>Tax ID:</strong> ${invoice.clientTaxInfo.id}</div>
                      </div>
                    ` : ''}
                    
                    ${invoice.conversionRate ? `
                      <div style="margin-top: 8px; padding: 6px 8px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 1px solid #7dd3fc; border-radius: 6px; font-size: 12px;">
                        <div style="font-weight: 600; color: #0369a1; margin-bottom: 2px;">💱 Exchange Rate</div>
                        <div style="color: #0c4a6e;">1 ${companyCurrency.code} = ${invoice.conversionRate.companyToINR} INR</div>
                        <div style="color: #0c4a6e;">1 INR = ${invoice.conversionRate.INRToClient} ${clientCurrency.code}</div>
                      </div>
                    ` : ''}
                </div>
              </div>
            </div>

          </div>

          <!-- Second Page: Invoice Items and Terms -->
          <div class="container page-break-before">
            <!-- Invoice Items -->
            <div class="info-card">
              <div class="card-header" style="background: linear-gradient(135deg, #faf5ff 0%, #e9d5ff 100%);">Invoice Items</div>
              <div class="card-content">
                <table class="items-table">
                   <thead>
                     <tr>
                       <th>Description</th>
                       <th>Quantity</th>
                       <th>Unit</th>
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
                             <td>
                               <strong>${item.description}</strong>
                             </td>
                            <td style="text-align: center;">${item.quantity}</td>
                            <td style="text-align: center;">${item.unit || '—'}</td>
                            <td style="text-align: right;">
                              ${formatCurrency(item.rate || 0, companyCountry)}
                              ${showDualCurrency ? `
                                <div class="dual-currency">
                                  (${formatCurrency(convertINRToClient(convertCompanyToINR(item.rate || 0)), clientCountry)})
                                </div>
                              ` : ''}
                            </td>
                           <td style="text-align: center;">
                             ${discountRate > 0 ? `
                               <span style="color: #ea580c; font-weight: 600;">${discountRate}%</span><br>
                               <small style="color: #6b7280;">-${formatCurrency(discountAmount, companyCountry)}</small>
                               ${showDualCurrency ? `
                                 <div class="dual-currency">
                                   (-${formatCurrency(convertINRToClient(convertCompanyToINR(discountAmount)), clientCountry)})
                                 </div>
                               ` : ''}
                             ` : '<span style="color: #9ca3af;">—</span>'}
                           </td>
                           <td style="text-align: right;">
                             <strong>${formatCurrency(item.amount || itemAmountAfterDiscount, companyCountry)}</strong>
                             ${showDualCurrency ? `
                               <div class="dual-currency">
                                 (${formatCurrency(convertINRToClient(convertCompanyToINR(item.amount || itemAmountAfterDiscount)), clientCountry)})
                               </div>
                             ` : ''}
                           </td>
                         </tr>
                       `;
                     }).join('') || '<tr><td colspan="5" style="text-align: center; color: #6b7280;">No items</td></tr>'}
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

            <!-- Status-based Payment Information (placed directly below items table) -->
            ${statusResult.status === 'overdue' && invoice.partialPayments && invoice.partialPayments.length > 0 ? `
              <div style="margin-top: 30px;">
                <!-- Payment Summary Cards for Overdue with partial payments - Show actual paid amounts -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                  <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; border: 2px solid #0ea5e9;">
                    <h4 style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #0c4a6e;">Total Amount Paid by Client</h4>
                    <div style="font-size: 20px; font-weight: bold; color: #059669; margin-bottom: 5px;">
                      ${formatCurrency(
                        invoice.partialPayments.reduce((sum, payment) => sum + (payment.amountPaidByClient || 0), 0), 
                        clientCountry
                      )}
                    </div>
                    <div style="font-size: 12px; color: #6b7280;">Client Currency (${clientCurrency.code})</div>
                    <div style="font-size: 16px; font-weight: bold; color: #10b981; margin-top: 10px;">
                      ${formatCurrency(
                        invoice.partialPayments.reduce((sum, payment) => sum + (payment.originalPaymentAmount || 0), 0), 
                        companyCountry
                      )}
                    </div>
                    <div style="font-size: 12px; color: #6b7280;">Company Currency (${companyCurrency.code})</div>
                  </div>
                  
                  <div style="background-color: #fff7ed; padding: 20px; border-radius: 8px; border: 2px solid #f97316;">
                    <h4 style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #9a3412;">Pending Amount</h4>
                    <div style="font-size: 20px; font-weight: bold; color: #ea580c; margin-bottom: 5px;">
                      ${formatCurrency(
                        (invoice.clientAmount || convertINRToClient(invoice.totalAmountINR || 0)) - 
                        invoice.partialPayments.reduce((sum, payment) => sum + (payment.amountPaidByClient || 0), 0),
                        clientCountry
                      )}
                    </div>
                    <div style="font-size: 12px; color: #6b7280;">Client Currency (${clientCurrency.code})</div>
                    <div style="font-size: 16px; font-weight: bold; color: #f97316; margin-top: 10px;">
                      ${formatCurrency(
                        (invoice.companyAmount || invoice.totalAmount || 0) - 
                        invoice.partialPayments.reduce((sum, payment) => sum + (payment.originalPaymentAmount || 0), 0),
                        companyCountry
                      )}
                    </div>
                    <div style="font-size: 12px; color: #6b7280;">Company Currency (${companyCurrency.code})</div>
                  </div>
                </div>
              </div>
            ` : statusResult.status === 'overdue' ? `
              <div style="margin-top: 30px;">
                <!-- Payment Summary Cards for Overdue - Show zero paid and full pending -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                  <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; border: 2px solid #0ea5e9;">
                    <h4 style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #0c4a6e;">Total Amount Paid by Client</h4>
                    <div style="font-size: 20px; font-weight: bold; color: #059669; margin-bottom: 5px;">
                      ${formatCurrency(0, clientCountry)}
                    </div>
                    <div style="font-size: 12px; color: #6b7280;">Client Currency (${clientCurrency.code})</div>
                    <div style="font-size: 16px; font-weight: bold; color: #10b981; margin-top: 10px;">
                      ${formatCurrency(0, companyCountry)}
                    </div>
                    <div style="font-size: 12px; color: #6b7280;">Company Currency (${companyCurrency.code})</div>
                  </div>
                  
                  <div style="background-color: #fff7ed; padding: 20px; border-radius: 8px; border: 2px solid #f97316;">
                    <h4 style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #9a3412;">Pending Amount</h4>
                    <div style="font-size: 20px; font-weight: bold; color: #ea580c; margin-bottom: 5px;">
                      ${formatCurrency(invoice.clientAmount || convertINRToClient(invoice.totalAmountINR || 0), clientCountry)}
                    </div>
                    <div style="font-size: 12px; color: #6b7280;">Client Currency (${clientCurrency.code})</div>
                    <div style="font-size: 16px; font-weight: bold; color: #f97316; margin-top: 10px;">
                      ${formatCurrency(invoice.companyAmount || invoice.totalAmount || 0, companyCountry)}
                    </div>
                    <div style="font-size: 12px; color: #6b7280;">Company Currency (${companyCurrency.code})</div>
                  </div>
                </div>
              </div>
            ` : statusResult.status === 'paid' ? `
              <div style="margin-top: 30px; padding: 20px; background: #f0fdf4; border-radius: 8px; border: 2px solid #22c55e; text-align: center;">
                <div style="font-size: 16px; font-weight: bold; color: #15803d;">
                  Payment for this invoice has been received in full on ${(() => {
                    const latestPayment = invoice.partialPayments?.[invoice.partialPayments.length - 1];
                    if (!latestPayment?.paymentDate) return 'N/A';
                    const paymentDate = latestPayment.paymentDate;
                    if (typeof paymentDate === 'object' && 'toDate' in paymentDate && typeof paymentDate.toDate === 'function') {
                      return paymentDate.toDate().toLocaleDateString();
                    }
                    if (paymentDate instanceof Date) {
                      return paymentDate.toLocaleDateString();
                    }
                    return 'N/A';
                  })()}. No further action is required.
                </div>
              </div>
            ` : statusResult.status === 'paid-after-due' ? `
              <div style="margin-top: 30px; padding: 20px; background: #dbeafe; border-radius: 8px; border: 2px solid #3b82f6; text-align: center;">
                <div style="font-size: 16px; font-weight: bold; color: #1d4ed8;">
                  This invoice has been fully paid, but after the due date. We appreciate your payment. Please ensure timely payments in the future to avoid late fees or disruptions.
                </div>
              </div>
            ` : statusResult.status === 'pending' ? `
              <!-- Additional Information for pending -->
              ${(invoice.notes || invoice.terms) ? `
                <div style="margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                  <h4 style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #374151;">📄 Additional Information</h4>
                  ${invoice.notes ? `
                    <div style="margin-bottom: 20px;">
                      <div style="font-weight: bold; margin-bottom: 8px; color: #374151;">📝 Notes</div>
                      <p style="font-size: 14px; line-height: 1.6; padding: 15px; background: #ffffff; border-radius: 6px; border: 1px solid #e5e7eb; margin: 0;">${invoice.notes}</p>
                    </div>
                  ` : ''}
                  ${invoice.terms ? `
                    <div>
                      <div style="font-weight: bold; margin-bottom: 8px; color: #374151;">📋 Terms & Conditions</div>
                      <p style="font-size: 14px; line-height: 1.6; padding: 15px; background: #ffffff; border-radius: 6px; border: 1px solid #e5e7eb; margin: 0;">${invoice.terms}</p>
                    </div>
                  ` : ''}
                </div>
              ` : ''}
            ` : (['partially-paid'].includes(statusResult.status) && invoice.partialPayments && invoice.partialPayments.length > 0) ? `
              <div style="margin-top: 30px;">
                <!-- Payment Summary Cards for Partially Paid -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                  <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; border: 2px solid #0ea5e9;">
                    <h4 style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #0c4a6e;">Total Amount Paid by Client</h4>
                    <div style="font-size: 20px; font-weight: bold; color: #059669; margin-bottom: 5px;">
                      ${formatCurrency(
                        invoice.partialPayments.reduce((sum, payment) => sum + (payment.amountPaidByClient || 0), 0), 
                        clientCountry
                      )}
                    </div>
                    <div style="font-size: 12px; color: #6b7280;">Client Currency (${clientCurrency.code})</div>
                    <div style="font-size: 16px; font-weight: bold; color: #10b981; margin-top: 10px;">
                      ${formatCurrency(
                        invoice.partialPayments.reduce((sum, payment) => sum + (payment.originalPaymentAmount || 0), 0), 
                        companyCountry
                      )}
                    </div>
                    <div style="font-size: 12px; color: #6b7280;">Company Currency (${companyCurrency.code})</div>
                  </div>
                  
                  <div style="background-color: #fff7ed; padding: 20px; border-radius: 8px; border: 2px solid #f97316;">
                    <h4 style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #9a3412;">Pending Amount</h4>
                    <div style="font-size: 20px; font-weight: bold; color: #ea580c; margin-bottom: 5px;">
                      ${formatCurrency(
                        (invoice.clientAmount || convertINRToClient(invoice.totalAmountINR || 0)) - 
                        invoice.partialPayments.reduce((sum, payment) => sum + (payment.amountPaidByClient || 0), 0),
                        clientCountry
                      )}
                    </div>
                    <div style="font-size: 12px; color: #6b7280;">Client Currency (${clientCurrency.code})</div>
                    <div style="font-size: 16px; font-weight: bold; color: #f97316; margin-top: 10px;">
                      ${formatCurrency(
                        (invoice.companyAmount || invoice.totalAmount || 0) - 
                        invoice.partialPayments.reduce((sum, payment) => sum + (payment.originalPaymentAmount || 0), 0),
                        companyCountry
                      )}
                    </div>
                    <div style="font-size: 12px; color: #6b7280;">Company Currency (${companyCurrency.code})</div>
                  </div>
                </div>
              </div>
            ` : ''}

          </div>

          <!-- Third Page: Payment History (for partially-paid and overdue with payments) -->
          ${(statusResult.status === 'partially-paid' || (statusResult.status === 'overdue' && invoice.partialPayments && invoice.partialPayments.length > 0)) && invoice.partialPayments && invoice.partialPayments.length > 0 ? `
            <div class="container page-break-before">
              <div class="info-card">
                <div class="card-header" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);">💳 Client Payment History</div>
                <div class="card-content">
                  <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <thead>
                      <tr style="background-color: #f8fafc;">
                        <th style="padding: 12px; text-align: left; border: 1px solid #e2e8f0; font-weight: bold;">Payment Date</th>
                        <th style="padding: 12px; text-align: right; border: 1px solid #e2e8f0; font-weight: bold;">Amount Paid (${companyCurrency.code})</th>
                        ${showDualCurrency ? `<th style="padding: 12px; text-align: right; border: 1px solid #e2e8f0; font-weight: bold;">Amount Paid (${clientCurrency.code})</th>` : ''}
                        <th style="padding: 12px; text-align: center; border: 1px solid #e2e8f0; font-weight: bold;">Payment Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${invoice.partialPayments.map((payment, index) => `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                          <td style="padding: 12px; border: 1px solid #e2e8f0;">
                           ${(() => {
                             const paymentDate = payment.paymentDate;
                             if (!paymentDate) return 'Invalid Date';
                             if (typeof paymentDate === 'object' && 'toDate' in paymentDate && typeof paymentDate.toDate === 'function') {
                               return paymentDate.toDate().toLocaleDateString();
                             }
                             if (paymentDate instanceof Date) {
                               return paymentDate.toLocaleDateString();
                             }
                             return 'Invalid Date';
                           })()}
                          </td>
                          <td style="padding: 12px; text-align: right; border: 1px solid #e2e8f0; font-weight: bold;">
                            ${formatCurrency(payment.originalPaymentAmount || 0, companyCountry)}
                          </td>
                          ${showDualCurrency ? `
                            <td style="padding: 12px; text-align: right; border: 1px solid #e2e8f0; font-weight: bold;">
                              ${formatCurrency(payment.amountPaidByClient || 0, clientCountry)}
                            </td>
                          ` : ''}
                          <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">
                            ${payment.paymentMethod.replace('_', ' ').toUpperCase()}
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                  
                  <!-- Additional Information section placed directly below the payment history table -->
                  ${(invoice.notes || invoice.terms) ? `
                    <div style="margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                      <h4 style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #374151;">📄 Additional Information</h4>
                      ${invoice.notes ? `
                        <div style="margin-bottom: 20px;">
                          <div style="font-weight: bold; margin-bottom: 8px; color: #374151;">📝 Notes</div>
                          <p style="font-size: 14px; line-height: 1.6; padding: 15px; background: #ffffff; border-radius: 6px; border: 1px solid #e5e7eb; margin: 0;">${invoice.notes}</p>
                        </div>
                      ` : ''}
                      ${invoice.terms ? `
                        <div>
                          <div style="font-weight: bold; margin-bottom: 8px; color: #374151;">📋 Terms & Conditions</div>
                          <p style="font-size: 14px; line-height: 1.6; padding: 15px; background: #ffffff; border-radius: 6px; border: 1px solid #e5e7eb; margin: 0;">${invoice.terms}</p>
                        </div>
                      ` : ''}
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          ` : statusResult.status === 'overdue' && (!invoice.partialPayments || invoice.partialPayments.length === 0) && (invoice.notes || invoice.terms) ? `
            <!-- Third Page: Additional Information for overdue with no payments -->
            <div class="container page-break-before">
              <div style="margin-top: 40px; padding: 30px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                <h4 style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #374151;">📄 Additional Information</h4>
                ${invoice.notes ? `
                  <div style="margin-bottom: 20px;">
                    <div style="font-weight: bold; margin-bottom: 8px; color: #374151;">📝 Notes</div>
                    <p style="font-size: 14px; line-height: 1.6; padding: 15px; background: #ffffff; border-radius: 6px; border: 1px solid #e5e7eb; margin: 0;">${invoice.notes}</p>
                  </div>
                ` : ''}
                ${invoice.terms ? `
                  <div>
                    <div style="font-weight: bold; margin-bottom: 8px; color: #374151;">📋 Terms & Conditions</div>
                    <p style="font-size: 14px; line-height: 1.6; padding: 15px; background: #ffffff; border-radius: 6px; border: 1px solid #e5e7eb; margin: 0;">${invoice.terms}</p>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}


            <!-- Footer -->
            <div class="invoice-footer">
              <p><strong>Thank you for your business!</strong></p>
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
                  <Badge className={`${getStatusColor(statusResult.status)} px-4 py-2 text-base font-semibold border-2 rounded-full`}>
                    {getStatusDisplay(statusResult)}
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
                           Tax ID: 
                         </span>
                         <span className="ml-2 text-gray-900 font-mono bg-gray-100 px-3 py-1 rounded border text-lg">
                           {invoice.clientTaxInfo.id}
                         </span>
                       </div>
                     )}
                  </div>
                 )}

                {/* Exchange Rate Box */}
                {invoice.conversionRate && (
                  <div className="bg-gradient-to-br from-blue-50 to-sky-50 p-4 rounded-lg border border-sky-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Banknote className="w-4 h-4 text-sky-600" />
                      <span className="font-semibold text-sky-800 text-sm">Exchange Rate</span>
                    </div>
                    <div className="space-y-1 text-sm text-sky-700">
                      <div>1 {companyCountry === 'US' ? 'USD' : getCurrencyByCountry(companyCountry).code} = {invoice.conversionRate.companyToINR} INR</div>
                      <div>1 INR = {invoice.conversionRate.INRToClient} {clientCountry === 'US' ? 'USD' : getCurrencyByCountry(clientCountry).code}</div>
                    </div>
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

          {/* Status-based Payment Information */}
          {statusResult.status === 'overdue' && invoice.partialPayments && invoice.partialPayments.length > 0 ? (
            <Card className="border-2 border-gray-200 shadow-xl rounded-xl">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b-2 border-gray-200 rounded-t-xl">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-orange-600" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                {/* Payment Summary for Overdue with partial payments */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                    <h4 className="font-bold text-gray-900 text-lg mb-4">Total Amount Paid by Client</h4>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(
                          invoice.partialPayments.reduce((sum, payment) => sum + (payment.amountPaidByClient || 0), 0), 
                          clientCountry
                        )}
                      </div>
                      <div className="text-sm text-gray-600">Client Currency ({clientCurrency.code})</div>
                      <div className="text-xl font-semibold text-green-500">
                        {formatCurrency(
                          invoice.partialPayments.reduce((sum, payment) => sum + (payment.originalPaymentAmount || 0), 0), 
                          companyCountry
                        )}
                      </div>
                      <div className="text-sm text-gray-600">Company Currency ({companyCurrency.code})</div>
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
                    <h4 className="font-bold text-gray-900 text-lg mb-4">Pending Amount</h4>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-orange-600">
                        {formatCurrency(
                          (invoice.clientAmount || convertINRToClient(invoice.totalAmountINR || 0)) - 
                          invoice.partialPayments.reduce((sum, payment) => sum + (payment.amountPaidByClient || 0), 0),
                          clientCountry
                        )}
                      </div>
                      <div className="text-sm text-gray-600">Client Currency ({clientCurrency.code})</div>
                      <div className="text-xl font-semibold text-orange-500">
                        {formatCurrency(
                          (invoice.companyAmount || invoice.totalAmount || 0) - 
                          invoice.partialPayments.reduce((sum, payment) => sum + (payment.originalPaymentAmount || 0), 0),
                          companyCountry
                        )}
                      </div>
                      <div className="text-sm text-gray-600">Company Currency ({companyCurrency.code})</div>
                    </div>
                  </div>
                </div>

                {/* Payment History Table */}
                <div className="overflow-x-auto">
                  <Table>
                     <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-bold text-gray-900">Payment Date</TableHead>
                        <TableHead className="font-bold text-gray-900 text-right">Amount Paid (Company Currency)</TableHead>
                        <TableHead className="font-bold text-gray-900 text-right">Amount Paid (Client Currency)</TableHead>
                        <TableHead className="font-bold text-gray-900 text-center">Payment Method</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.partialPayments.map((payment, index) => {
                        const getPaymentMethodIcon = (method: string) => {
                          switch (method) {
                            case 'neft':
                            case 'rtgs':
                            case 'imps': return <Building className="w-4 h-4" />;
                            case 'upi': return <Smartphone className="w-4 h-4" />;
                            case 'credit_card':
                            case 'debit_card': return <CreditCard className="w-4 h-4" />;
                            case 'cash': return <Banknote className="w-4 h-4" />;
                            case 'cheque': return <IndianRupee className="w-4 h-4" />;
                            default: return <IndianRupee className="w-4 h-4" />;
                          }
                        };

                        return (
                          <TableRow key={index} className="hover:bg-gray-50">
                             <TableCell>
                               <div className="flex items-center text-sm">
                                 <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                                 {(() => {
                                   const paymentDate = payment.paymentDate;
                                   if (!paymentDate) return 'Invalid Date';
                                   if (typeof paymentDate === 'object' && 'toDate' in paymentDate && typeof paymentDate.toDate === 'function') {
                                     return paymentDate.toDate().toLocaleDateString();
                                   }
                                   if (paymentDate instanceof Date) {
                                     return paymentDate.toLocaleDateString();
                                   }
                                   return 'Invalid Date';
                                 })()}
                               </div>
                             </TableCell>
                             <TableCell className="text-right font-semibold">
                               {formatCurrency(payment.originalPaymentAmount || 0, companyCountry)}
                             </TableCell>
                             <TableCell className="text-right font-semibold">
                               {formatCurrency(payment.amountPaidByClient || 0, clientCountry)}
                             </TableCell>
                             <TableCell className="text-center">
                               <div className="flex items-center justify-center gap-2">
                                 {getPaymentMethodIcon(payment.paymentMethod)}
                                 <span className="capitalize">
                                   {payment.paymentMethod.replace('_', ' ')}
                                 </span>
                               </div>
                             </TableCell>
                           </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Additional Information for overdue with payments */}
                {(invoice.notes || invoice.terms) && (
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 mt-6">
                    <h4 className="font-bold text-gray-900 text-lg mb-4">📄 Additional Information</h4>
                    {invoice.notes && (
                      <div className="mb-4">
                        <div className="font-semibold text-gray-700 mb-2">📝 Notes</div>
                        <p className="text-gray-700 leading-relaxed bg-white p-4 rounded border">{invoice.notes}</p>
                      </div>
                    )}
                    {invoice.terms && (
                      <div>
                        <div className="font-semibold text-gray-700 mb-2">📋 Terms & Conditions</div>
                        <p className="text-gray-700 leading-relaxed bg-white p-4 rounded border">{invoice.terms}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : statusResult.status === 'overdue' ? (
            <Card className="border-2 border-gray-200 shadow-xl rounded-xl">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b-2 border-gray-200 rounded-t-xl">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-orange-600" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                {/* Payment Summary for Overdue - Show zero paid and full pending */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                    <h4 className="font-bold text-gray-900 text-lg mb-4">Total Amount Paid by Client</h4>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(0, clientCountry)}
                      </div>
                      <div className="text-sm text-gray-600">Client Currency ({clientCurrency.code})</div>
                      <div className="text-xl font-semibold text-green-500">
                        {formatCurrency(0, companyCountry)}
                      </div>
                      <div className="text-sm text-gray-600">Company Currency ({companyCurrency.code})</div>
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
                    <h4 className="font-bold text-gray-900 text-lg mb-4">Pending Amount</h4>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-orange-600">
                        {formatCurrency(invoice.clientAmount || convertINRToClient(invoice.totalAmountINR || 0), clientCountry)}
                      </div>
                      <div className="text-sm text-gray-600">Client Currency ({clientCurrency.code})</div>
                      <div className="text-xl font-semibold text-orange-500">
                        {formatCurrency(invoice.companyAmount || invoice.totalAmount || 0, companyCountry)}
                      </div>
                      <div className="text-sm text-gray-600">Company Currency ({companyCurrency.code})</div>
                    </div>
                  </div>
                </div>

                {/* Additional Information for overdue without payments */}
                {(invoice.notes || invoice.terms) && (
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                    <h4 className="font-bold text-gray-900 text-lg mb-4">📄 Additional Information</h4>
                    {invoice.notes && (
                      <div className="mb-4">
                        <div className="font-semibold text-gray-700 mb-2">📝 Notes</div>
                        <p className="text-gray-700 leading-relaxed bg-white p-4 rounded border">{invoice.notes}</p>
                      </div>
                    )}
                    {invoice.terms && (
                      <div>
                        <div className="font-semibold text-gray-700 mb-2">📋 Terms & Conditions</div>
                        <p className="text-gray-700 leading-relaxed bg-white p-4 rounded border">{invoice.terms}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : statusResult.status === 'paid' ? (
            <Card className="border-2 border-gray-200 shadow-xl rounded-xl">
              <CardContent className="p-8">
                <div className="bg-green-50 p-6 rounded-xl border border-green-200 text-center">
                  <div className="text-green-600 text-lg font-semibold">
                    Payment for this invoice has been received in full on {(() => {
                      const latestPayment = paymentDoc?.partialPayments?.[paymentDoc.partialPayments.length - 1] || invoice.partialPayments?.[invoice.partialPayments.length - 1];
                      if (!latestPayment?.paymentDate) return 'N/A';
                      const paymentDate = latestPayment.paymentDate;
                      if (typeof paymentDate === 'object' && 'toDate' in paymentDate && typeof paymentDate.toDate === 'function') {
                        return paymentDate.toDate().toLocaleDateString();
                      }
                      if (paymentDate instanceof Date) {
                        return paymentDate.toLocaleDateString();
                      }
                      return 'N/A';
                    })()}. No further action is required.
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : statusResult.status === 'paid-after-due' ? (
            <Card className="border-2 border-gray-200 shadow-xl rounded-xl">
              <CardContent className="p-8">
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 text-center">
                  <div className="text-blue-600 text-lg font-semibold">
                    This invoice has been fully paid, but after the due date. We appreciate your payment. Please ensure timely payments in the future to avoid late fees or disruptions.
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (['pending', 'partially-paid'].includes(statusResult.status) && invoice.partialPayments && invoice.partialPayments.length > 0) ? (
            <Card className="border-2 border-gray-200 shadow-xl rounded-xl">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b-2 border-gray-200 rounded-t-xl">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-orange-600" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                {/* Payment Summary for Partially Paid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                    <h4 className="font-bold text-gray-900 text-lg mb-4">Total Amount Paid by Client</h4>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(
                          invoice.partialPayments.reduce((sum, payment) => sum + (payment.amountPaidByClient || 0), 0), 
                          clientCountry
                        )}
                      </div>
                      <div className="text-sm text-gray-600">Client Currency ({clientCurrency.code})</div>
                      <div className="text-xl font-semibold text-green-500">
                        {formatCurrency(
                          invoice.partialPayments.reduce((sum, payment) => sum + (payment.originalPaymentAmount || 0), 0), 
                          companyCountry
                        )}
                      </div>
                      <div className="text-sm text-gray-600">Company Currency ({companyCurrency.code})</div>
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
                    <h4 className="font-bold text-gray-900 text-lg mb-4">Pending Amount</h4>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-orange-600">
                        {formatCurrency(
                          (invoice.clientAmount || convertINRToClient(invoice.totalAmountINR || 0)) - 
                          invoice.partialPayments.reduce((sum, payment) => sum + (payment.amountPaidByClient || 0), 0),
                          clientCountry
                        )}
                      </div>
                      <div className="text-sm text-gray-600">Client Currency ({clientCurrency.code})</div>
                      <div className="text-xl font-semibold text-orange-500">
                        {formatCurrency(
                          (invoice.companyAmount || invoice.totalAmount || 0) - 
                          invoice.partialPayments.reduce((sum, payment) => sum + (payment.originalPaymentAmount || 0), 0),
                          companyCountry
                        )}
                      </div>
                      <div className="text-sm text-gray-600">Company Currency ({companyCurrency.code})</div>
                    </div>
                  </div>
                </div>

                {/* Payment History Table */}
                <div className="overflow-x-auto">
                  <Table>
                     <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-bold text-gray-900">Payment Date</TableHead>
                        <TableHead className="font-bold text-gray-900 text-right">Amount Paid (Company Currency)</TableHead>
                        <TableHead className="font-bold text-gray-900 text-right">Amount Paid (Client Currency)</TableHead>
                        <TableHead className="font-bold text-gray-900 text-center">Payment Method</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.partialPayments.map((payment, index) => {
                        const getPaymentMethodIcon = (method: string) => {
                          switch (method) {
                            case 'neft':
                            case 'rtgs':
                            case 'imps': return <Building className="w-4 h-4" />;
                            case 'upi': return <Smartphone className="w-4 h-4" />;
                            case 'credit_card':
                            case 'debit_card': return <CreditCard className="w-4 h-4" />;
                            case 'cash': return <Banknote className="w-4 h-4" />;
                            case 'cheque': return <IndianRupee className="w-4 h-4" />;
                            default: return <IndianRupee className="w-4 h-4" />;
                          }
                        };

                        return (
                          <TableRow key={index} className="hover:bg-gray-50">
                             <TableCell>
                               <div className="flex items-center text-sm">
                                 <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                                 {(() => {
                                   const paymentDate = payment.paymentDate;
                                   if (!paymentDate) return 'Invalid Date';
                                   if (typeof paymentDate === 'object' && 'toDate' in paymentDate && typeof paymentDate.toDate === 'function') {
                                     return paymentDate.toDate().toLocaleDateString();
                                   }
                                   if (paymentDate instanceof Date) {
                                     return paymentDate.toLocaleDateString();
                                   }
                                   return 'Invalid Date';
                                 })()}
                               </div>
                             </TableCell>
                             <TableCell className="text-right font-medium">
                               {formatCurrency(payment.originalPaymentAmount || 0, companyCountry)}
                             </TableCell>
                             <TableCell className="text-right font-medium">
                               {formatCurrency(payment.amountPaidByClient || 0, clientCountry)}
                             </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-2">
                                {getPaymentMethodIcon(payment.paymentMethod)}
                                <span className="capitalize">{payment.paymentMethod.replace('_', ' ').toUpperCase()}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Additional Information for partially paid */}
                {(invoice.notes || invoice.terms) && (
                  <div className="mt-8 bg-blue-50 p-6 rounded-xl border border-blue-200">
                    <h4 className="font-bold text-gray-900 text-lg mb-4">📄 Additional Information</h4>
                    {invoice.notes && (
                      <div className="mb-4">
                        <div className="font-semibold text-gray-700 mb-2">📝 Notes</div>
                        <p className="text-gray-700 leading-relaxed bg-white p-4 rounded border">{invoice.notes}</p>
                      </div>
                    )}
                    {invoice.terms && (
                      <div>
                        <div className="font-semibold text-gray-700 mb-2">📋 Terms & Conditions</div>
                        <p className="text-gray-700 leading-relaxed bg-white p-4 rounded border">{invoice.terms}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceView;

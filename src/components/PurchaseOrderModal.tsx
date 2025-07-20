import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Mail, Phone, Building, FileText, Globe, CreditCard, ExternalLink, Download, X } from 'lucide-react';
import { useCompanyData } from '@/hooks/useCompanyData';
import { getCurrencyByCountry } from '@/data/countryCurrencyMapping';
import { countryPhoneCodes } from '@/data/countryPhoneCodes';

interface PurchaseOrderModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
}

const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({ order, isOpen, onClose }) => {
  const { companyData } = useCompanyData();
  
  if (!order) return null;

  // Get company and supplier country info
  const companyCountry = companyData?.country || 'US';
  const supplierCountry = order.supplier?.country || companyCountry;
  
  const companyCurrency = getCurrencyByCountry(companyCountry);
  const supplierCurrency = getCurrencyByCountry(supplierCountry);

  // Format currency with appropriate currency symbol
  const formatCurrency = (amount: number, countryCode: string) => {
    const currencyInfo = getCurrencyByCountry(countryCode);
    return `${currencyInfo.symbol}${amount.toFixed(2)}`;
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

  // Get country name for display
  const getCountryName = (countryCode: string) => {
    const countryNames = {
      'US': 'United States', 'IN': 'India', 'GB': 'United Kingdom', 'DE': 'Germany',
      'FR': 'France', 'IT': 'Italy', 'ES': 'Spain', 'NL': 'Netherlands', 'CA': 'Canada',
      'AU': 'Australia', 'JP': 'Japan', 'CN': 'China', 'SG': 'Singapore', 'HK': 'Hong Kong',
      'MX': 'Mexico', 'BR': 'Brazil', 'ZA': 'South Africa', 'AE': 'United Arab Emirates',
      'SA': 'Saudi Arabia', 'DK': 'Denmark', 'NO': 'Norway', 'SE': 'Sweden', 'CH': 'Switzerland'
    };
    return countryNames[countryCode] || countryCode;
  };

  // Get the correct amount to display based on currency conversion
  const getDisplayAmount = (amount: number) => {
    // Use the company amount from currencyAmounts if available, otherwise use the original amount
    const companyAmount = order.currencyAmounts?.companyAmount || amount;
    return formatCurrency(companyAmount, companyCountry);
  };

  // Check if dual currency display is needed
  const showDualCurrency = companyCountry !== supplierCountry && order.conversionRate;
  
  // Currency conversion logic similar to invoice view
  const companyToINRRate = order.conversionRate?.companyToINR || 1;
  const INRToSupplierRate = order.conversionRate?.INRToClient || 1;

  const convertCompanyToINR = (amount: number) => amount * companyToINRRate;
  const convertINRToSupplier = (amountINR: number) => amountINR * INRToSupplierRate;

  // Get status color for order status
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Handle PDF generation
  const handleDownloadPDF = async () => {
    try {
      // Create comprehensive HTML for professional PDF following the same structure as invoice
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Purchase Order ${order.purchaseNumber || order.id}</title>
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
            .purchase-header { 
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
            .purchase-title {
              font-size: 48px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 10px;
            }
            .purchase-number {
              font-size: 24px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 15px;
            }
            .purchase-status {
              display: inline-block;
              padding: 6px 14px;
              border-radius: 20px;
              font-weight: 600;
              text-transform: uppercase;
              font-size: 13px;
              border: 2px solid;
            }
            .status-approved { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
            .status-pending { background: #fef3c7; color: #92400e; border-color: #fcd34d; }
            .status-draft { background: #f3f4f6; color: #374151; border-color: #d1d5db; }
            .status-rejected { background: #fee2e2; color: #dc2626; border-color: #fecaca; }
            
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
            .supplier-header { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); }
            
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
            
            /* Increased font sizes for company and supplier info */
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
            .items-table th:nth-child(3), .items-table td:nth-child(3) { text-align: right; }
            .items-table th:nth-child(4), .items-table td:nth-child(4) { text-align: center; }
            .items-table th:nth-child(5), .items-table td:nth-child(5) { text-align: right; }
            
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
            .purchase-footer {
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
              .purchase-meta { display: none; }
              .page-break-after { page-break-after: always; }
              
              /* First page styles */
              .first-page .purchase-meta { display: block; }
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
            <div class="purchase-header no-page-break">
              <div class="logo-section">
                ${companyData?.logoUrl ? `<img src="${companyData.logoUrl}" alt="Company Logo" class="company-logo">` : ''}
                <div>
                  <div class="purchase-title">PURCHASE ORDER</div>
                  <div class="purchase-number purchase-meta">#${order.purchaseNumber || order.id}</div>
                  <span class="purchase-status status-${(order.status || 'draft').toLowerCase()} purchase-meta">
                    ${(order.status || 'draft').toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div class="total-amount">
                <div class="amount-primary">
                  ${formatCurrency(order.currencyAmounts?.companyAmount || order.totalAmount || 0, companyCountry)}
                </div>
                ${order.currencyAmounts?.supplierAmount ? `
                  <div class="amount-secondary">
                    ${formatCurrency(order.currencyAmounts.supplierAmount, supplierCountry)}
                  </div>
                  <div style="font-size: 14px; color: #9ca3af; margin-top: 10px;">
                    ${companyCurrency.code} / ${supplierCurrency.code}
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Dates Section (First page only) - Same line display -->
            <div class="dates-section no-page-break purchase-meta" style="display: flex; justify-content: space-between; align-items: center;">
              <div class="date-item">
                <strong>Issue Date:</strong> ${order.issueDate?.toLocaleDateString() || 'N/A'}
              </div>
              <div class="date-item">
                <strong>Due Date:</strong> ${order.dueDate?.toLocaleDateString() || 'N/A'}
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
                    <div style="font-size: 14px; line-height: 1.3;"><strong>${companyData?.companyName || 'Company Name'}</strong></div>
                    <div style="font-size: 13px; line-height: 1.2;">${companyData?.streetAddress || ''}</div>
                    ${companyData?.city ? `<div style="font-size: 13px; line-height: 1.2;">${companyData.city}</div>` : ''}
                    <div style="font-size: 13px; line-height: 1.2;"><strong>Country:</strong> ${getCountryName(companyCountry)}</div>
                    ${companyData?.phone ? `<div style="font-size: 13px; line-height: 1.2;">📞 <span class="phone-number">${formatPhoneNumber(companyData.phone, companyCountry)}</span></div>` : ''}
                    ${companyData?.email ? `<div style="font-size: 13px; line-height: 1.2;">📧 ${companyData.email}</div>` : ''}
                    ${companyData?.website ? `<div style="font-size: 13px; line-height: 1.2;">🌐 ${companyData.website}</div>` : ''}
                  </div>

                  ${companyData?.taxInfo && (companyData.taxInfo.primaryType && companyData.taxInfo.primaryId) ? `
                    <div class="info-section">
                      <div class="section-title">🏛️ Tax Information</div>
                      <div style="font-size: 13px; line-height: 1.2;"><strong>${companyData.taxInfo.primaryType}:</strong> ${companyData.taxInfo.primaryId}</div>
                    </div>
                  ` : ''}

                  ${companyData?.bankInfo ? `
                    <div class="info-section">
                      <div class="section-title">🏦 Bank Information</div>
                      <table class="bank-table">
                        <tbody>
                          ${companyData.bankInfo.bankName ? `
                            <tr>
                              <td><strong>Bank Name</strong></td>
                              <td>${companyData.bankInfo.bankName}</td>
                            </tr>
                          ` : ''}
                          ${companyData.bankInfo.accountNumber ? `
                            <tr>
                              <td><strong>Account Number</strong></td>
                              <td>${companyData.bankInfo.accountNumber}</td>
                            </tr>
                          ` : ''}
                          ${companyData.bankInfo.routingCode ? `
                            <tr>
                              <td><strong>Routing Code</strong></td>
                              <td>${companyData.bankInfo.routingCode}</td>
                            </tr>
                          ` : ''}
                        </tbody>
                      </table>
                    </div>
                  ` : ''}

                  ${companyData?.signatureUrl ? `
                    <div class="signature-section">
                      <div class="section-title">✍️ Authorized Signatory</div>
                      <img src="${companyData.signatureUrl}" alt="Authorized Signatory" class="signature-image">
                      <div class="signature-details">
                        ${companyData.businessOwnerName ? `<div class="signature-name">${companyData.businessOwnerName}</div>` : ''}
                        ${companyData.businessOwnerPosition ? `<div class="signature-position">${companyData.businessOwnerPosition}</div>` : ''}
                      </div>
                    </div>
                  ` : ''}
                </div>
              </div>

              <!-- Supplier Information -->
              <div class="info-card">
                <div class="card-header supplier-header">Supplier Information</div>
                <div class="card-content">
                  <div class="info-section">
                    <div class="section-title">👤 Contact Details</div>
                    <div style="font-size: 14px; line-height: 1.3;"><strong>${order.supplier?.name || 'N/A'}</strong></div>
                    <div style="font-size: 13px; line-height: 1.2;">📧 ${order.supplier?.email || 'No email provided'}</div>
                    ${order.supplier?.phone ? `<div style="font-size: 13px; line-height: 1.2;">📞 <span class="phone-number">${formatPhoneNumber(order.supplier.phone, supplierCountry)}</span></div>` : ''}
                  </div>

                  <div class="info-section">
                    <div class="section-title">📍 Address</div>
                    ${order.supplier?.address ? `<div style="font-size: 13px; line-height: 1.2;">${order.supplier.address}</div>` : ''}
                    ${order.supplier?.city ? `<div style="font-size: 13px; line-height: 1.2;">City: ${order.supplier.city}</div>` : ''}
                    ${order.supplier?.pincode ? `<div style="font-size: 13px; line-height: 1.2;">Pincode: ${order.supplier.pincode}</div>` : ''}
                    ${(!order.supplier?.address && !order.supplier?.city) ? '<div style="font-size: 13px; line-height: 1.2;">Address information not available</div>' : ''}
                    <div style="font-size: 13px; line-height: 1.2;"><strong>Country:</strong> ${getCountryName(supplierCountry)}</div>
                  </div>

                   ${order.supplier?.taxInfo?.id ? `
                     <div class="info-section">
                       <div class="section-title">🏛️ Tax Information</div>
                       <div style="font-size: 13px; line-height: 1.2;"><strong>Tax ID:</strong> ${order.supplier.taxInfo.id}</div>
                     </div>
                   ` : ''}

                   <!-- Exchange Rate and Tax Rate Information -->
                   ${order.currencyAmounts || order.taxCalculation ? `
                     <div class="info-section" style="background: #f0f9ff; border-color: #0ea5e9;">
                       <div class="section-title" style="color: #0369a1;">📊 Rates Used</div>
                       ${order.currencyAmounts?.companyToINRRate && order.currencyAmounts.companyToINRRate !== 1 ? `
                         <div style="font-size: 13px; line-height: 1.2;"><strong>Company to INR Rate:</strong> 1 ${companyCurrency.code} = ₹${order.currencyAmounts.companyToINRRate.toFixed(4)}</div>
                       ` : ''}
                       ${order.currencyAmounts?.INRToSupplierRate && order.currencyAmounts.INRToSupplierRate !== 1 ? `
                         <div style="font-size: 13px; line-height: 1.2;"><strong>INR to Supplier Rate:</strong> ₹1 = ${order.currencyAmounts.INRToSupplierRate.toFixed(4)} ${supplierCurrency.code}</div>
                       ` : ''}
                       ${order.taxCalculation?.taxes?.[0]?.rate ? `
                         <div style="font-size: 13px; line-height: 1.2;"><strong>Tax Rate Used:</strong> ${order.taxCalculation.taxes[0].rate}%</div>
                       ` : ''}
                     </div>
                   ` : ''}
                </div>
              </div>
            </div>

          </div>

          <!-- Second Page: Purchase Order Items and Terms -->
          <div class="container page-break-before">
            <!-- Purchase Order Items -->
            <div class="info-card">
              <div class="card-header" style="background: linear-gradient(135deg, #faf5ff 0%, #e9d5ff 100%);">Purchase Order Items</div>
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
                     ${order.items?.map((item: any) => {
                       const discountRate = typeof item.discount === 'string' ? parseFloat(item.discount) || 0 : item.discount || 0;
                       const discountAmount = (item.rate || 0) * (item.quantity || 0) * (discountRate / 100);
                       const itemSubtotal = (item.rate || 0) * (item.quantity || 0);
                       const itemAmountAfterDiscount = itemSubtotal - discountAmount;
                       
                       return `
                           <tr>
                             <td>
                               <strong>${item.productCategory && item.itemName && item.productVersion 
                                 ? `${item.productCategory} - ${item.itemName} (${item.productVersion})`
                                 : (item.description || item.itemName || 'N/A')}</strong>
                               ${item.details ? `<br><small style="color: #6b7280;">${item.details}</small>` : ''}
                             </td>
                            <td style="text-align: center;">${item.quantity || 0}</td>
                            <td style="text-align: center;">${item.unit || 'pcs'}</td>
                           <td style="text-align: right;">
                             ${formatCurrency(item.rate || 0, companyCountry)}
                             ${showDualCurrency ? `
                               <div class="dual-currency">
                                 (${formatCurrency(convertINRToSupplier(convertCompanyToINR(item.rate || 0)), supplierCountry)})
                               </div>
                             ` : ''}
                           </td>
                           <td style="text-align: center;">
                             ${discountRate > 0 ? `
                               <span style="color: #ea580c; font-weight: 600;">${discountRate}%</span><br>
                               <small style="color: #6b7280;">-${formatCurrency(discountAmount, companyCountry)}</small>
                               ${showDualCurrency ? `
                                 <div class="dual-currency">
                                   (-${formatCurrency(convertINRToSupplier(convertCompanyToINR(discountAmount)), supplierCountry)})
                                 </div>
                               ` : ''}
                             ` : '<span style="color: #9ca3af;">—</span>'}
                           </td>
                           <td style="text-align: right;">
                             <strong>${formatCurrency(item.amount || itemAmountAfterDiscount, companyCountry)}</strong>
                             ${showDualCurrency ? `
                               <div class="dual-currency">
                                 (${formatCurrency(convertINRToSupplier(convertCompanyToINR(item.amount || itemAmountAfterDiscount)), supplierCountry)})
                               </div>
                             ` : ''}
                           </td>
                         </tr>
                       `;
                     }).join('') || '<tr><td colspan="6" style="text-align: center; color: #6b7280;">No items</td></tr>'}
                  </tbody>
                </table>

                <!-- Summary Section -->
                <div class="summary-section">
                  <div class="summary-row">
                    <span><strong>Subtotal (${companyCurrency.code}):</strong></span>
                    <span><strong>${formatCurrency(order.subtotal || 0, companyCountry)}</strong></span>
                  </div>
                  ${order.currencyAmounts?.supplierAmount ? `
                    <div class="summary-row">
                      <span>Subtotal (${supplierCurrency.code}):</span>
                      <span>${formatCurrency((order.currencyAmounts.supplierAmount - ((order.taxCalculation?.taxes?.[0]?.rate / 100 || 0) * order.currencyAmounts.supplierAmount)), supplierCountry)}</span>
                    </div>
                  ` : ''}
                  <div class="summary-row">
                    <span><strong>Total Tax (${companyCurrency.code}):</strong></span>
                    <span><strong>${formatCurrency(order.taxCalculation?.totalTaxAmount || 0, companyCountry)}</strong></span>
                  </div>
                  ${order.currencyAmounts?.supplierAmount ? `
                    <div class="summary-row">
                      <span>Total Tax (${supplierCurrency.code}):</span>
                      <span>${formatCurrency(((order.taxCalculation?.taxes?.[0]?.rate / 100 || 0) * order.currencyAmounts.supplierAmount), supplierCountry)}</span>
                    </div>
                  ` : ''}
                  <div class="summary-row summary-total">
                    <span>Total Amount (${companyCurrency.code}):</span>
                    <span>${formatCurrency(order.currencyAmounts?.companyAmount || order.totalAmount || 0, companyCountry)}</span>
                  </div>
                  ${order.currencyAmounts?.supplierAmount ? `
                    <div class="summary-row summary-total">
                      <span>Total Amount (${supplierCurrency.code}):</span>
                      <span>${formatCurrency(order.currencyAmounts.supplierAmount, supplierCountry)}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>

            <!-- Notes and Terms (Second page) -->
            ${(order.notes || order.terms) ? `
              <div class="notes-section">
                ${order.notes ? `
                  <div style="margin-bottom: 15px;">
                    <div class="section-title">📝 Notes</div>
                    <p style="font-size: 14px; line-height: 1.4;">${order.notes}</p>
                  </div>
                ` : ''}
                ${order.terms ? `
                  <div>
                    <div class="section-title">📋 Terms & Conditions</div>
                    <p style="font-size: 14px; line-height: 1.4;">${order.terms}</p>
                  </div>
                ` : ''}
              </div>
            ` : ''}

            <!-- Footer -->
            <div class="purchase-footer">
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
        a.download = `Purchase-Order-${order.purchaseNumber || order.id}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('Print dialog blocked. Downloaded HTML file instead. Use browser print to save as PDF.');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Simple fallback
      const content = `Purchase Order #${order.purchaseNumber || order.id}\nCompany: ${companyData?.companyName || 'N/A'}\nSupplier: ${order.supplier?.name || 'N/A'}\nTotal: ${formatCurrency(order.currencyAmounts?.companyAmount || order.totalAmount || 0, companyCountry)}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Purchase-Order-${order.purchaseNumber || order.id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        
        {/* Header with Download PDF and Close buttons */}
        <DialogHeader className="flex flex-row items-center justify-between p-6 border-b">
          <DialogTitle className="text-2xl font-bold">Purchase Order Details</DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </DialogHeader>
        
        {/* Purchase Order Header */}
        <Card className="border-2 border-gray-200 shadow-xl rounded-xl">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b-2 border-gray-200 rounded-t-xl p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                {companyData?.logoUrl && (
                  <img 
                    src={companyData.logoUrl} 
                    alt="Company Logo" 
                    className="w-32 h-32 object-contain rounded-xl border-2 border-gray-200 shadow-md"
                  />
                )}
                <div>
                  <DialogTitle className="text-6xl font-bold text-gray-900 mb-3">PURCHASE ORDER</DialogTitle>
                  <p className="text-2xl font-semibold text-gray-700 mb-4">#{order.purchaseNumber || order.id}</p>
                  {order.status && (
                    <Badge className={`px-4 py-2 text-lg font-semibold border-2 ${getStatusColor(order.status)}`}>
                      {order.status.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Total Amount Display - Always show dual currency like invoice view */}
              <div className="bg-white p-8 rounded-xl border-2 border-gray-200 shadow-lg text-right">
                <p className="text-4xl font-bold text-green-600 mb-2">
                  {formatCurrency(order.currencyAmounts?.companyAmount || order.totalAmount || 0, companyCountry)}
                </p>
                {order.currencyAmounts?.supplierAmount && (
                  <p className="text-2xl text-gray-600 mb-4">
                    {formatCurrency(order.currencyAmounts.supplierAmount, supplierCountry)}
                  </p>
                )}
                {order.currencyAmounts?.supplierAmount ? (
                  <p className="text-sm text-gray-500 font-medium">
                    Company ({companyCurrency.code}) / Supplier ({supplierCurrency.code})
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 font-medium">Total Amount</p>
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
                {companyData?.logoUrl && (
                  <img 
                    src={companyData.logoUrl} 
                    alt="Company Logo" 
                    className="w-24 h-24 object-contain rounded-xl border-2 border-gray-200 shadow-md"
                  />
                )}
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gray-900">{companyData?.companyName || 'Company Name'}</h3>
                  {companyData?.phone && (
                    <p className="text-gray-600 text-lg flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span className="font-mono text-sm">{formatPhoneNumber(companyData.phone, companyCountry)}</span>
                    </p>
                  )}
                  {companyData?.email && (
                    <p className="text-gray-600 text-lg flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {companyData.email}
                    </p>
                  )}
                  {companyData?.website && (
                    <p className="text-gray-600 text-lg flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      <a 
                        href={companyData.website.startsWith('http') ? companyData.website : `https://${companyData.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {companyData.website}
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
                  {companyData?.streetAddress || 'Address not available'}
                  {companyData?.city && <><br />{companyData.city}</>}
                  <br />
                  {getCountryName(companyCountry)}
                </p>
              </div>

              {/* Company Tax Information */}
              {companyData?.taxInfo && companyData.taxInfo.primaryType && companyData.taxInfo.primaryId && (
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                  <h4 className="font-bold mb-4 flex items-center gap-3 text-gray-900 text-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Tax Information
                  </h4>
                  <div className="p-3 bg-white rounded-lg border">
                    <span className="font-semibold text-gray-700 text-base">
                      {companyData.taxInfo.primaryType}: 
                    </span>
                    <span className="ml-2 text-gray-900 font-mono bg-gray-100 px-3 py-1 rounded border text-lg">
                      {companyData.taxInfo.primaryId}
                    </span>
                  </div>
                </div>
              )}

              {/* Bank Information */}
              {companyData?.bankInfo && (
                <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                  <h4 className="font-bold mb-4 flex items-center gap-3 text-gray-900 text-lg">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    Bank Information
                  </h4>
                  <div className="bg-white rounded-lg border-2 border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full">
                      <tbody>
                        {companyData.bankInfo.bankName && (
                          <tr className="border-b border-gray-100">
                            <td className="px-4 py-3 font-semibold text-gray-700 bg-gray-50 w-1/3">Bank Name</td>
                            <td className="px-4 py-3 text-gray-900 font-medium">{companyData.bankInfo.bankName}</td>
                          </tr>
                        )}
                        {companyData.bankInfo.accountNumber && (
                          <tr className="border-b border-gray-100">
                            <td className="px-4 py-3 font-semibold text-gray-700 bg-gray-50">Account Number</td>
                            <td className="px-4 py-3 text-gray-900 font-mono text-lg">{companyData.bankInfo.accountNumber}</td>
                          </tr>
                        )}
                        {companyData.bankInfo.routingCode && (
                          <tr>
                            <td className="px-4 py-3 font-semibold text-gray-700 bg-gray-50">Routing Code</td>
                            <td className="px-4 py-3 text-gray-900 font-mono text-lg">
                              {companyData.bankInfo.routingCode}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Business Owner Signature - Authorized Signatory Section */}
              {companyData?.signatureUrl && (
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                  <h4 className="font-bold mb-4 text-gray-900 text-lg">Authorized Signatory</h4>
                  <img 
                    src={companyData.signatureUrl} 
                    alt="Authorized Signatory"
                    className="max-w-48 h-24 object-contain border-2 rounded-lg bg-white p-3 shadow-sm mb-4"
                  />
                  <div className="mt-4 pt-4 border-t border-purple-200">
                    {companyData.businessOwnerName && (
                      <div className="font-semibold text-gray-900 text-base mb-2">
                        {companyData.businessOwnerName}
                      </div>
                    )}
                    {companyData.businessOwnerPosition && (
                      <div className="text-gray-600 italic text-sm">
                        {companyData.businessOwnerPosition}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Supplier Information */}
          <Card className="border-2 border-gray-200 shadow-xl rounded-xl">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b-2 border-gray-200 rounded-t-xl">
              <CardTitle className="text-xl font-bold text-gray-900">Supplier Information</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{order.supplier?.name || 'N/A'}</h3>
                <p className="text-gray-600 text-lg">{order.supplier?.email || 'No email provided'}</p>
                {order.supplier?.phone && (
                  <p className="text-gray-600 text-lg flex items-center gap-2 mt-2">
                    <Phone className="w-4 h-4" />
                    <span className="font-mono text-sm">{formatPhoneNumber(order.supplier.phone, supplierCountry)}</span>
                  </p>
                )}
              </div>
              
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h4 className="font-bold mb-4 flex items-center gap-3 text-gray-900 text-lg">
                  <MapPin className="w-5 h-5 text-orange-600" />
                  Address
                </h4>
                <div className="text-gray-700 leading-relaxed text-base">
                  {order.supplier?.address && (
                    <p>{order.supplier.address}</p>
                  )}
                  {order.supplier?.city && (
                    <p>City: {order.supplier.city}</p>
                  )}
                  {order.supplier?.pincode && (
                    <p>Pincode: {order.supplier.pincode}</p>
                  )}
                  {!order.supplier?.address && !order.supplier?.city && (
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
                  <p>Country: {getCountryName(supplierCountry)} ({supplierCurrency.code})</p>
                </div>
              </div>

              {/* Supplier Tax Information */}
              {order.supplier?.taxInfo && (
                <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                  <h4 className="font-bold mb-4 flex items-center gap-3 text-gray-900 text-lg">
                    <FileText className="w-5 h-5 text-yellow-600" />
                    Tax Information
                  </h4>
                  {order.supplier.taxInfo.id && (
                    <div className="p-3 bg-white rounded-lg border">
                      <span className="font-semibold text-gray-700 text-base">
                        Tax ID: 
                      </span>
                      <span className="ml-2 text-gray-900 font-mono bg-gray-100 px-3 py-1 rounded border text-lg">
                        {order.supplier.taxInfo.id}
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
                    {order.issueDate?.toLocaleDateString() || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-3 text-gray-700 font-medium text-base">
                    <Calendar className="w-5 h-5" />
                    Due Date:
                  </span>
                  <span className="font-semibold text-gray-900 text-base">
                    {order.dueDate?.toLocaleDateString() || 'N/A'}
                  </span>
                </div>
                
                {/* Exchange Rate Section */}
                {order.currencyAmounts && (
                  <div className="mt-6 pt-4 border-t border-gray-300 space-y-3">
                    {order.currencyAmounts.companyToINRRate && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-medium text-base">
                          Company to INR Rate:
                        </span>
                        <span className="font-semibold text-gray-900 text-base">
                          1 {companyCurrency.code} = {order.currencyAmounts.companyToINRRate.toFixed(4)} INR
                        </span>
                      </div>
                    )}
                    {order.currencyAmounts.INRToSupplierRate && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-medium text-base">
                          INR to Supplier Rate:
                        </span>
                        <span className="font-semibold text-gray-900 text-base">
                          1 INR = {order.currencyAmounts.INRToSupplierRate.toFixed(4)} {supplierCurrency.code}
                        </span>
                      </div>
                    )}
                    {/* Tax Rate Display */}
                    {order.taxCalculation?.taxes?.[0]?.rate && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-medium text-base">
                          Tax Rate Used:
                        </span>
                        <span className="font-semibold text-gray-900 text-base">
                          {order.taxCalculation.taxes[0].rate}%
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

          {/* Purchase Order Items - Enhanced Table Format */}
          <Card className="border-2 border-gray-200 shadow-xl rounded-xl">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-gray-200 rounded-t-xl">
              <CardTitle className="text-xl font-bold text-gray-900">Purchase Order Items</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="overflow-x-auto">
                <Table>
                   <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-bold text-gray-900">Description</TableHead>
                        <TableHead className="font-bold text-gray-900 text-center">Quantity</TableHead>
                        <TableHead className="font-bold text-gray-900 text-center">Unit</TableHead>
                        <TableHead className="font-bold text-gray-900 text-right">Rate</TableHead>
                        <TableHead className="font-bold text-gray-900 text-center">Discount</TableHead>
                        <TableHead className="font-bold text-gray-900 text-right">Amount</TableHead>
                      </TableRow>
                   </TableHeader>
                  <TableBody>
                     {order.items?.length > 0 ? order.items.map((item: any, index: number) => {
                       const discountRate = typeof item.discount === 'string' ? parseFloat(item.discount) || 0 : item.discount || 0;
                       const discountAmount = (item.rate || 0) * (item.quantity || 0) * (discountRate / 100);
                       const itemSubtotal = (item.rate || 0) * (item.quantity || 0);
                       const itemAmountAfterDiscount = itemSubtotal - discountAmount;
                       
                       return (
                         <TableRow key={index} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-gray-900">
                              <div className="font-semibold">
                                {item.productCategory && item.itemName && item.productVersion 
                                  ? `${item.productCategory} - ${item.itemName} (${item.productVersion})`
                                  : (item.description || item.itemName)}
                              </div>
                              {item.details && <div className="text-sm text-gray-600">{item.details}</div>}
                             </TableCell>
                            <TableCell className="text-center text-gray-700 font-medium">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-center text-gray-700 font-medium">
                              {item.unit || 'pcs'}
                            </TableCell>
                           <TableCell className="text-right text-gray-700">
                             <div className="font-semibold">{formatCurrency(item.rate || 0, companyCountry)}</div>
                             {showDualCurrency && (
                               <div className="text-sm text-gray-500">
                                 ({formatCurrency(convertINRToSupplier(convertCompanyToINR(item.rate || 0)), supplierCountry)})
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
                                       (-{formatCurrency(convertINRToSupplier(convertCompanyToINR(discountAmount)), supplierCountry)})
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
                                 ({formatCurrency(convertINRToSupplier(convertCompanyToINR(item.amount || itemAmountAfterDiscount)), supplierCountry)})
                               </div>
                             )}
                           </TableCell>
                         </TableRow>
                       );
                     }) : (
                       <TableRow>
                         <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                           No items found
                         </TableCell>
                       </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <Separator className="my-8 bg-gray-400 h-0.5" />

              {/* Updated Price Summary Section to match invoice view format */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl border-2 border-blue-200 space-y-4">
                {/* Subtotal (Company) */}
                <div className="flex justify-between text-gray-700 text-lg">
                  <span className="font-semibold">Subtotal (Company - {companyCurrency.code}):</span>
                  <span className="font-bold">{formatCurrency(order.subtotal || 0, companyCountry)}</span>
                </div>
                
                {/* Total Tax (Company) - Use taxCalculation.totalTaxAmount field */}
                <div className="flex justify-between text-gray-700 text-lg">
                  <span className="font-semibold">Total Tax (Company - {companyCurrency.code}):</span>
                  <span className="font-bold">{formatCurrency(order.taxCalculation?.totalTaxAmount || 0, companyCountry)}</span>
                </div>
                
                <Separator className="bg-blue-300 h-0.5" />
                
                {/* Total Amount (Company) */}
                <div className="flex justify-between text-xl font-bold text-green-600">
                  <span>Total Amount (Company - {companyCurrency.code}):</span>
                  <span>{formatCurrency(order.currencyAmounts?.companyAmount || order.totalAmount || 0, companyCountry)}</span>
                </div>

                {/* Supplier Currency Section - Show when supplier amount exists */}
                {order.currencyAmounts?.supplierAmount && (
                  <>
                    {/* Subtotal (Supplier) - Calculate supplier subtotal */}
                    <div className="flex justify-between text-gray-700 text-lg">
                      <span className="font-semibold">Subtotal (Supplier - {supplierCurrency.code}):</span>
                      <span className="font-bold">
                        {formatCurrency(
                          order.currencyAmounts.supplierAmount - ((order.taxCalculation?.taxes?.[0]?.rate / 100 || 0) * order.currencyAmounts.supplierAmount), 
                          supplierCountry
                        )}
                      </span>
                    </div>
                    
                    {/* Total Tax (Supplier) - Calculate supplier tax */}
                    <div className="flex justify-between text-gray-700 text-lg">
                      <span className="font-semibold">Total Tax (Supplier - {supplierCurrency.code}):</span>
                      <span className="font-bold">
                        {formatCurrency(
                          (order.taxCalculation?.taxes?.[0]?.rate / 100 || 0) * order.currencyAmounts.supplierAmount, 
                          supplierCountry
                        )}
                      </span>
                    </div>
                    
                    {/* Total Amount (Supplier) */}
                    <div className="flex justify-between text-xl font-bold text-green-600">
                      <span>Total Amount (Supplier):</span>
                      <span>{formatCurrency(order.currencyAmounts.supplierAmount, supplierCountry)}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

        {/* Notes and Terms */}
        {(order.notes || order.terms) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {order.notes && (
              <Card className="bg-yellow-50 border-yellow-200">
                <CardHeader>
                  <CardTitle className="text-lg text-yellow-800">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap text-yellow-900">{order.notes}</p>
                </CardContent>
              </Card>
            )}
            {order.terms && (
              <Card className="bg-purple-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-lg text-purple-800">Terms & Conditions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap text-purple-900">{order.terms}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseOrderModal;

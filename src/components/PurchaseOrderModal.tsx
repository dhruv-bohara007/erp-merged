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
import jsPDF from 'jspdf';

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

  // PDF Generation Function
  const generatePDF = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 20;
    let currentY = margin;

    // Helper function to add text with wrapping
    const addText = (text: string, x: number, y: number, maxWidth?: number, fontSize?: number) => {
      if (fontSize) pdf.setFontSize(fontSize);
      if (maxWidth) {
        const textLines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(textLines, x, y);
        return y + (textLines.length * (fontSize || 10) * 0.35);
      } else {
        pdf.text(text, x, y);
        return y + ((fontSize || 10) * 0.35);
      }
    };

    // PAGE 1: Header, Company Information, and Supplier Information
    
    // Header Section
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PURCHASE ORDER', margin, currentY);
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    currentY += 8;
    pdf.text(`#${order.purchaseNumber || order.id}`, margin, currentY);
    
    if (order.status) {
      currentY += 8;
      pdf.setFontSize(12);
      pdf.text(`Status: ${order.status.toUpperCase()}`, margin, currentY);
    }

    // Total Amount (right side)
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    const totalText = formatCurrency(order.currencyAmounts?.companyAmount || order.totalAmount || 0, companyCountry);
    pdf.text(totalText, pageWidth - margin - pdf.getTextWidth(totalText), margin + 8);
    
    if (order.currencyAmounts?.supplierAmount) {
      pdf.setFontSize(14);
      const supplierTotal = formatCurrency(order.currencyAmounts.supplierAmount, supplierCountry);
      pdf.text(supplierTotal, pageWidth - margin - pdf.getTextWidth(supplierTotal), margin + 16);
    }

    currentY += 20;

    // Company Information Section
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('COMPANY INFORMATION', margin, currentY);
    currentY += 8;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    if (companyData?.companyName) {
      pdf.setFont('helvetica', 'bold');
      currentY = addText(companyData.companyName, margin, currentY, undefined, 14);
      pdf.setFont('helvetica', 'normal');
      currentY += 2;
    }

    if (companyData?.email) {
      currentY = addText(`Email: ${companyData.email}`, margin, currentY);
      currentY += 2;
    }

    if (companyData?.phone) {
      currentY = addText(`Phone: ${formatPhoneNumber(companyData.phone, companyCountry)}`, margin, currentY);
      currentY += 2;
    }

    if (companyData?.website) {
      currentY = addText(`Website: ${companyData.website}`, margin, currentY);
      currentY += 2;
    }

    // Company Address
    if (companyData?.streetAddress || companyData?.city) {
      currentY += 3;
      pdf.setFont('helvetica', 'bold');
      currentY = addText('Address:', margin, currentY);
      pdf.setFont('helvetica', 'normal');
      
      let address = '';
      if (companyData?.streetAddress) address += companyData.streetAddress;
      if (companyData?.city) address += (address ? ', ' : '') + companyData.city;
      address += (address ? ', ' : '') + getCountryName(companyCountry);
      
      currentY = addText(address, margin, currentY, pageWidth - 2 * margin);
      currentY += 2;
    }

    // Company Tax Information
    if (companyData?.taxInfo?.primaryType && companyData?.taxInfo?.primaryId) {
      currentY += 3;
      currentY = addText(`${companyData.taxInfo.primaryType}: ${companyData.taxInfo.primaryId}`, margin, currentY);
      currentY += 2;
    }

    // Company Bank Information
    if (companyData?.bankInfo) {
      currentY += 3;
      pdf.setFont('helvetica', 'bold');
      currentY = addText('Bank Information:', margin, currentY);
      pdf.setFont('helvetica', 'normal');
      
      if (companyData.bankInfo.bankName) {
        currentY = addText(`Bank Name: ${companyData.bankInfo.bankName}`, margin, currentY);
      }
      if (companyData.bankInfo.accountNumber) {
        currentY = addText(`Account Number: ${companyData.bankInfo.accountNumber}`, margin, currentY);
      }
      if (companyData.bankInfo.routingCode) {
        currentY = addText(`Routing Code: ${companyData.bankInfo.routingCode}`, margin, currentY);
      }
      currentY += 2;
    }

    currentY += 10;

    // Supplier Information Section
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SUPPLIER INFORMATION', margin, currentY);
    currentY += 8;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');

    if (order.supplier?.name) {
      pdf.setFont('helvetica', 'bold');
      currentY = addText(order.supplier.name, margin, currentY, undefined, 14);
      pdf.setFont('helvetica', 'normal');
      currentY += 2;
    }

    if (order.supplier?.email) {
      currentY = addText(`Email: ${order.supplier.email}`, margin, currentY);
      currentY += 2;
    }

    if (order.supplier?.phone) {
      currentY = addText(`Phone: ${formatPhoneNumber(order.supplier.phone, supplierCountry)}`, margin, currentY);
      currentY += 2;
    }

    // Supplier Address
    if (order.supplier?.address || order.supplier?.city) {
      currentY += 3;
      pdf.setFont('helvetica', 'bold');
      currentY = addText('Address:', margin, currentY);
      pdf.setFont('helvetica', 'normal');
      
      let supplierAddress = '';
      if (order.supplier?.address) supplierAddress += order.supplier.address;
      if (order.supplier?.city) supplierAddress += (supplierAddress ? ', ' : '') + order.supplier.city;
      if (order.supplier?.pincode) supplierAddress += (supplierAddress ? ', ' : '') + order.supplier.pincode;
      
      currentY = addText(supplierAddress || 'Address information not available', margin, currentY, pageWidth - 2 * margin);
      currentY += 2;
    }

    currentY += 3;
    currentY = addText(`Country: ${getCountryName(supplierCountry)} (${supplierCurrency.code})`, margin, currentY);

    // Supplier Tax Information
    if (order.supplier?.taxInfo?.id) {
      currentY += 3;
      currentY = addText(`Tax ID: ${order.supplier.taxInfo.id}`, margin, currentY);
    }

    // Dates and Exchange Rates
    currentY += 10;
    if (order.issueDate) {
      currentY = addText(`Issue Date: ${order.issueDate.toLocaleDateString()}`, margin, currentY);
    }
    if (order.dueDate) {
      currentY = addText(`Due Date: ${order.dueDate.toLocaleDateString()}`, margin, currentY);
    }

    // Exchange Rates
    if (order.currencyAmounts) {
      if (order.currencyAmounts.companyToINRRate) {
        currentY += 2;
        currentY = addText(`Company to INR Rate: 1 ${companyCurrency.code} = ${order.currencyAmounts.companyToINRRate.toFixed(4)} INR`, margin, currentY);
      }
      if (order.currencyAmounts.INRToSupplierRate) {
        currentY = addText(`INR to Supplier Rate: 1 INR = ${order.currencyAmounts.INRToSupplierRate.toFixed(4)} ${supplierCurrency.code}`, margin, currentY);
      }
    }

    // PAGE 2: Items, Notes, and Terms & Conditions
    pdf.addPage();
    currentY = margin;

    // Purchase Order Items
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PURCHASE ORDER ITEMS', margin, currentY);
    currentY += 10;

    // Items Table Header
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    const colWidths = [60, 20, 30, 25, 30];
    const colX = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], 
                 margin + colWidths[0] + colWidths[1] + colWidths[2], 
                 margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3]];

    pdf.text('Description', colX[0], currentY);
    pdf.text('Qty', colX[1], currentY);
    pdf.text('Rate', colX[2], currentY);
    pdf.text('Discount', colX[3], currentY);
    pdf.text('Amount', colX[4], currentY);
    
    currentY += 5;
    pdf.line(margin, currentY, pageWidth - margin, currentY); // Header line
    currentY += 5;

    // Items Data
    pdf.setFont('helvetica', 'normal');
    if (order.items?.length > 0) {
      order.items.forEach((item: any) => {
        const description = item.productCategory && item.itemName && item.productVersion 
          ? `${item.productCategory} - ${item.itemName} (${item.productVersion})`
          : (item.description || item.itemName || 'N/A');
        
        const discountRate = typeof item.discount === 'string' ? parseFloat(item.discount) || 0 : item.discount || 0;
        const discountAmount = (item.rate || 0) * (item.quantity || 0) * (discountRate / 100);
        const itemAmountAfterDiscount = ((item.rate || 0) * (item.quantity || 0)) - discountAmount;

        // Description (with wrapping)
        const descLines = pdf.splitTextToSize(description, colWidths[0] - 5);
        pdf.text(descLines, colX[0], currentY);
        
        // Other columns
        pdf.text(String(item.quantity || 0), colX[1], currentY);
        pdf.text(formatCurrency(item.rate || 0, companyCountry), colX[2], currentY);
        pdf.text(discountRate > 0 ? `${discountRate}%` : '-', colX[3], currentY);
        pdf.text(formatCurrency(item.amount || itemAmountAfterDiscount, companyCountry), colX[4], currentY);
        
        currentY += Math.max(descLines.length * 4, 8);
      });
    } else {
      pdf.text('No items found', margin, currentY);
      currentY += 8;
    }

    currentY += 5;
    pdf.line(margin, currentY, pageWidth - margin, currentY); // Bottom line
    currentY += 10;

    // Price Summary
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PRICE SUMMARY', margin, currentY);
    currentY += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const summaryX = pageWidth - 80;
    currentY = addText(`Subtotal (${companyCurrency.code}):`, summaryX - 40, currentY);
    pdf.text(formatCurrency(order.subtotal || 0, companyCountry), summaryX, currentY - 4);
    
    currentY = addText(`Total Tax (${companyCurrency.code}):`, summaryX - 40, currentY);
    pdf.text(formatCurrency(order.taxCalculation?.totalTaxAmount || 0, companyCountry), summaryX, currentY - 4);
    
    pdf.setFont('helvetica', 'bold');
    currentY = addText(`Total Amount (${companyCurrency.code}):`, summaryX - 40, currentY);
    pdf.text(formatCurrency(order.currencyAmounts?.companyAmount || order.totalAmount || 0, companyCountry), summaryX, currentY - 4);

    // Supplier currency summary if available
    if (order.currencyAmounts?.supplierAmount) {
      currentY += 5;
      pdf.setFont('helvetica', 'normal');
      const supplierSubtotal = order.currencyAmounts.supplierAmount - ((order.taxCalculation?.taxes?.[0]?.rate / 100 || 0) * order.currencyAmounts.supplierAmount);
      const supplierTax = (order.taxCalculation?.taxes?.[0]?.rate / 100 || 0) * order.currencyAmounts.supplierAmount;
      
      currentY = addText(`Subtotal (${supplierCurrency.code}):`, summaryX - 40, currentY);
      pdf.text(formatCurrency(supplierSubtotal, supplierCountry), summaryX, currentY - 4);
      
      currentY = addText(`Total Tax (${supplierCurrency.code}):`, summaryX - 40, currentY);
      pdf.text(formatCurrency(supplierTax, supplierCountry), summaryX, currentY - 4);
      
      pdf.setFont('helvetica', 'bold');
      currentY = addText(`Total Amount (${supplierCurrency.code}):`, summaryX - 40, currentY);
      pdf.text(formatCurrency(order.currencyAmounts.supplierAmount, supplierCountry), summaryX, currentY - 4);
    }

    currentY += 15;

    // Notes Section
    if (order.notes) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('NOTES', margin, currentY);
      currentY += 8;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      currentY = addText(order.notes, margin, currentY, pageWidth - 2 * margin);
      currentY += 10;
    }

    // Terms & Conditions Section
    if (order.terms) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TERMS & CONDITIONS', margin, currentY);
      currentY += 8;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      currentY = addText(order.terms, margin, currentY, pageWidth - 2 * margin);
    }

    // Save the PDF
    pdf.save(`PurchaseOrder-${order.purchaseNumber || order.id}.pdf`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        
        {/* Header with Download PDF and Close buttons */}
        <DialogHeader className="flex flex-row items-center justify-between p-6 border-b">
          <DialogTitle className="text-2xl font-bold">Purchase Order Details</DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={generatePDF}>
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
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
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

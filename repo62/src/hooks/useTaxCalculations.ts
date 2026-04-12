
import { countryTaxData } from '@/data/countryTaxData';
import { useInvoiceSettings } from '@/hooks/useInvoiceSettings';

interface TaxCalculation {
  taxes: Array<{
    name: string;
    rate: number;
    amount: number;
  }>;
  totalTaxAmount: number;
  totalAmount: number;
}

export const useTaxCalculations = () => {
  const { invoiceSettings } = useInvoiceSettings();

  const calculateTaxes = (subtotal: number, companyCountry: string, clientCountry: string): TaxCalculation => {
    // Use invoice settings if available, otherwise fall back to country data
    if (invoiceSettings && invoiceSettings.defaultTaxes) {
      const taxes = invoiceSettings.defaultTaxes.map(tax => ({
        name: tax.name,
        rate: tax.rate,
        amount: subtotal * (tax.rate / 100)
      }));

      const totalTaxAmount = taxes.reduce((sum, tax) => sum + tax.amount, 0);

      return {
        taxes,
        totalTaxAmount,
        totalAmount: subtotal + totalTaxAmount
      };
    }

    // Fallback to original logic if invoice settings not available
    const countryData = countryTaxData.find(c => c.code === companyCountry);
    
    if (!countryData) {
      return {
        taxes: [],
        totalTaxAmount: 0,
        totalAmount: subtotal
      };
    }

    // For India, apply inter-state vs intra-state logic
    if (companyCountry === 'IN') {
      const isInterState = companyCountry !== clientCountry;
      
      if (isInterState) {
        // IGST only
        const igstRate = 18;
        const igstAmount = subtotal * (igstRate / 100);
        
        return {
          taxes: [{ name: 'IGST', rate: igstRate, amount: igstAmount }],
          totalTaxAmount: igstAmount,
          totalAmount: subtotal + igstAmount
        };
      } else {
        // CGST + SGST
        const cgstRate = 9;
        const sgstRate = 9;
        const cgstAmount = subtotal * (cgstRate / 100);
        const sgstAmount = subtotal * (sgstRate / 100);
        
        return {
          taxes: [
            { name: 'CGST', rate: cgstRate, amount: cgstAmount },
            { name: 'SGST', rate: sgstRate, amount: sgstAmount }
          ],
          totalTaxAmount: cgstAmount + sgstAmount,
          totalAmount: subtotal + cgstAmount + sgstAmount
        };
      }
    }

    // For other countries, apply default taxes
    const taxes = countryData.defaultTaxes.map(tax => ({
      name: tax.name,
      rate: tax.rate,
      amount: subtotal * (tax.rate / 100)
    }));

    const totalTaxAmount = taxes.reduce((sum, tax) => sum + tax.amount, 0);

    return {
      taxes,
      totalTaxAmount,
      totalAmount: subtotal + totalTaxAmount
    };
  };

  const getTaxDisplayName = (companyCountry: string, clientCountry: string): string => {
    // Use invoice settings tax names if available
    if (invoiceSettings && invoiceSettings.defaultTaxes && invoiceSettings.defaultTaxes.length > 0) {
      return invoiceSettings.defaultTaxes[0].name;
    }

    if (companyCountry === 'IN') {
      return companyCountry === clientCountry ? 'GST (Intra-state)' : 'GST (Inter-state)';
    }
    
    const countryData = countryTaxData.find(c => c.code === companyCountry);
    return countryData?.defaultTaxes[0]?.name || 'Tax';
  };

  return {
    calculateTaxes,
    getTaxDisplayName
  };
};

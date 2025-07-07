
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
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
}

export const useTaxCalculations = () => {
  const { invoiceSettings } = useInvoiceSettings();

  const calculateTaxes = (subtotal: number, companyCountry: string, clientCountry: string): TaxCalculation => {
    console.log('Calculating taxes for subtotal:', subtotal, 'Company:', companyCountry, 'Client:', clientCountry);
    
    // Initialize default values
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    let taxes: Array<{ name: string; rate: number; amount: number }> = [];

    // Use invoice settings if available, otherwise fall back to country data
    if (invoiceSettings && invoiceSettings.defaultTaxes && invoiceSettings.defaultTaxes.length > 0) {
      console.log('Using invoice settings taxes:', invoiceSettings.defaultTaxes);
      
      taxes = invoiceSettings.defaultTaxes.map(tax => {
        const amount = subtotal * (tax.rate / 100);
        console.log(`Tax ${tax.name} (${tax.rate}%): ₹${amount}`);
        
        // Map to specific GST types for Indian context
        if (tax.name.toUpperCase().includes('CGST')) {
          cgstAmount = amount;
        } else if (tax.name.toUpperCase().includes('SGST')) {
          sgstAmount = amount;
        } else if (tax.name.toUpperCase().includes('IGST')) {
          igstAmount = amount;
        }
        
        return {
          name: tax.name,
          rate: tax.rate,
          amount: amount
        };
      });
    } else {
      // Fallback to original logic if invoice settings not available
      const countryData = countryTaxData.find(c => c.code === companyCountry);
      
      if (!countryData) {
        console.log('No country data found, returning zero taxes');
        return {
          taxes: [],
          totalTaxAmount: 0,
          totalAmount: subtotal,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0
        };
      }

      // For India, apply inter-state vs intra-state logic
      if (companyCountry === 'IN') {
        const isInterState = companyCountry !== clientCountry;
        console.log('India tax calculation, isInterState:', isInterState);
        
        if (isInterState) {
          // IGST only
          const igstRate = 18;
          igstAmount = subtotal * (igstRate / 100);
          
          taxes = [{ name: 'IGST', rate: igstRate, amount: igstAmount }];
        } else {
          // CGST + SGST
          const cgstRate = 9;
          const sgstRate = 9;
          cgstAmount = subtotal * (cgstRate / 100);
          sgstAmount = subtotal * (sgstRate / 100);
          
          taxes = [
            { name: 'CGST', rate: cgstRate, amount: cgstAmount },
            { name: 'SGST', rate: sgstRate, amount: sgstAmount }
          ];
        }
      } else {
        // For other countries, apply default taxes
        taxes = countryData.defaultTaxes.map(tax => {
          const amount = subtotal * (tax.rate / 100);
          return {
            name: tax.name,
            rate: tax.rate,
            amount: amount
          };
        });
      }
    }

    const totalTaxAmount = taxes.reduce((sum, tax) => sum + tax.amount, 0);
    
    console.log('Final tax calculation:', {
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalTaxAmount,
      totalAmount: subtotal + totalTaxAmount
    });

    return {
      taxes,
      totalTaxAmount,
      totalAmount: subtotal + totalTaxAmount,
      cgstAmount,
      sgstAmount,
      igstAmount
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

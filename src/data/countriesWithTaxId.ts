export interface CountryTaxId {
  code: string;
  name: string;
  taxIdLabel: string;
  taxIdType: string;
  placeholder: string;
}

export const countriesWithTaxId: CountryTaxId[] = [
  // Americas
  { code: 'US', name: 'United States', taxIdLabel: 'EIN', taxIdType: 'EIN', placeholder: 'XX-XXXXXXX' },
  { code: 'CA', name: 'Canada', taxIdLabel: 'Business Number', taxIdType: 'BN', placeholder: 'XXXXXXXXX' },
  { code: 'BR', name: 'Brazil', taxIdLabel: 'CNPJ', taxIdType: 'CNPJ', placeholder: 'XX.XXX.XXX/XXXX-XX' },
  { code: 'MX', name: 'Mexico', taxIdLabel: 'RFC', taxIdType: 'RFC', placeholder: 'XXXXXXXXXXXX' },
  { code: 'AR', name: 'Argentina', taxIdLabel: 'CUIT', taxIdType: 'CUIT', placeholder: 'XX-XXXXXXXX-X' },
  { code: 'CL', name: 'Chile', taxIdLabel: 'RUT', taxIdType: 'RUT', placeholder: 'XX.XXX.XXX-X' },
  { code: 'CO', name: 'Colombia', taxIdLabel: 'NIT', taxIdType: 'NIT', placeholder: 'XXXXXXXXX-X' },
  { code: 'PE', name: 'Peru', taxIdLabel: 'RUC', taxIdType: 'RUC', placeholder: 'XXXXXXXXXXX' },

  // Europe
  { code: 'GB', name: 'United Kingdom', taxIdLabel: 'VAT Number', taxIdType: 'VAT', placeholder: 'GB XXXXXXXXX' },
  { code: 'DE', name: 'Germany', taxIdLabel: 'VAT Number', taxIdType: 'VAT', placeholder: 'DE XXXXXXXXX' },
  { code: 'FR', name: 'France', taxIdLabel: 'TVA Number', taxIdType: 'TVA', placeholder: 'FR XXXXXXXXXXX' },
  { code: 'IT', name: 'Italy', taxIdLabel: 'IVA Number', taxIdType: 'IVA', placeholder: 'IT XXXXXXXXXXX' },
  { code: 'ES', name: 'Spain', taxIdLabel: 'IVA Number', taxIdType: 'IVA', placeholder: 'ES XXXXXXXXX' },
  { code: 'NL', name: 'Netherlands', taxIdLabel: 'BTW Number', taxIdType: 'BTW', placeholder: 'NL XXXXXXXXX' },
  { code: 'BE', name: 'Belgium', taxIdLabel: 'VAT Number', taxIdType: 'VAT', placeholder: 'BE XXXXXXXXXX' },
  { code: 'CH', name: 'Switzerland', taxIdLabel: 'VAT Number', taxIdType: 'VAT', placeholder: 'CHE-XXX.XXX.XXX' },
  { code: 'AT', name: 'Austria', taxIdLabel: 'VAT Number', taxIdType: 'VAT', placeholder: 'AT XXXXXXXXX' },
  { code: 'SE', name: 'Sweden', taxIdLabel: 'VAT Number', taxIdType: 'VAT', placeholder: 'SE XXXXXXXXXXXX' },
  { code: 'NO', name: 'Norway', taxIdLabel: 'VAT Number', taxIdType: 'VAT', placeholder: 'NO XXXXXXXXX' },
  { code: 'DK', name: 'Denmark', taxIdLabel: 'VAT Number', taxIdType: 'VAT', placeholder: 'DK XXXXXXXX' },
  { code: 'FI', name: 'Finland', taxIdLabel: 'VAT Number', taxIdType: 'VAT', placeholder: 'FI XXXXXXXX' },
  { code: 'IE', name: 'Ireland', taxIdLabel: 'VAT Number', taxIdType: 'VAT', placeholder: 'IE XXXXXXXX' },
  { code: 'PT', name: 'Portugal', taxIdLabel: 'VAT Number', taxIdType: 'VAT', placeholder: 'PT XXXXXXXXX' },
  { code: 'PL', name: 'Poland', taxIdLabel: 'VAT Number', taxIdType: 'VAT', placeholder: 'PL XXXXXXXXXX' },
  { code: 'CZ', name: 'Czech Republic', taxIdLabel: 'VAT Number', taxIdType: 'VAT', placeholder: 'CZ XXXXXXXX' },
  { code: 'HU', name: 'Hungary', taxIdLabel: 'VAT Number', taxIdType: 'VAT', placeholder: 'HU XXXXXXXX' },
  { code: 'GR', name: 'Greece', taxIdLabel: 'VAT Number', taxIdType: 'VAT', placeholder: 'EL XXXXXXXXX' },

  // Asia Pacific
  { code: 'IN', name: 'India', taxIdLabel: 'GSTIN', taxIdType: 'GSTIN', placeholder: 'XXXXXXXXXXXXXXXXXXXX' },
  { code: 'CN', name: 'China', taxIdLabel: 'Tax ID', taxIdType: 'TAX_ID', placeholder: 'XXXXXXXXXXXXXXXXXX' },
  { code: 'JP', name: 'Japan', taxIdLabel: 'Tax ID', taxIdType: 'TAX_ID', placeholder: 'XXXXXXXXX' },
  { code: 'KR', name: 'South Korea', taxIdLabel: 'Tax ID', taxIdType: 'TAX_ID', placeholder: 'XXX-XX-XXXXX' },
  { code: 'SG', name: 'Singapore', taxIdLabel: 'GST Number', taxIdType: 'GST', placeholder: 'XXXXXXXXX' },
  { code: 'AU', name: 'Australia', taxIdLabel: 'ABN', taxIdType: 'ABN', placeholder: 'XX XXX XXX XXX' },
  { code: 'NZ', name: 'New Zealand', taxIdLabel: 'GST Number', taxIdType: 'GST', placeholder: 'XXX-XXX-XXX' },
  { code: 'HK', name: 'Hong Kong', taxIdLabel: 'BR Number', taxIdType: 'BR', placeholder: 'XXXXXXXX-XXX-XX' },
  { code: 'MY', name: 'Malaysia', taxIdLabel: 'GST Number', taxIdType: 'GST', placeholder: 'XXXXXXXXXXXX' },
  { code: 'TH', name: 'Thailand', taxIdLabel: 'Tax ID', taxIdType: 'TAX_ID', placeholder: 'XXXXXXXXXXXXX' },
  { code: 'ID', name: 'Indonesia', taxIdLabel: 'NPWP', taxIdType: 'NPWP', placeholder: 'XX.XXX.XXX.X-XXX.XXX' },
  { code: 'PH', name: 'Philippines', taxIdLabel: 'TIN', taxIdType: 'TIN', placeholder: 'XXX-XXX-XXX-XXX' },
  { code: 'VN', name: 'Vietnam', taxIdLabel: 'Tax Code', taxIdType: 'TAX_CODE', placeholder: 'XXXXXXXXXX' },

  // Middle East & Africa
  { code: 'AE', name: 'United Arab Emirates', taxIdLabel: 'TRN', taxIdType: 'TRN', placeholder: 'XXXXXXXXXXXXX' },
  { code: 'SA', name: 'Saudi Arabia', taxIdLabel: 'VAT Number', taxIdType: 'VAT', placeholder: 'XXXXXXXXXXXXX' },
  { code: 'EG', name: 'Egypt', taxIdLabel: 'Tax ID', taxIdType: 'TAX_ID', placeholder: 'XXXXXXXXX' },
  { code: 'ZA', name: 'South Africa', taxIdLabel: 'VAT Number', taxIdType: 'VAT', placeholder: 'XXXXXXXXXX' },
  { code: 'NG', name: 'Nigeria', taxIdLabel: 'TIN', taxIdType: 'TIN', placeholder: 'XXXXXXXX-XXXX' },
  { code: 'KE', name: 'Kenya', taxIdLabel: 'PIN', taxIdType: 'PIN', placeholder: 'PXXXXXXXXX' },
  { code: 'IL', name: 'Israel', taxIdLabel: 'VAT Number', taxIdType: 'VAT', placeholder: 'XXXXXXXXX' },
  { code: 'TR', name: 'Turkey', taxIdLabel: 'Tax Number', taxIdType: 'TAX_NUMBER', placeholder: 'XXXXXXXXXX' },

  // Others - Default to Tax ID
  { code: 'OTHER', name: 'Other', taxIdLabel: 'Tax ID', taxIdType: 'TAX_ID', placeholder: 'Enter Tax ID' },
];

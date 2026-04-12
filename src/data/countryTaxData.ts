
export interface CountryTaxInfo {
  code: string;
  name: string;
  defaultTaxes: Array<{
    name: string;
    rate: number;
    code: string;
  }>;
}

export const countryTaxData: CountryTaxInfo[] = [
  {
    code: 'US',
    name: 'United States',
    defaultTaxes: [
      { name: 'Sales Tax', rate: 8.5, code: 'US' }
    ]
  },
  {
    code: 'IN',
    name: 'India',
    defaultTaxes: [
      { name: 'CGST', rate: 9, code: 'IN' },
      { name: 'SGST', rate: 9, code: 'IN' },
      { name: 'IGST', rate: 18, code: 'IN' }
    ]
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    defaultTaxes: [
      { name: 'VAT', rate: 20, code: 'GB' }
    ]
  },
  {
    code: 'BR',
    name: 'Brazil',
    defaultTaxes: [
      { name: 'ICMS', rate: 18, code: 'BR' },
      { name: 'IPI', rate: 10, code: 'BR' }
    ]
  },
  {
    code: 'DE',
    name: 'Germany',
    defaultTaxes: [
      { name: 'VAT', rate: 19, code: 'DE' }
    ]
  },
  {
    code: 'CA',
    name: 'Canada',
    defaultTaxes: [
      { name: 'GST', rate: 5, code: 'CA' },
      { name: 'PST', rate: 7, code: 'CA' }
    ]
  },
  {
    code: 'AU',
    name: 'Australia',
    defaultTaxes: [
      { name: 'GST', rate: 10, code: 'AU' }
    ]
  },
  {
    code: 'FR',
    name: 'France',
    defaultTaxes: [
      { name: 'TVA', rate: 20, code: 'FR' }
    ]
  },
  {
    code: 'JP',
    name: 'Japan',
    defaultTaxes: [
      { name: 'Consumption Tax', rate: 10, code: 'JP' }
    ]
  },
  {
    code: 'CN',
    name: 'China',
    defaultTaxes: [
      { name: 'VAT', rate: 13, code: 'CN' }
    ]
  },
  {
    code: 'SG',
    name: 'Singapore',
    defaultTaxes: [
      { name: 'GST', rate: 7, code: 'SG' }
    ]
  },
  {
    code: 'HK',
    name: 'Hong Kong',
    defaultTaxes: [
      { name: 'No Tax', rate: 0, code: 'HK' }
    ]
  },
  {
    code: 'MX',
    name: 'Mexico',
    defaultTaxes: [
      { name: 'IVA', rate: 16, code: 'MX' }
    ]
  },
  {
    code: 'ES',
    name: 'Spain',
    defaultTaxes: [
      { name: 'IVA', rate: 21, code: 'ES' }
    ]
  },
  {
    code: 'IT',
    name: 'Italy',
    defaultTaxes: [
      { name: 'IVA', rate: 22, code: 'IT' }
    ]
  },
  {
    code: 'NL',
    name: 'Netherlands',
    defaultTaxes: [
      { name: 'BTW', rate: 21, code: 'NL' }
    ]
  },
  {
    code: 'ZA',
    name: 'South Africa',
    defaultTaxes: [
      { name: 'VAT', rate: 15, code: 'ZA' }
    ]
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    defaultTaxes: [
      { name: 'VAT', rate: 5, code: 'AE' }
    ]
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    defaultTaxes: [
      { name: 'VAT', rate: 15, code: 'SA' }
    ]
  }
];

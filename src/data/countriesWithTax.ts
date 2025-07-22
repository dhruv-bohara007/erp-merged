
export interface CountryTaxInfo {
  value: string;
  label: string;
  primaryTaxLabel: string;
  secondaryTaxLabel?: string;
  routingLabel: string;
  routingType: string;
}

export const countriesWithTaxInfo: CountryTaxInfo[] = [
  {
    value: 'US',
    label: 'United States',
    primaryTaxLabel: 'Federal EIN',
    routingLabel: 'Routing Number',
    routingType: 'ROUTING'
  },
  {
    value: 'IN',
    label: 'India',
    primaryTaxLabel: 'GSTIN',
    secondaryTaxLabel: 'PAN',
    routingLabel: 'IFSC Code',
    routingType: 'IFSC'
  },
  {
    value: 'BR',
    label: 'Brazil',
    primaryTaxLabel: 'CNPJ',
    secondaryTaxLabel: 'CPF',
    routingLabel: 'Bank Code',
    routingType: 'BANK_CODE'
  },
  {
    value: 'GB',
    label: 'United Kingdom',
    primaryTaxLabel: 'Company Number',
    routingLabel: 'Sort Code',
    routingType: 'SORT_CODE'
  },
  {
    value: 'DE',
    label: 'Germany',
    primaryTaxLabel: 'Handelsregisternummer',
    routingLabel: 'SWIFT/BIC',
    routingType: 'SWIFT'
  },
  {
    value: 'CA',
    label: 'Canada',
    primaryTaxLabel: 'Business Number',
    routingLabel: 'Institution Number',
    routingType: 'INSTITUTION'
  },
  {
    value: 'AU',
    label: 'Australia',
    primaryTaxLabel: 'ABN',
    routingLabel: 'BSB Number',
    routingType: 'BSB'
  },
  {
    value: 'FR',
    label: 'France',
    primaryTaxLabel: 'SIRET',
    routingLabel: 'SWIFT/BIC',
    routingType: 'SWIFT'
  },
  {
    value: 'JP',
    label: 'Japan',
    primaryTaxLabel: 'Corporate Number',
    routingLabel: 'Bank Code',
    routingType: 'BANK_CODE'
  },
  {
    value: 'CN',
    label: 'China',
    primaryTaxLabel: 'USCI',
    routingLabel: 'Bank Code',
    routingType: 'BANK_CODE'
  },
  {
    value: 'SG',
    label: 'Singapore',
    primaryTaxLabel: 'UEN',
    routingLabel: 'SWIFT Code',
    routingType: 'SWIFT'
  },
  {
    value: 'HK',
    label: 'Hong Kong',
    primaryTaxLabel: 'Company Registration Number',
    routingLabel: 'Bank Code',
    routingType: 'BANK_CODE'
  },
  {
    value: 'MX',
    label: 'Mexico',
    primaryTaxLabel: 'RFC',
    routingLabel: 'CLABE',
    routingType: 'CLABE'
  },
  {
    value: 'ES',
    label: 'Spain',
    primaryTaxLabel: 'NIF/CIF',
    routingLabel: 'SWIFT/BIC',
    routingType: 'SWIFT'
  },
  {
    value: 'IT',
    label: 'Italy',
    primaryTaxLabel: 'Codice Fiscale',
    routingLabel: 'SWIFT/BIC',
    routingType: 'SWIFT'
  },
  {
    value: 'NL',
    label: 'Netherlands',
    primaryTaxLabel: 'KvK Number',
    routingLabel: 'SWIFT/BIC',
    routingType: 'SWIFT'
  },
  {
    value: 'ZA',
    label: 'South Africa',
    primaryTaxLabel: 'Company Registration Number',
    routingLabel: 'Branch Code',
    routingType: 'BRANCH_CODE'
  },
  {
    value: 'AE',
    label: 'United Arab Emirates',
    primaryTaxLabel: 'Trade License Number',
    routingLabel: 'SWIFT Code',
    routingType: 'SWIFT'
  },
  {
    value: 'SA',
    label: 'Saudi Arabia',
    primaryTaxLabel: 'Commercial Registration',
    routingLabel: 'SWIFT Code',
    routingType: 'SWIFT'
  },
  {
    value: 'EG',
    label: 'Egypt',
    primaryTaxLabel: 'Tax Registration Number',
    routingLabel: 'SWIFT Code',
    routingType: 'SWIFT'
  }
];

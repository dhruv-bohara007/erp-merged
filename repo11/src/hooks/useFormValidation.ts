
import { useCompanyData } from './useCompanyData';
import { useInvoiceSettings } from './useInvoiceSettings';

export const useFormValidation = () => {
  const { companyData, isBusinessFormComplete } = useCompanyData();
  const { invoiceSettings, isInvoiceSettingsComplete } = useInvoiceSettings();

  const canCreateInvoice = () => {
    const businessComplete = isBusinessFormComplete(companyData);
    const invoiceComplete = isInvoiceSettingsComplete(invoiceSettings);
    
    return businessComplete && invoiceComplete;
  };

  const getValidationMessage = () => {
    const businessComplete = isBusinessFormComplete(companyData);
    const invoiceComplete = isInvoiceSettingsComplete(invoiceSettings);

    if (!businessComplete && !invoiceComplete) {
      return 'Please complete both Business Information and Invoice Settings in Company Profile to create invoices.';
    } else if (!businessComplete) {
      return 'Please complete Business Information in Company Profile to create invoices.';
    } else if (!invoiceComplete) {
      return 'Please complete Invoice Settings in Company Profile to create invoices.';
    }
    
    return '';
  };

  return {
    canCreateInvoice,
    getValidationMessage
  };
};

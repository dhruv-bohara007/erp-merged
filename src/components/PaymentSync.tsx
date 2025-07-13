
import { useEffect } from 'react';
import { useInvoices } from '@/hooks/useFirestore';

const PaymentSync = () => {
  const { invoices, updateInvoice } = useInvoices();

  useEffect(() => {
    // Update invoice status based on payment amounts in company currency
    invoices.forEach(async (invoice) => {
      const amountPaidInCompanyCurrency = invoice.amountPaidInCompanyCurrency || 0;
      const totalCompanyAmount = invoice.totalAmount || 0;
      const dueDate = invoice.dueDate || new Date();
      const isOverdue = new Date() > dueDate;
      
      let correctStatus = invoice.status;
      
      // Only update status if it's not draft
      if (invoice.status !== 'draft') {
        if (amountPaidInCompanyCurrency === 0 && !isOverdue) {
          correctStatus = 'sent';
        } else if (amountPaidInCompanyCurrency > 0 && amountPaidInCompanyCurrency < totalCompanyAmount && !isOverdue) {
          correctStatus = 'pending';
        } else if (amountPaidInCompanyCurrency < totalCompanyAmount && isOverdue) {
          correctStatus = 'overdue';
        } else if (amountPaidInCompanyCurrency >= totalCompanyAmount) {
          correctStatus = 'paid';
        }
      }
      
      // Update status if it's incorrect
      if (correctStatus !== invoice.status) {
        try {
          await updateInvoice(invoice.id, { status: correctStatus });
          console.log(`Updated invoice ${invoice.invoiceNumber} status from ${invoice.status} to ${correctStatus}`);
        } catch (error) {
          console.error(`Failed to update invoice ${invoice.invoiceNumber} status:`, error);
        }
      }
    });
  }, [invoices, updateInvoice]);

  return null; // This component doesn't render anything
};

export default PaymentSync;

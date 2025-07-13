
import { useEffect } from 'react';
import { useInvoices, usePayments } from '@/hooks/useFirestore';

const PaymentSync = () => {
  const { invoices, updateInvoice } = useInvoices();
  const { payments, addPayment } = usePayments();

  useEffect(() => {
    // Check for invoices marked as "paid" that don't have corresponding payment records
    const paidInvoices = invoices.filter(invoice => invoice.status === 'paid');
    
    paidInvoices.forEach(async (invoice) => {
      // Check if this invoice already has a payment record
      const existingPayment = payments.find(payment => payment.invoiceId === invoice.id);
      
      if (!existingPayment) {
        // Create a payment record for this paid invoice
        try {
          await addPayment({
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            clientId: invoice.clientId,
            clientName: invoice.clientName,
            amount: invoice.totalAmount || 0,
            // Required multi-currency fields
            amountINR: invoice.totalAmountINR || invoice.totalAmount || 0,
            companyAmount: invoice.companyAmount || invoice.totalAmount || 0,
            clientAmount: invoice.clientAmount || invoice.totalAmount || 0,
            conversionRate: invoice.conversionRate || {
              INRToCompany: 1,
              companyToClient: 1,
              INRToClient: 1,
              timestamp: new Date()
            },
            paymentMethod: 'cash', // Default method, can be updated later
            paymentDate: invoice.updatedAt || new Date(),
            status: 'completed',
            notes: 'Auto-created from paid invoice',
            amountPaidByClient: invoice.clientAmount || invoice.totalAmount || 0,
          });
          console.log(`Created payment record for invoice ${invoice.invoiceNumber}`);
        } catch (error) {
          console.error(`Failed to create payment record for invoice ${invoice.invoiceNumber}:`, error);
        }
      }
    });
  }, [invoices, payments, addPayment]);

  return null; // This component doesn't render anything
};

export default PaymentSync;

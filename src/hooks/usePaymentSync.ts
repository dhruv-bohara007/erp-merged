
import { useEffect } from 'react';
import { useInvoices, usePayments } from '@/hooks/useFirestore';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const usePaymentSync = () => {
  const { invoices, updateInvoice } = useInvoices();
  const { payments } = usePayments();

  useEffect(() => {
    // Function to calculate payment totals for a specific invoice
    const calculatePaymentTotals = (invoiceId: string) => {
      const invoicePayments = payments.filter(payment => payment.invoiceId === invoiceId);
      
      const paidUSD = invoicePayments.reduce((sum, payment) => 
        sum + (payment.originalPaymentAmount || 0), 0
      );
      
      const paidINR = invoicePayments.reduce((sum, payment) => 
        sum + (payment.amount || 0), 0
      );

      return { paidUSD, paidINR };
    };

    // Function to determine invoice status
    const determineStatus = (paidUSD: number, companyAmount: number, dueDate: Date) => {
      const now = new Date();
      const isOverdue = now > dueDate;
      
      if (paidUSD >= companyAmount) {
        return 'paid';
      } else if (paidUSD > 0 && paidUSD < companyAmount) {
        return isOverdue ? 'overdue' : 'pending';
      } else if (paidUSD === 0) {
        return isOverdue ? 'overdue' : 'sent';
      }
      return 'draft';
    };

    // Function to sync invoice with payment data
    const syncInvoice = async (invoice: any) => {
      try {
        const { paidUSD, paidINR } = calculatePaymentTotals(invoice.id);
        const companyAmount = invoice.companyAmount || invoice.totalAmount || 0;
        const totalAmountINR = invoice.totalAmountINR || invoice.totalAmount || 0;
        const pendingINR = Math.max(0, totalAmountINR - paidINR);
        
        const status = determineStatus(paidUSD, companyAmount, invoice.dueDate || new Date());

        // Only update if values have changed
        const currentPaidUSD = invoice.paidUSD || 0;
        const currentPaidINR = invoice.paidINR || 0;
        const currentPendingINR = invoice.pendingINR || totalAmountINR;
        const currentStatus = invoice.status || 'draft';

        if (
          currentPaidUSD !== paidUSD ||
          currentPaidINR !== paidINR ||
          currentPendingINR !== pendingINR ||
          currentStatus !== status
        ) {
          console.log(`Syncing invoice ${invoice.invoiceNumber}:`, {
            paidUSD,
            paidINR,
            pendingINR,
            status
          });

          await updateInvoice(invoice.id, {
            paidUSD,
            paidINR,
            pendingINR,
            status
          });
        }
      } catch (error) {
        console.error(`Failed to sync invoice ${invoice.invoiceNumber}:`, error);
      }
    };

    // Sync all invoices when payments change
    const syncAllInvoices = async () => {
      if (invoices.length === 0 || payments.length === 0) return;

      // Group invoices that have payments
      const invoicesWithPayments = invoices.filter(invoice => 
        payments.some(payment => payment.invoiceId === invoice.id)
      );

      // Also sync invoices that might need status updates (e.g., overdue)
      const invoicesNeedingSync = invoices.filter(invoice => {
        const hasPayments = payments.some(payment => payment.invoiceId === invoice.id);
        const isOverdue = invoice.dueDate && new Date() > invoice.dueDate;
        const needsStatusUpdate = isOverdue && (invoice.status === 'sent' || !invoice.status);
        
        return hasPayments || needsStatusUpdate;
      });

      // Remove duplicates
      const uniqueInvoices = [...new Set([...invoicesWithPayments, ...invoicesNeedingSync])];

      for (const invoice of uniqueInvoices) {
        await syncInvoice(invoice);
      }
    };

    syncAllInvoices();
  }, [invoices, payments, updateInvoice]);

  return null;
};

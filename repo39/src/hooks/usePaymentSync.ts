import { useEffect, useRef } from 'react';
import { useInvoices, usePayments } from '@/hooks/useFirestore';

export const usePaymentSync = () => {
  const { invoices, updateInvoice } = useInvoices();
  const { payments } = usePayments();
  const processedInvoicesRef = useRef(new Set<string>());

  useEffect(() => {
    if (!invoices.length || !payments.length) return;

    const invoicesWithPayments = invoices.filter(invoice => 
      payments.some(payment => payment.invoiceId === invoice.id)
    );

    invoicesWithPayments.forEach(async (invoice) => {
      // Skip if already processed in this session
      const cacheKey = `${invoice.id}-${payments.length}`;
      if (processedInvoicesRef.current.has(cacheKey)) return;

      // Get all payments for this invoice
      const invoicePayments = payments.filter(p => p.invoiceId === invoice.id);
      
      // Calculate totals
      const paidUSD = invoicePayments.reduce((sum, p) => sum + (p.originalPaymentAmount || 0), 0);
      const paidINR = invoicePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const pendingINR = Math.max(0, (invoice.totalAmountINR || 0) - paidINR);

      // Determine status
      const companyAmount = invoice.companyAmount || 0;
      const dueDate = invoice.dueDate || new Date();
      const isOverdue = new Date() > dueDate;
      
      let status: 'draft' | 'sent' | 'paid' | 'overdue' | 'pending';
      if (paidUSD >= companyAmount) {
        status = 'paid';
      } else if (paidUSD > 0 && !isOverdue) {
        status = 'pending';
      } else if (paidUSD === 0 && !isOverdue) {
        status = 'sent';
      } else if (paidUSD < companyAmount && isOverdue) {
        status = 'overdue';
      } else {
        status = invoice.status || 'draft';
      }

      // Check if update is needed
      const needsUpdate = 
        invoice.paidUSD !== paidUSD ||
        invoice.paidINR !== paidINR ||
        invoice.pendingINR !== pendingINR ||
        invoice.status !== status;

      if (needsUpdate) {
        try {
          await updateInvoice(invoice.id, {
            paidUSD,
            paidINR,
            pendingINR,
            status
          });
          
          // Mark as processed
          processedInvoicesRef.current.add(cacheKey);
          
          console.log(`Synced invoice ${invoice.invoiceNumber}:`, {
            paidUSD,
            paidINR,
            pendingINR,
            status
          });
        } catch (error) {
          console.error(`Failed to sync invoice ${invoice.invoiceNumber}:`, error);
        }
      }
    });
  }, [invoices, payments]); // Removed updateInvoice from dependencies

  return null;
};
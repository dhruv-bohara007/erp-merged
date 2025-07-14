
import { useEffect, useRef } from 'react';
import { useInvoices, usePayments } from '@/hooks/useFirestore';

export const usePaymentSync = () => {
  const { invoices, updateInvoice } = useInvoices();
  const { payments } = usePayments();
  const processedInvoicesRef = useRef(new Set<string>());
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (!invoices.length || !payments.length || isProcessingRef.current) return;

    const invoicesWithPayments = invoices.filter(invoice => 
      payments.some(payment => payment.invoiceId === invoice.id)
    );

    if (invoicesWithPayments.length === 0) return;

    const processInvoices = async () => {
      isProcessingRef.current = true;
      
      try {
        for (const invoice of invoicesWithPayments) {
          // Create a more specific cache key that includes payment amounts
          const invoicePayments = payments.filter(p => p.invoiceId === invoice.id);
          const totalPaid = invoicePayments.reduce((sum, p) => sum + (p.originalPaymentAmount || 0), 0);
          const cacheKey = `${invoice.id}-${totalPaid}-${invoice.paidUSD || 0}`;
          
          // Skip if already processed with current payment state
          if (processedInvoicesRef.current.has(cacheKey)) continue;

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

          // Check if update is actually needed (with tolerance for floating point)
          const needsUpdate = 
            Math.abs((invoice.paidUSD || 0) - paidUSD) > 0.01 ||
            Math.abs((invoice.paidINR || 0) - paidINR) > 0.01 ||
            Math.abs((invoice.pendingINR || 0) - pendingINR) > 0.01 ||
            invoice.status !== status;

          if (needsUpdate) {
            await updateInvoice(invoice.id, {
              paidUSD,
              paidINR,
              pendingINR,
              status
            });
            
            console.log(`Synced invoice ${invoice.invoiceNumber}:`, {
              paidUSD,
              paidINR,
              pendingINR,
              status
            });
          }

          // Mark as processed with current state
          processedInvoicesRef.current.add(cacheKey);
        }
      } catch (error) {
        console.error('Failed to sync invoices:', error);
      } finally {
        isProcessingRef.current = false;
      }
    };

    // Debounce the processing to prevent rapid successive calls
    const timeoutId = setTimeout(processInvoices, 1000);
    return () => clearTimeout(timeoutId);
  }, [invoices, payments, updateInvoice]);

  return null;
};

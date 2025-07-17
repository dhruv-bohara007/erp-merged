
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
          const cacheKey = `${invoice.id}-${totalPaid.toFixed(2)}-${(invoice.paidUSD || 0).toFixed(2)}`;
          
          // Skip if already processed with current payment state
          if (processedInvoicesRef.current.has(cacheKey)) continue;

          // Calculate totals using originalPaymentAmount for proper aggregation
          const paidUSD = invoicePayments.reduce((sum, p) => sum + (p.originalPaymentAmount || 0), 0);
          const paidINR = invoicePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
          const pendingINR = Math.max(0, (invoice.totalAmountINR || 0) - paidINR);

          // Determine status
          const companyAmount = invoice.companyAmount || 0;
          const dueDate = invoice.dueDate || new Date();
          const isOverdue = new Date() > dueDate;
          
          let status: 'draft' | 'sent' | 'paid' | 'overdue' | 'pending';
          if (paidUSD >= companyAmount || (companyAmount - paidUSD) <= 0.01) { // Using small threshold
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
              paidUSD: Number(paidUSD.toFixed(2)),
              paidINR: Number(paidINR.toFixed(2)),
              pendingINR: Number(pendingINR.toFixed(2)),
              status
            });
            
            console.log(`Synced invoice ${invoice.invoiceNumber}:`, {
              paidUSD: paidUSD.toFixed(2),
              paidINR: paidINR.toFixed(2),
              pendingINR: pendingINR.toFixed(2),
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

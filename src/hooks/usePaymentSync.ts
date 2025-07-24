
import { useEffect, useRef } from 'react';
import { useInvoices, usePayments } from '@/hooks/useFirestore';
import { calculateInvoiceStatus } from '@/utils/invoiceStatusUtils';

export const usePaymentSync = () => {
  const { invoices, updateInvoice } = useInvoices();
  const { payments } = usePayments();
  const processedInvoicesRef = useRef(new Set<string>());
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (!invoices.length || !payments.length || isProcessingRef.current) return;

    // With new structure, payments array contains one document per invoice
    const invoicesWithPayments = invoices.filter(invoice => 
      payments.some(payment => payment.invoiceId === invoice.id)
    );

    if (invoicesWithPayments.length === 0) return;

    const processInvoices = async () => {
      isProcessingRef.current = true;
      
      try {
        for (const invoice of invoicesWithPayments) {
          const paymentDoc = payments.find(p => p.invoiceId === invoice.id);
          if (!paymentDoc) continue;

          // Create cache key based on payment document's updated timestamp and total amounts
          const cacheKey = `${invoice.id}-${paymentDoc.totalPaidUSD.toFixed(2)}-${paymentDoc.totalPaidINR.toFixed(2)}-${paymentDoc.updatedAt?.toMillis?.() || Date.now()}`;
          
          // Skip if already processed with current payment state
          if (processedInvoicesRef.current.has(cacheKey)) continue;

          // Use totals from payment document
          const paidUSD = paymentDoc.totalPaidUSD || 0;
          const paidINR = paymentDoc.totalPaidINR || 0;
          const pendingINR = paymentDoc.pendingINR || 0;

          // Determine status using new status calculation
          const statusResult = calculateInvoiceStatus(invoice, paidUSD);
          const status = statusResult.status;

          // Check if update is actually needed
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

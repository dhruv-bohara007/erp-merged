import { useEffect, useRef } from 'react';
import { useInvoices, usePayments } from '@/hooks/useFirestore';
import { recalculateInvoice } from '@/services/invoiceRecalc';
import { deriveInvoiceFromPayment } from '@/utils/deriveInvoiceFromPayment';

export const usePaymentSync = () => {
  const { invoices } = useInvoices();
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

          const cacheKey = `${invoice.id}-${paymentDoc.totalPaidUSD.toFixed(2)}-${paymentDoc.totalPaidINR.toFixed(2)}-${paymentDoc.updatedAt?.toMillis?.() || Date.now()}`;

          if (processedInvoicesRef.current.has(cacheKey)) continue;

          const derived = deriveInvoiceFromPayment(invoice, paymentDoc);

          const needsUpdate =
            Math.abs((invoice.paidUSD || 0) - derived.paidUSD) > 0.01 ||
            Math.abs((invoice.paidINR || 0) - derived.paidINR) > 0.01 ||
            Math.abs((invoice.pendingINR || 0) - derived.pendingINR) > 0.01 ||
            invoice.status !== derived.status ||
            (invoice.partialPayments?.length || 0) !== (derived.partialPayments?.length || 0);

          if (needsUpdate) {
            await recalculateInvoice(invoice.id);
          }

          processedInvoicesRef.current.add(cacheKey);
        }
      } catch (error) {
        console.error('Failed to sync invoices:', error);
      } finally {
        isProcessingRef.current = false;
      }
    };

    const timeoutId = setTimeout(processInvoices, 1000);
    return () => clearTimeout(timeoutId);
  }, [invoices, payments]);

  return null;
};

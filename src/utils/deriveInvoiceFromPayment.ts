import type { Invoice } from '@/hooks/useFirestore';
import type { PartialPayment, Payment } from '@/types/firestore';
import { calculateInvoiceStatus } from '@/utils/invoiceStatusUtils';

export interface DerivedInvoicePaymentFields {
  paidUSD: number;
  paidINR: number;
  pendingINR: number;
  amountPaidByClient: number;
  status: Invoice['status'];
  /** Line items copied from the payment document (source of truth). */
  partialPayments: PartialPayment[];
}

function getPartials(paymentDoc: Payment | Record<string, unknown> | null | undefined): PartialPayment[] {
  if (!paymentDoc || typeof paymentDoc !== 'object') return [];
  const raw = (paymentDoc as Payment).partialPayments;
  if (!Array.isArray(raw)) return [];
  return raw as PartialPayment[];
}

/**
 * Derives invoice payment fields from the authoritative `payments` document.
 * Status uses company-currency totals only (totalPaidUSD vs invoice company total).
 */
export function deriveInvoiceFromPayment(
  invoice: Invoice,
  paymentDoc: Payment | Record<string, unknown> | null | undefined
): DerivedInvoicePaymentFields {
  const partials = getPartials(paymentDoc);

  const totalPaidUSD = partials.reduce(
    (sum, pp) => sum + (Number(pp.originalPaymentAmount) || 0),
    0
  );
  const totalPaidINR = partials.reduce(
    (sum, pp) =>
      sum +
      (Number(pp.originalPaymentAmount) || 0) * (Number(pp.conversionRate?.companyToINR) || 0),
    0
  );
  const amountPaidByClient = partials.reduce(
    (sum, pp) => sum + (Number(pp.amountPaidByClient) || 0),
    0
  );

  const totalAmountINR =
    Number(invoice.totalAmountINR) || Number(invoice.totalAmount) || 0;
  const pendingINR = Math.max(0, totalAmountINR - totalPaidINR);

  if (invoice.status === 'draft') {
    return {
      paidUSD: Number(totalPaidUSD.toFixed(2)),
      paidINR: Number(totalPaidINR.toFixed(2)),
      pendingINR: Number(pendingINR.toFixed(2)),
      amountPaidByClient: Number(amountPaidByClient.toFixed(2)),
      status: 'draft',
      partialPayments: partials,
    };
  }

  const { status } = calculateInvoiceStatus(invoice, totalPaidUSD);

  return {
    paidUSD: Number(totalPaidUSD.toFixed(2)),
    paidINR: Number(totalPaidINR.toFixed(2)),
    pendingINR: Number(pendingINR.toFixed(2)),
    amountPaidByClient: Number(amountPaidByClient.toFixed(2)),
    status: status as Invoice['status'],
    partialPayments: partials,
  };
}

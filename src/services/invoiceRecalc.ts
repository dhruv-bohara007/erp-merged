import { doc, getDoc, updateDoc, Timestamp, type DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Invoice } from '@/hooks/useFirestore';
import type { Payment } from '@/types/firestore';
import { deriveInvoiceFromPayment } from '@/utils/deriveInvoiceFromPayment';

function mapFirestoreToInvoice(id: string, data: DocumentData): Invoice {
  return {
    id,
    ...data,
    issueDate: data.issueDate?.toDate?.() ?? new Date(),
    dueDate: data.dueDate?.toDate?.() ?? new Date(),
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
  } as Invoice;
}

/**
 * Single writer for invoice payment denormalization: reads `payments/{invoiceId}`,
 * derives totals and status, updates the invoice in one `updateDoc`.
 */
export async function recalculateInvoice(invoiceId: string): Promise<void> {
  const invoiceRef = doc(db, 'invoices', invoiceId);
  const paymentRef = doc(db, 'payments', invoiceId);

  const [invoiceSnap, paymentSnap] = await Promise.all([
    getDoc(invoiceRef),
    getDoc(paymentRef),
  ]);

  if (!invoiceSnap.exists()) return;

  const invoice = mapFirestoreToInvoice(invoiceSnap.id, invoiceSnap.data());
  const paymentData: Payment | null = paymentSnap.exists()
    ? ({ id: paymentSnap.id, ...paymentSnap.data() } as Payment)
    : null;

  const derived = deriveInvoiceFromPayment(invoice, paymentData);

  await updateDoc(invoiceRef, {
    paidUSD: derived.paidUSD,
    paidINR: derived.paidINR,
    pendingINR: derived.pendingINR,
    amountPaidByClient: derived.amountPaidByClient,
    status: derived.status,
    partialPayments: derived.partialPayments,
    updatedAt: Timestamp.now(),
  });
}

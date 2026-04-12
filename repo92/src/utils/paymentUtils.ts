import { Payment } from '@/types/firestore';

// Utility functions to handle both old and new payment structures during migration
export const getPaymentAmount = (payment: any): number => {
  // For new structure, use totalPaidUSD; for old structure, use amount
  return payment.totalPaidUSD ?? payment.amount ?? 0;
};

export const getOriginalPaymentAmount = (payment: any): number => {
  // For new structure, calculate from partialPayments; for old structure, use originalPaymentAmount
  if (payment.partialPayments && Array.isArray(payment.partialPayments)) {
    return payment.partialPayments.reduce((sum: number, pp: any) => sum + (pp.originalPaymentAmount || 0), 0);
  }
  return payment.originalPaymentAmount ?? payment.amount ?? 0;
};

export const getPaymentDate = (payment: any): Date => {
  // For new structure, get the latest payment date from partialPayments; for old structure, use paymentDate
  if (payment.partialPayments && Array.isArray(payment.partialPayments) && payment.partialPayments.length > 0) {
    const latestPayment = payment.partialPayments[payment.partialPayments.length - 1];
    return latestPayment.paymentDate?.toDate?.() || latestPayment.paymentDate || new Date();
  }
  return payment.paymentDate?.toDate?.() || payment.paymentDate || payment.updatedAt?.toDate?.() || new Date();
};

export const getPaymentMethod = (payment: any): string => {
  // For new structure, get the latest payment method from partialPayments; for old structure, use paymentMethod
  if (payment.partialPayments && Array.isArray(payment.partialPayments) && payment.partialPayments.length > 0) {
    const latestPayment = payment.partialPayments[payment.partialPayments.length - 1];
    return latestPayment.paymentMethod || 'unknown';
  }
  return payment.paymentMethod || 'unknown';
};

export const getPaymentReferenceNumber = (payment: any): string | undefined => {
  // For new structure, get from the latest partial payment; for old structure, use referenceNumber
  if (payment.partialPayments && Array.isArray(payment.partialPayments) && payment.partialPayments.length > 0) {
    const latestPayment = payment.partialPayments[payment.partialPayments.length - 1];
    return latestPayment.referenceNumber;
  }
  return payment.referenceNumber;
};

export const getPaymentNotes = (payment: any): string | undefined => {
  // For new structure, get from the latest partial payment; for old structure, use notes
  if (payment.partialPayments && Array.isArray(payment.partialPayments) && payment.partialPayments.length > 0) {
    const latestPayment = payment.partialPayments[payment.partialPayments.length - 1];
    return latestPayment.notes;
  }
  return payment.notes;
};

export const getAmountPaidByClient = (payment: any): number => {
  // For new structure, calculate from partialPayments; for old structure, use amountPaidByClient
  if (payment.partialPayments && Array.isArray(payment.partialPayments)) {
    return payment.partialPayments.reduce((sum: number, pp: any) => sum + (pp.amountPaidByClient || 0), 0);
  }
  return payment.amountPaidByClient ?? 0;
};

// Check if this is the new payment structure
export const isNewPaymentStructure = (payment: any): payment is Payment => {
  return payment.partialPayments !== undefined && Array.isArray(payment.partialPayments);
};
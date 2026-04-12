import type { Invoice } from '@/hooks/useFirestore';

export type InvoiceStatus = 'draft' | 'sent' | 'pending' | 'partially-paid' | 'paid' | 'overdue' | 'paid-after-due';

export interface StatusResult {
  status: InvoiceStatus;
  daysOverdue?: number;
  isPartialOverdue?: boolean;
}

export const calculateInvoiceStatus = (
  invoice: Invoice,
  paidAmount: number = 0
): StatusResult => {
  const totalAmount = invoice.companyAmount || invoice.totalAmount || 0;
  const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : new Date();
  const now = new Date();
  const isOverdue = now > dueDate;
  const daysOverdue = isOverdue ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  
  // Consider invoice paid if difference is less than 0.01 (accounting for rounding)
  const isPaid = Math.abs(totalAmount - paidAmount) < 0.01;
  const hasPartialPayment = paidAmount > 0 && !isPaid;

  if (isPaid) {
    return {
      status: isOverdue ? 'paid-after-due' : 'paid'
    };
  }

  if (isOverdue) {
    return {
      status: 'overdue',
      daysOverdue,
      isPartialOverdue: hasPartialPayment
    };
  }

  if (hasPartialPayment) {
    return {
      status: 'partially-paid'
    };
  }

  return {
    status: 'pending'
  };
};

export const getStatusColor = (status: InvoiceStatus): string => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'partially-paid':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'pending':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'sent':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'draft':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'overdue':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'paid-after-due':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getStatusDisplay = (statusResult: StatusResult): string => {
  const { status, daysOverdue, isPartialOverdue } = statusResult;
  
  switch (status) {
    case 'draft':
      return '🟡 Draft';
    case 'sent':
      return '🟠 Sent';
    case 'pending':
      return '🟠 Pending';
    case 'partially-paid':
      return '🟡 Partially Paid';
    case 'paid':
      return '🟢 Paid';
    case 'overdue':
      if (isPartialOverdue) {
        return `🔴 Partial - Overdue${daysOverdue ? ` by ${daysOverdue} days` : ''}`;
      }
      return `🔴 Overdue${daysOverdue ? ` by ${daysOverdue} days` : ''}`;
    case 'paid-after-due':
      return '🔵 Paid (After Due Date)';
    default:
      return '🟠 Pending';
  }
};
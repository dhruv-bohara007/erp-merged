// Legacy Payment interface for backward compatibility during transition
// This can be removed once all components are updated to use the new structure

export interface LegacyPayment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  amount: number;
  paymentMethod: string;
  paymentDate: Date;
  status: 'completed' | 'pending' | 'failed';
  referenceNumber?: string;
  bankDetails?: {
    fromAccount?: string;
    toAccount?: string;
    ifscCode?: string;
  };
  notes?: string;
  pendingAmountINR?: number;
  originalPaymentAmount?: number;
  originalCurrency?: string;
  amountPaidByClient: number;
  createdAt: Date;
}
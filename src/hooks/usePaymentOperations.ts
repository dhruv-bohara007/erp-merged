import { useState } from 'react';
import { doc, setDoc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Payment, PartialPayment } from '@/types/firestore';
import { toast } from 'sonner';
import { recalculateInvoice } from '@/services/invoiceRecalc';

export const usePaymentOperations = () => {
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  const addPartialPayment = async (
    invoiceId: string,
    invoiceNumber: string,
    clientId: string,
    clientName: string,
    partialPayment: Omit<PartialPayment, 'conversionRate' | 'paymentDate'> & {
      conversionRate: Omit<PartialPayment['conversionRate'], 'timestamp'>;
      paymentDate: string;
    }
  ) => {
    if (!currentUser?.companyId) {
      throw new Error('User company ID not found');
    }

    setLoading(true);
    try {
      const paymentDocRef = doc(db, 'payments', invoiceId);

      // Prepare the partial payment with proper timestamp
      const paymentDate = new Date(partialPayment.paymentDate);
      const newPartialPayment: PartialPayment = {
        ...partialPayment,
        paymentDate: Timestamp.fromDate(paymentDate),
        conversionRate: {
          ...partialPayment.conversionRate,
          timestamp: Timestamp.now()
        }
      };

      // Check if payment document exists
      const existingDoc = await getDoc(paymentDocRef);
      
      if (existingDoc.exists()) {
        // Document exists, append to partialPayments array
        const existingData = existingDoc.data() as Payment;
        const existingPartialPayments = existingData.partialPayments || [];
        const updatedPartialPayments = [...existingPartialPayments, newPartialPayment];
        
        // Calculate totals from all partial payments
        const totalPaidUSD = updatedPartialPayments.reduce((sum, pp) => sum + pp.originalPaymentAmount, 0);
        const totalPaidINR = updatedPartialPayments.reduce((sum, pp) => sum + (pp.originalPaymentAmount * pp.conversionRate.companyToINR), 0);
        const newPendingINR = Math.max(0, partialPayment.pendingPaymentInINR);
        
        // Update payments collection
        await updateDoc(paymentDocRef, {
          partialPayments: updatedPartialPayments,
          totalPaidUSD,
          totalPaidINR,
          pendingINR: newPendingINR,
          status: newPendingINR <= 0 ? 'completed' : 'partial',
          updatedAt: Timestamp.now()
        });
      } else {
        // Document doesn't exist, create it
        const totalPaidUSD = newPartialPayment.originalPaymentAmount;
        const totalPaidINR = newPartialPayment.originalPaymentAmount * newPartialPayment.conversionRate.companyToINR;
        const newPendingINR = Math.max(0, partialPayment.pendingPaymentInINR);
        
        const newPaymentDoc: Payment = {
          id: invoiceId,
          invoiceId,
          invoiceNumber,
          clientId,
          clientName,
          companyId: currentUser.companyId,
          totalPaidUSD,
          totalPaidINR,
          pendingINR: newPendingINR,
          status: newPendingINR <= 0 ? 'completed' : 'partial',
          partialPayments: [newPartialPayment],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        await setDoc(paymentDocRef, newPaymentDoc);
      }

      await recalculateInvoice(invoiceId);

      toast.success('Payment recorded successfully');
    } catch (error) {
      console.error('Error adding partial payment:', error);
      toast.error('Failed to record payment');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deletePartialPayment = async (invoiceId: string, paymentIndex: number) => {
    if (!currentUser?.companyId) {
      throw new Error('User company ID not found');
    }

    setLoading(true);
    try {
      const paymentDocRef = doc(db, 'payments', invoiceId);
      const existingDoc = await getDoc(paymentDocRef);
      
      if (!existingDoc.exists()) {
        throw new Error('Payment document not found');
      }

      const existingData = existingDoc.data() as Payment;
      const partialPayments = existingData.partialPayments || [];
      
      if (paymentIndex < 0 || paymentIndex >= partialPayments.length) {
        throw new Error('Invalid payment index');
      }

      // Remove the payment at the specified index
      const updatedPartialPayments = partialPayments.filter((_, index) => index !== paymentIndex);
      
      // Recalculate totals from remaining partial payments
      const totalPaidUSD = updatedPartialPayments.reduce((sum, pp) => sum + pp.originalPaymentAmount, 0);
      const totalPaidINR = updatedPartialPayments.reduce((sum, pp) => sum + (pp.originalPaymentAmount * pp.conversionRate.companyToINR), 0);

      const invoiceSnap = await getDoc(doc(db, 'invoices', invoiceId));
      if (!invoiceSnap.exists()) {
        throw new Error('Invoice not found');
      }
      const invData = invoiceSnap.data();
      const totalAmountINR = Number(invData.totalAmountINR ?? invData.totalAmount ?? 0);
      const pendingINR = Math.max(0, totalAmountINR - totalPaidINR);

      await updateDoc(paymentDocRef, {
        partialPayments: updatedPartialPayments,
        totalPaidUSD,
        totalPaidINR,
        pendingINR,
        status: pendingINR <= 0 ? 'completed' : 'partial',
        updatedAt: Timestamp.now()
      });

      await recalculateInvoice(invoiceId);

      toast.success('Payment deleted successfully');
    } catch (error) {
      console.error('Error deleting partial payment:', error);
      toast.error('Failed to delete payment');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentTotals = async (
    invoiceId: string,
    totalPaidUSD: number,
    totalPaidINR: number,
    pendingINR: number
  ) => {
    if (!currentUser?.companyId) {
      throw new Error('User company ID not found');
    }

    setLoading(true);
    try {
      const paymentDocRef = doc(db, 'payments', invoiceId);
      
      await updateDoc(paymentDocRef, {
        totalPaidUSD,
        totalPaidINR,
        pendingINR,
        status: pendingINR <= 0 ? 'completed' : 'partial',
        updatedAt: Timestamp.now()
      });

      await recalculateInvoice(invoiceId);

      toast.success('Payment totals updated');
    } catch (error) {
      console.error('Error updating payment totals:', error);
      toast.error('Failed to update payment totals');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    addPartialPayment,
    deletePartialPayment,
    updatePaymentTotals,
    loading
  };
};
import { useState } from 'react';
import { doc, setDoc, updateDoc, Timestamp, getDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Payment, PartialPayment } from '@/types/firestore';
import { toast } from 'sonner';

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
      const invoiceDocRef = doc(db, 'invoices', invoiceId);
      
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
        const totalAmountPaidByClient = updatedPartialPayments.reduce((sum, pp) => sum + pp.amountPaidByClient, 0);
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

        // Update invoice document with partial payment and calculated totals
        await updateDoc(invoiceDocRef, {
          partialPayments: arrayUnion(newPartialPayment),
          paidUSD: totalPaidUSD,
          paidINR: totalPaidINR,
          amountPaidByClient: totalAmountPaidByClient,
          updatedAt: Timestamp.now()
        });
      } else {
        // Document doesn't exist, create it
        const totalPaidUSD = newPartialPayment.originalPaymentAmount;
        const totalPaidINR = newPartialPayment.originalPaymentAmount * newPartialPayment.conversionRate.companyToINR;
        const totalAmountPaidByClient = newPartialPayment.amountPaidByClient;
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

        // Update invoice document with partial payment and calculated totals
        await updateDoc(invoiceDocRef, {
          partialPayments: [newPartialPayment],
          paidUSD: totalPaidUSD,
          paidINR: totalPaidINR,
          amountPaidByClient: totalAmountPaidByClient,
          updatedAt: Timestamp.now()
        });
      }

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
      const invoiceDocRef = doc(db, 'invoices', invoiceId);
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
      const totalAmountPaidByClient = updatedPartialPayments.reduce((sum, pp) => sum + pp.amountPaidByClient, 0);
      
      // Get pending amount from the last payment or use existing
      const lastPayment = updatedPartialPayments[updatedPartialPayments.length - 1];
      const pendingINR = lastPayment?.pendingPaymentInINR || existingData.pendingINR;

      // Update payments collection
      await updateDoc(paymentDocRef, {
        partialPayments: updatedPartialPayments,
        totalPaidUSD,
        totalPaidINR,
        pendingINR,
        status: pendingINR <= 0 ? 'completed' : 'partial',
        updatedAt: Timestamp.now()
      });

      // Update invoice document with new partial payments array and recalculated totals
      await updateDoc(invoiceDocRef, {
        partialPayments: updatedPartialPayments,
        paidUSD: totalPaidUSD,
        paidINR: totalPaidINR,
        amountPaidByClient: totalAmountPaidByClient,
        updatedAt: Timestamp.now()
      });

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
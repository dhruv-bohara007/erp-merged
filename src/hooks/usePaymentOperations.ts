import { useState } from 'react';
import { doc, setDoc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';
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

      // Calculate new totals
      const newTotalPaidUSD = partialPayment.amount;
      const newTotalPaidINR = partialPayment.amount; // Adjust based on conversion
      const newPendingINR = Math.max(0, partialPayment.pendingPaymentInINR);

      // Check if payment document exists
      const existingDoc = await getDoc(paymentDocRef);
      
      if (existingDoc.exists()) {
        // Document exists, append to partialPayments array
        const existingData = existingDoc.data() as Payment;
        const existingPartialPayments = existingData.partialPayments || [];
        
        await updateDoc(paymentDocRef, {
          partialPayments: [...existingPartialPayments, newPartialPayment],
          totalPaidUSD: (existingData.totalPaidUSD || 0) + newTotalPaidUSD,
          totalPaidINR: (existingData.totalPaidINR || 0) + newTotalPaidINR,
          pendingINR: newPendingINR,
          status: newPendingINR <= 0 ? 'completed' : 'partial',
          updatedAt: Timestamp.now()
        });
      } else {
        // Document doesn't exist, create it
        const newPaymentDoc: Payment = {
          id: invoiceId,
          invoiceId,
          invoiceNumber,
          clientId,
          clientName,
          companyId: currentUser.companyId,
          totalPaidUSD: newTotalPaidUSD,
          totalPaidINR: newTotalPaidINR,
          pendingINR: newPendingINR,
          status: newPendingINR <= 0 ? 'completed' : 'partial',
          partialPayments: [newPartialPayment],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        await setDoc(paymentDocRef, newPaymentDoc);
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
    updatePaymentTotals,
    loading
  };
};
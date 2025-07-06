
import { useState, useEffect } from 'react';
import { useDisplayCurrency } from './useDisplayCurrency';
import { Payment } from './useFirestore';

interface DisplayPayment extends Payment {
  displayAmount: string;
  displayCurrency: string;
}

export const usePaymentDisplay = (payments: Payment[]) => {
  const { convertAmount, formatDisplayAmount, loading } = useDisplayCurrency();
  const [displayPayments, setDisplayPayments] = useState<DisplayPayment[]>([]);

  useEffect(() => {
    const convertPayments = async () => {
      if (loading || payments.length === 0) return;

      const converted = await Promise.all(
        payments.map(async (payment) => {
          const displayAmount = await convertAmount(payment.amount);
          return {
            ...payment,
            displayAmount: formatDisplayAmount(displayAmount),
            displayCurrency: displayAmount.currency
          };
        })
      );

      setDisplayPayments(converted);
    };

    convertPayments();
  }, [payments, convertAmount, formatDisplayAmount, loading]);

  return {
    displayPayments,
    loading
  };
};

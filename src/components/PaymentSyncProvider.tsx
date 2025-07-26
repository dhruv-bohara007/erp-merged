import { usePaymentSync } from '@/hooks/usePaymentSync';

const PaymentSyncProvider = ({ children }: { children: React.ReactNode }) => {
  usePaymentSync();
  return <>{children}</>;
};

export default PaymentSyncProvider;
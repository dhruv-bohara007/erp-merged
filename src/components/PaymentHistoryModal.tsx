
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, CreditCard, Banknote, Smartphone, Building, IndianRupee } from 'lucide-react';
import { Payment } from '@/hooks/useFirestore';
import { getCurrencyByCountry } from '@/data/countryCurrencyMapping';

interface PaymentHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  invoiceNumber: string;
  payments: Payment[];
  companyCountry?: string;
}

const PaymentHistoryModal = ({ 
  open, 
  onOpenChange, 
  invoiceId, 
  invoiceNumber, 
  payments,
  companyCountry 
}: PaymentHistoryModalProps) => {
  // Filter payments for this specific invoice
  const invoicePayments = payments.filter(payment => payment.invoiceId === invoiceId);

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'neft':
      case 'rtgs':
      case 'imps': return <Building className="w-4 h-4" />;
      case 'upi': return <Smartphone className="w-4 h-4" />;
      case 'credit_card':
      case 'debit_card': return <CreditCard className="w-4 h-4" />;
      case 'cash': return <Banknote className="w-4 h-4" />;
      case 'cheque': return <IndianRupee className="w-4 h-4" />;
      default: return <IndianRupee className="w-4 h-4" />;
    }
  };

  const getCompanyCurrencySymbol = () => {
    if (!companyCountry) return '$';
    const currencyInfo = getCurrencyByCountry(companyCountry);
    return currencyInfo.symbol;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Payment History - {invoiceNumber}</DialogTitle>
        </DialogHeader>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment Date</TableHead>
                <TableHead>Amount Paid (Company Currency)</TableHead>
                <TableHead>Amount in INR</TableHead>
                <TableHead>Payment Method</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoicePayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    No payments found for this invoice
                  </TableCell>
                </TableRow>
              ) : (
                invoicePayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                        {payment.paymentDate?.toDate ? payment.paymentDate.toDate().toLocaleDateString() : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {getCompanyCurrencySymbol()}{(payment.originalPaymentAmount || 0).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">₹{(payment.amount || 0).toLocaleString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(payment.paymentMethod)}
                        <span className="capitalize">{payment.paymentMethod.replace('_', ' ').toUpperCase()}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentHistoryModal;

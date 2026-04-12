
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calendar, CreditCard, Banknote, Smartphone, Building, IndianRupee, Trash2 } from 'lucide-react';
import { Payment } from '@/types/firestore';
import { getPaymentDate, getOriginalPaymentAmount, getPaymentMethod } from '@/utils/paymentUtils';
import { getCurrencyByCountry } from '@/data/countryCurrencyMapping';
import { useToast } from '@/hooks/use-toast';
import { usePaymentOperations } from '@/hooks/usePaymentOperations';

interface PaymentHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  invoiceNumber: string;
  payments: Payment[];
  companyCountry?: string;
  onPaymentDeleted?: () => void;
}

const PaymentHistoryModal = ({ 
  open, 
  onOpenChange, 
  invoiceId, 
  invoiceNumber, 
  payments,
  companyCountry,
  onPaymentDeleted
}: PaymentHistoryModalProps) => {
  const { toast } = useToast();
  const { deletePartialPayment, loading } = usePaymentOperations();
  
  // Find the payment document for this invoice
  const invoicePayment = payments.find(payment => payment.invoiceId === invoiceId);
  const partialPayments = invoicePayment?.partialPayments || [];

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

  const handleDeletePartialPayment = async (paymentIndex: number) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;
    
    try {
      await deletePartialPayment(invoiceId, paymentIndex);
      
      toast({
        title: "Success",
        description: "Payment deleted successfully",
      });
      
      // Call callback to refresh data
      if (onPaymentDeleted) {
        onPaymentDeleted();
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast({
        title: "Error",
        description: "Failed to delete payment",
        variant: "destructive",
      });
    }
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
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {partialPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    No payments found for this invoice
                  </TableCell>
                </TableRow>
              ) : (
                partialPayments.map((partialPayment, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                        {(() => {
                          try {
                            // Handle both Firestore Timestamp and Date objects
                            if (partialPayment.paymentDate?.toDate) {
                              return partialPayment.paymentDate.toDate().toLocaleDateString();
                            } else if (partialPayment.paymentDate) {
                              return new Date(partialPayment.paymentDate as any).toLocaleDateString();
                            }
                            return 'Invalid Date';
                          } catch (error) {
                            console.error('Error parsing payment date:', error);
                            return 'Invalid Date';
                          }
                        })()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {getCompanyCurrencySymbol()}{partialPayment.originalPaymentAmount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(partialPayment.paymentMethod)}
                        <span className="capitalize">{partialPayment.paymentMethod.replace('_', ' ').toUpperCase()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePartialPayment(index)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-700"
                        title="Delete Payment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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

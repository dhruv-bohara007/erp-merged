
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Calendar, 
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  IndianRupee,
  History,
  Trash2
} from 'lucide-react';
import { Payment } from '@/types/firestore';
import { getOriginalPaymentAmount, getPaymentDate, getPaymentMethod } from '@/utils/paymentUtils';
import { useInvoices } from '@/hooks/useFirestore';
import { useCompanyData } from '@/hooks/useCompanyData';
import PaymentHistoryModal from './PaymentHistoryModal';
import { useToast } from '@/hooks/use-toast';

interface PaymentTableProps {
  payments: Payment[];
  onDeletePayment?: (paymentId: string) => void;
}

interface GroupedPayment {
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  totalAmountPaid: number;
  latestPaymentDate: Date;
  latestPaymentMethod: string;
  pendingAmountINR: number;
  status: string;
  paymentTiming: string;
  companyCountry?: string;
  paymentIds: string[];
}

const PaymentTable = ({ payments, onDeletePayment }: PaymentTableProps) => {
  const { invoices } = useInvoices();
  const { companyData } = useCompanyData();
  const { toast } = useToast();
  const [paymentHistoryModal, setPaymentHistoryModal] = useState({
    open: false,
    invoiceId: '',
    invoiceNumber: '',
    companyCountry: ''
  });

  // Get currency symbol based on company currency
  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'INR': '₹',
      'JPY': '¥',
      'CAD': 'C$',
      'AUD': 'A$',
      'CHF': 'CHF',
      'CNY': '¥',
      'SEK': 'kr',
      'NZD': 'NZ$'
    };
    return symbols[currency] || currency;
  };

  const formatCurrency = (amount: number) => {
    const currency = companyData?.companyCurrency || 'USD';
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${amount.toFixed(2)}`;
  };

  // Calculate payment timing relative to due date
  const getPaymentTiming = (paymentDate: Date, invoiceId: string, invoice?: any) => {
    if (!invoice || !invoice.dueDate) return '-';
    
    const diffTime = paymentDate.getTime() - invoice.dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'On due date';
    if (diffDays > 0) return `${diffDays} days after due date`;
    return `${Math.abs(diffDays)} days before due date`;
  };

  // Group payments by invoice and properly sum all payments
  const groupedPayments: GroupedPayment[] = payments.reduce((acc, payment) => {
    const existingGroup = acc.find(group => group.invoiceId === payment.invoiceId);
    
    if (existingGroup) {
      // Sum all originalPaymentAmount values for the invoice
      existingGroup.totalAmountPaid += getOriginalPaymentAmount(payment);
      existingGroup.paymentIds.push(payment.id);
      
      // Update latest payment info if this payment is more recent
      if (getPaymentDate(payment) > existingGroup.latestPaymentDate) {
        existingGroup.latestPaymentDate = getPaymentDate(payment);
        existingGroup.latestPaymentMethod = getPaymentMethod(payment);
        existingGroup.paymentTiming = getPaymentTiming(getPaymentDate(payment), payment.invoiceId, invoices.find(inv => inv.id === payment.invoiceId));
      }
      
      // Recalculate pending amount based on total amount paid
      const invoice = invoices.find(inv => inv.id === payment.invoiceId);
      const companyAmount = invoice?.companyAmount || invoice?.totalAmount || 0;
      const pendingAmount = Math.max(0, companyAmount - existingGroup.totalAmountPaid);
      existingGroup.pendingAmountINR = pendingAmount;
      
      // Update status based on total payments
      if (pendingAmount <= 0.01) { // Using small threshold for floating point precision
        existingGroup.status = 'completed';
      } else if (existingGroup.totalAmountPaid > 0) {
        const dueDate = invoice?.dueDate || new Date();
        const isOverdue = new Date() > dueDate;
        existingGroup.status = isOverdue ? 'overdue' : 'pending';
      } else {
        existingGroup.status = 'pending';
      }
    } else {
      // Create new group with the payment amount
      const invoice = invoices.find(inv => inv.id === payment.invoiceId);
      const companyAmount = invoice?.companyAmount || invoice?.totalAmount || 0;
      const paidAmount = getOriginalPaymentAmount(payment);
      const pendingAmount = Math.max(0, companyAmount - paidAmount);
      
      // Determine status based on pending amount and due date
      let status: string;
      if (pendingAmount <= 0.01) { // Using small threshold for floating point precision
        status = 'completed';
      } else if (paidAmount > 0) {
        // Check if overdue
        const dueDate = invoice?.dueDate || new Date();
        const isOverdue = new Date() > dueDate;
        status = isOverdue ? 'overdue' : 'pending';
      } else {
        status = 'pending';
      }
      
      acc.push({
        invoiceId: payment.invoiceId,
        invoiceNumber: payment.invoiceNumber,
        clientName: payment.clientName,
        totalAmountPaid: paidAmount,
        latestPaymentDate: getPaymentDate(payment),
        latestPaymentMethod: getPaymentMethod(payment),
        pendingAmountINR: pendingAmount,
        status: status,
        paymentTiming: getPaymentTiming(getPaymentDate(payment), payment.invoiceId, invoice),
        companyCountry: invoice?.companyCountry,
        paymentIds: [payment.id]
      });
    }
    
    return acc;
  }, [] as GroupedPayment[]);

  // Sort grouped payments by status for better organization
  const sortedGroupedPayments = [...groupedPayments].sort((a, b) => {
    // Define status priority: pending -> overdue -> completed
    const statusPriority = { pending: 1, overdue: 2, completed: 3 };
    const priorityA = statusPriority[a.status as keyof typeof statusPriority] || 4;
    const priorityB = statusPriority[b.status as keyof typeof statusPriority] || 4;
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // If same status, sort by latest payment date (most recent first)
    return b.latestPaymentDate.getTime() - a.latestPaymentDate.getTime();
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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

  const handleViewPaymentHistory = (invoiceId: string, invoiceNumber: string, companyCountry?: string) => {
    setPaymentHistoryModal({
      open: true,
      invoiceId,
      invoiceNumber,
      companyCountry: companyCountry || ''
    });
  };

  const handleDeletePayment = async (paymentIds: string[]) => {
    if (!confirm('Are you sure you want to delete this payment record?')) return;
    
    try {
      // Delete all payments in the group
      for (const paymentId of paymentIds) {
        if (onDeletePayment) {
          await onDeletePayment(paymentId);
        }
      }
      
      toast({
        title: "Success",
        description: "Payment record deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete payment record",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Amount Paid</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Pending Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedGroupedPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No payments found
                </TableCell>
              </TableRow>
            ) : (
              sortedGroupedPayments.map((group) => (
                <TableRow key={group.invoiceId}>
                  <TableCell>
                    <div className="font-medium">{group.invoiceNumber}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{group.clientName}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{formatCurrency(group.totalAmountPaid)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                      {group.latestPaymentDate.toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{formatCurrency(group.pendingAmountINR)}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(group.status)}>
                      {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {group.paymentTiming}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPaymentHistory(group.invoiceId, group.invoiceNumber, group.companyCountry)}
                      >
                        <History className="w-4 h-4 mr-1" />
                        History
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaymentHistoryModal
        open={paymentHistoryModal.open}
        onOpenChange={(open) => setPaymentHistoryModal(prev => ({ ...prev, open }))}
        invoiceId={paymentHistoryModal.invoiceId}
        invoiceNumber={paymentHistoryModal.invoiceNumber}
        payments={payments}
        companyCountry={paymentHistoryModal.companyCountry}
        onPaymentDeleted={() => window.location.reload()}
      />
    </>
  );
};

export default PaymentTable;

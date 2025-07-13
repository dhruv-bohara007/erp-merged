
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useInvoices } from '@/hooks/useFirestore';

interface PaymentTableProps {
  invoices: any[];
}

const PaymentTable = ({ invoices: filteredInvoices }: PaymentTableProps) => {
  const { invoices } = useInvoices();

  // Filter invoices that have payments (amountPaidInCompanyCurrency > 0)
  const invoicesWithPayments = (filteredInvoices || invoices).filter(invoice => 
    (invoice.amountPaidInCompanyCurrency || 0) > 0
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatUSD = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  if (invoicesWithPayments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No payment records found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Total Amount (USD)</TableHead>
            <TableHead>Amount Paid (USD)</TableHead>
            <TableHead>Pending (USD)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Payment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoicesWithPayments.map((invoice) => {
            const amountPaidInCompanyCurrency = invoice.amountPaidInCompanyCurrency || 0;
            const totalCompanyAmount = invoice.totalAmount || 0;
            const pendingAmount = Math.max(0, totalCompanyAmount - amountPaidInCompanyCurrency);
            const lastPaymentDate = invoice.conversionRate?.lastPaymentDate || invoice.updatedAt;

            return (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">
                  {invoice.invoiceNumber}
                </TableCell>
                <TableCell>{invoice.clientName}</TableCell>
                <TableCell>
                  {formatUSD(totalCompanyAmount)}
                </TableCell>
                <TableCell className="text-green-600 font-medium">
                  {formatUSD(amountPaidInCompanyCurrency)}
                </TableCell>
                <TableCell className="text-orange-600">
                  {formatUSD(pendingAmount)}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {formatDate(lastPaymentDate)}
                  {invoice.conversionRate?.lastPaymentMethod && (
                    <div className="text-xs text-muted-foreground">
                      via {invoice.conversionRate.lastPaymentMethod}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default PaymentTable;

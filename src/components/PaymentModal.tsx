
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePayments } from '@/hooks/useFirestore';
import { useInvoices } from '@/hooks/useFirestore';
import { usePaymentOperations } from '@/hooks/usePaymentOperations';
import { getPaymentAmount, getAmountPaidByClient, getOriginalPaymentAmount } from '@/utils/paymentUtils';
import { toast } from '@/hooks/use-toast';
import { exchangeRateService } from '@/services/exchangeRateService';
import { getCurrencyByCountry } from '@/data/countryCurrencyMapping';

const paymentSchema = z.object({
  invoiceId: z.string().min(1, 'Please select an invoice'),
  amount: z.string().min(1, 'Amount is required'),
  paymentMethod: z.string().min(1, 'Please select a payment method'),
  paymentDate: z.string().min(1, 'Payment date is required'),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PaymentModal = ({ open, onOpenChange }: PaymentModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [amountAlreadyPaidCompanyCurrency, setAmountAlreadyPaidCompanyCurrency] = useState(0);
  const { payments } = usePayments();
  const { invoices, updateInvoice } = useInvoices();
  const { addPartialPayment, loading: paymentLoading } = usePaymentOperations();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoiceId: '',
      amount: '',
      paymentMethod: '',
      paymentDate: new Date().toISOString().split('T')[0],
    },
  });

  // Watch invoiceId to update selected invoice
  const watchedInvoiceId = form.watch('invoiceId');

  // Update selected invoice when invoiceId changes
  useEffect(() => {
    if (watchedInvoiceId) {
      const invoice = invoices.find(inv => inv.id === watchedInvoiceId);
      setSelectedInvoice(invoice);
      
      // Calculate amount already paid for this invoice in company currency
      if (invoice) {
        const invoicePayments = payments.filter(p => p.invoiceId === invoice.id);
        const totalPaidCompanyCurrency = invoicePayments.reduce((sum, p) => sum + getOriginalPaymentAmount(p), 0);
        setAmountAlreadyPaidCompanyCurrency(totalPaidCompanyCurrency);
      }
    } else {
      setSelectedInvoice(null);
      setAmountAlreadyPaidCompanyCurrency(0);
    }
  }, [watchedInvoiceId, invoices, payments]);

  // Filter invoices to show only those with pending payments
  const invoicesWithPendingPayments = invoices.filter(invoice => {
    const invoicePayments = payments.filter(p => p.invoiceId === invoice.id);
    const totalPaidINR = invoicePayments.reduce((sum, p) => sum + getPaymentAmount(p), 0);
    const totalAmountINR = invoice.totalAmountINR || invoice.totalAmount || 0;
    return totalPaidINR < totalAmountINR;
  });

  const getCompanyCurrencySymbol = (invoice: any) => {
    if (!invoice) return '$';
    const currencyInfo = getCurrencyByCountry(invoice.companyCountry || 'US');
    return currencyInfo.symbol;
  };

  // Helper function to filter out undefined values from an object
  const filterUndefinedValues = (obj: any): any => {
    const filtered: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        filtered[key] = value;
      }
    }
    return filtered;
  };

  const onSubmit = async (data: PaymentFormData) => {
    try {
      setIsSubmitting(true);
      
      if (!selectedInvoice) {
        toast({
          title: "Error",
          description: "Selected invoice not found",
          variant: "destructive",
        });
        return;
      }

      console.log('Processing payment for invoice:', selectedInvoice);
      
      // Convert payment amount to INR - only called once on submit
      const paymentAmount = parseFloat(data.amount);
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid payment amount",
          variant: "destructive",
        });
        return;
      }

      // Get company currency from invoice
      const companyCurrency = getCurrencyByCountry(selectedInvoice.companyCountry || 'US').code;
      
      console.log('Converting payment amount from', companyCurrency, 'to INR:', paymentAmount);
      
      // Convert to INR - API call only happens here
      const { amountInINR: convertedAmountINR } = await exchangeRateService.convertToINR(
        paymentAmount, 
        companyCurrency
      );

      console.log('Converted amount in INR:', convertedAmountINR);

      // Convert payment amount to client currency
      const clientCurrency = getCurrencyByCountry(selectedInvoice.clientCountry || 'IN').code;
      let amountInClientCurrency = paymentAmount;
      
      if (companyCurrency !== clientCurrency) {
        console.log('Converting payment amount from', companyCurrency, 'to', clientCurrency, ':', paymentAmount);
        
        // First convert to INR, then to client currency
        const { convertedAmount } = await exchangeRateService.convertFromINR(convertedAmountINR, clientCurrency);
        amountInClientCurrency = convertedAmount;
        
        console.log('Converted amount in client currency:', amountInClientCurrency);
      }

      // Calculate pending amount in INR after this payment
      const existingPayments = payments.filter(p => p.invoiceId === selectedInvoice.id);
      const currentTotalPaidINR = existingPayments.reduce((sum, p) => sum + getPaymentAmount(p), 0);
      const totalAmountINR = selectedInvoice.totalAmountINR || selectedInvoice.totalAmount || 0;
      const pendingAmountINR = Math.max(0, totalAmountINR - currentTotalPaidINR - convertedAmountINR);

      // Prepare partial payment data
      const partialPaymentData = {
        paymentDate: data.paymentDate,
        originalPaymentAmount: paymentAmount,
        paymentMethod: data.paymentMethod as 'neft' | 'rtgs' | 'imps' | 'upi' | 'cash' | 'credit_card' | 'debit_card' | 'cheque',
        amountPaidByClient: amountInClientCurrency,
        amount: convertedAmountINR,
        conversionRate: {
          companyToINR: convertedAmountINR / paymentAmount,
          INRToClient: 1 / (convertedAmountINR / amountInClientCurrency)
        },
        pendingPaymentInINR: pendingAmountINR,
        clientCurrency: clientCurrency,
        companyCurrency: companyCurrency
      };

      console.log('Adding partial payment:', partialPaymentData);

      await addPartialPayment(
        data.invoiceId,
        selectedInvoice.invoiceNumber,
        selectedInvoice.clientId,
        selectedInvoice.clientName,
        partialPaymentData
      );

      // Update the invoice's amountPaidByClient field with total paid amount
      const totalPaidByClient = existingPayments.reduce((sum, p) => sum + getAmountPaidByClient(p), 0) + amountInClientCurrency;
      await updateInvoice(selectedInvoice.id, {
        amountPaidByClient: totalPaidByClient
      });

      console.log('Created new payment document and updated invoice amountPaidByClient:', totalPaidByClient);

      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Payment recording error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record payment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="invoiceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an invoice" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {invoicesWithPendingPayments.map((invoice) => {
                        const currencySymbol = getCompanyCurrencySymbol(invoice);
                        const displayAmount = invoice.companyAmount || invoice.totalAmount || 0;
                        return (
                          <SelectItem key={invoice.id} value={invoice.id}>
                            {invoice.invoiceNumber} - {invoice.clientName} - {currencySymbol}{displayAmount.toLocaleString()}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedInvoice && (
              <FormItem>
                <FormLabel>
                  Amount Already Paid ({getCompanyCurrencySymbol(selectedInvoice)})
                </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    value={`${getCompanyCurrencySymbol(selectedInvoice)}${amountAlreadyPaidCompanyCurrency.toLocaleString()}`}
                    readOnly
                    className="bg-gray-50"
                  />
                </FormControl>
              </FormItem>
            )}

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Amount ({selectedInvoice ? getCompanyCurrencySymbol(selectedInvoice) : '$'})
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Enter amount"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="neft">NEFT</SelectItem>
                      <SelectItem value="rtgs">RTGS</SelectItem>
                      <SelectItem value="imps">IMPS</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="debit_card">Debit Card</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || paymentLoading}>
                {isSubmitting || paymentLoading ? 'Recording...' : 'Record Payment'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;


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
import { useInvoices } from '@/hooks/useFirestore';
import { toast } from '@/hooks/use-toast';
import { exchangeRateService } from '@/services/exchangeRateService';
import { getCurrencyByCountry } from '@/data/countryCurrencyMapping';

const paymentSchema = z.object({
  invoiceId: z.string().min(1, 'Please select an invoice'),
  amountINR: z.string().min(1, 'Amount is required'),
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
  const { invoices, updateInvoice } = useInvoices();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoiceId: '',
      amountINR: '',
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
    } else {
      setSelectedInvoice(null);
    }
  }, [watchedInvoiceId, invoices]);

  // Filter invoices to show only those with pending payments
  const invoicesWithPendingPayments = invoices.filter(invoice => {
    const amountPaidByClient = invoice.amountPaidByClient || 0;
    const clientAmount = invoice.clientAmount || invoice.totalAmount || 0;
    return amountPaidByClient < clientAmount;
  });

  const getClientCurrencySymbol = (invoice: any) => {
    if (!invoice) return '₹';
    const currencyInfo = getCurrencyByCountry(invoice.clientCountry || 'IN');
    return currencyInfo.symbol;
  };

  const getClientCurrencyCode = (invoice: any) => {
    if (!invoice) return 'INR';
    const currencyInfo = getCurrencyByCountry(invoice.clientCountry || 'IN');
    return currencyInfo.code;
  };

  const getCompanyCurrencyCode = (invoice: any) => {
    if (!invoice) return 'USD';
    const currencyInfo = getCurrencyByCountry(invoice.companyCountry || 'US');
    return currencyInfo.code;
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

      console.log('Processing INR payment for invoice:', selectedInvoice);
      
      // Payment amount in INR (the amount entered by user)
      const paymentAmountINR = parseFloat(data.amountINR);
      if (isNaN(paymentAmountINR) || paymentAmountINR <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid payment amount in INR",
          variant: "destructive",
        });
        return;
      }

      // Get currencies from invoice
      const companyCurrency = getCurrencyByCountry(selectedInvoice.companyCountry || 'US').code;
      const clientCurrency = getCurrencyByCountry(selectedInvoice.clientCountry || 'IN').code;
      
      console.log('Converting payment:', {
        paymentAmountINR,
        companyCurrency,
        clientCurrency
      });

      // Fetch current exchange rates
      const rates = await exchangeRateService.getRates();
      
      // Calculate conversion rates (all rates are relative to INR as base from our service)
      const INRToCompany = rates[companyCurrency] ? rates[companyCurrency] : (companyCurrency === 'INR' ? 1 : 0.012); // Default USD rate
      const INRToClient = rates[clientCurrency] ? rates[clientCurrency] : (clientCurrency === 'INR' ? 1 : 1);
      const companyToClient = clientCurrency === companyCurrency ? 1 : (INRToClient / INRToCompany);

      // Convert amounts with full precision
      const amountInCompanyCurrency = paymentAmountINR * INRToCompany;
      const amountInClientCurrency = paymentAmountINR * INRToClient;

      console.log('Conversion results:', {
        INRToCompany,
        INRToClient,
        companyToClient,
        paymentAmountINR,
        amountInCompanyCurrency,
        amountInClientCurrency
      });

      // Update the invoice's amountPaidByClient field
      const currentAmountPaidByClient = selectedInvoice.amountPaidByClient || 0;
      const newAmountPaidByClient = currentAmountPaidByClient + amountInClientCurrency;
      
      // Calculate total amounts for status determination
      const totalClientAmount = selectedInvoice.clientAmount || selectedInvoice.totalAmount || 0;
      const pendingClientAmount = totalClientAmount - newAmountPaidByClient;

      // Determine new status
      let newStatus = selectedInvoice.status;
      if (newAmountPaidByClient >= totalClientAmount) {
        newStatus = 'paid';
      } else if (newAmountPaidByClient > 0) {
        const dueDate = selectedInvoice.dueDate || new Date();
        const isOverdue = new Date() > dueDate;
        newStatus = isOverdue ? 'overdue' : 'pending';
      }

      // Update conversion rate with latest payment information
      const updatedConversionRate = {
        INRToCompany: INRToCompany,
        companyToClient: companyToClient,
        INRToClient: INRToClient,
        timestamp: new Date(),
        lastPaymentDate: new Date(data.paymentDate),
        lastPaymentAmountINR: paymentAmountINR,
        lastPaymentMethod: data.paymentMethod
      };

      console.log('Updating invoice with:', {
        newAmountPaidByClient,
        newStatus,
        updatedConversionRate
      });

      // Update the invoice document
      await updateInvoice(selectedInvoice.id, {
        amountPaidByClient: newAmountPaidByClient,
        status: newStatus,
        conversionRate: updatedConversionRate,
        updatedAt: new Date()
      });

      console.log('Invoice updated successfully');

      toast({
        title: "Success",
        description: `Payment of ₹${paymentAmountINR.toFixed(2)} recorded successfully. Updated client amount: ${getClientCurrencySymbol(selectedInvoice)}${newAmountPaidByClient.toFixed(2)}`,
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
          <DialogTitle>Record Payment (INR)</DialogTitle>
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
                        const clientCurrencySymbol = getClientCurrencySymbol(invoice);
                        const displayAmount = invoice.clientAmount || invoice.totalAmount || 0;
                        return (
                          <SelectItem key={invoice.id} value={invoice.id}>
                            {invoice.invoiceNumber} - {invoice.clientName} - {clientCurrencySymbol}{displayAmount.toFixed(2)}
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
              <>
                <FormItem>
                  <FormLabel>
                    Amount Already Paid ({getClientCurrencySymbol(selectedInvoice)})
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      value={`${getClientCurrencySymbol(selectedInvoice)}${(selectedInvoice.amountPaidByClient || 0).toFixed(2)}`}
                      readOnly
                      className="bg-gray-50"
                    />
                  </FormControl>
                </FormItem>

                <FormItem>
                  <FormLabel>
                    Total Invoice Amount ({getClientCurrencySymbol(selectedInvoice)})
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      value={`${getClientCurrencySymbol(selectedInvoice)}${(selectedInvoice.clientAmount || selectedInvoice.totalAmount || 0).toFixed(2)}`}
                      readOnly
                      className="bg-gray-50"
                    />
                  </FormControl>
                </FormItem>

                <FormItem>
                  <FormLabel>
                    Pending Amount ({getClientCurrencySymbol(selectedInvoice)})
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      value={`${getClientCurrencySymbol(selectedInvoice)}${Math.max(0, (selectedInvoice.clientAmount || selectedInvoice.totalAmount || 0) - (selectedInvoice.amountPaidByClient || 0)).toFixed(2)}`}
                      readOnly
                      className="bg-gray-50"
                    />
                  </FormControl>
                </FormItem>
              </>
            )}

            <FormField
              control={form.control}
              name="amountINR"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount (INR)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter amount in INR"
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Recording...' : 'Record Payment'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;

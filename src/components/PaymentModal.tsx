
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
  amountUSD: z.string().min(1, 'Amount is required'),
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
      amountUSD: '',
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
    const amountPaidInCompanyCurrency = invoice.amountPaidInCompanyCurrency || 0;
    const totalAmount = invoice.totalAmount || 0;
    return amountPaidInCompanyCurrency < totalAmount;
  });

  const getCompanyCurrencySymbol = () => {
    return '$'; // Company currency is USD
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

      console.log('Processing USD payment for invoice:', selectedInvoice);
      
      // Payment amount in USD (company currency)
      const paymentAmountUSD = parseFloat(data.amountUSD);
      if (isNaN(paymentAmountUSD) || paymentAmountUSD <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid payment amount in USD",
          variant: "destructive",
        });
        return;
      }

      // Get currencies from invoice
      const companyCurrency = getCurrencyByCountry(selectedInvoice.companyCountry || 'US').code;
      const clientCurrency = getCurrencyByCountry(selectedInvoice.clientCountry || 'IN').code;
      
      console.log('Converting payment:', {
        paymentAmountUSD,
        companyCurrency,
        clientCurrency
      });

      // Fetch current exchange rates
      const rates = await exchangeRateService.getRates();
      
      // Calculate conversion rates (all rates are relative to INR as base from our service)
      const companyToINR = 1 / (rates[companyCurrency] || 0.012); // USD to INR
      const INRToClient = rates[clientCurrency] || 1; // INR to client currency
      const companyToClient = INRToClient / companyToINR; // USD to client currency

      // Convert amounts with full precision
      const amountInINR = paymentAmountUSD * companyToINR;
      const amountInClientCurrency = paymentAmountUSD * companyToClient;

      console.log('Conversion results:', {
        companyToINR,
        INRToClient,
        companyToClient,
        paymentAmountUSD,
        amountInINR,
        amountInClientCurrency
      });

      // Update the invoice's amountPaidInCompanyCurrency field
      const currentAmountPaidInCompanyCurrency = selectedInvoice.amountPaidInCompanyCurrency || 0;
      const newAmountPaidInCompanyCurrency = currentAmountPaidInCompanyCurrency + paymentAmountUSD;
      
      // Calculate total amounts for status determination
      const totalCompanyAmount = selectedInvoice.totalAmount || 0;
      const pendingCompanyAmount = totalCompanyAmount - newAmountPaidInCompanyCurrency;

      // Determine new status
      let newStatus = selectedInvoice.status;
      if (newAmountPaidInCompanyCurrency >= totalCompanyAmount) {
        newStatus = 'paid';
      } else if (newAmountPaidInCompanyCurrency > 0) {
        const dueDate = selectedInvoice.dueDate || new Date();
        const isOverdue = new Date() > dueDate;
        newStatus = isOverdue ? 'overdue' : 'pending';
      }

      // Update conversion rate with latest payment information
      const updatedConversionRate = {
        companyToINR: companyToINR,
        INRToClient: INRToClient,
        timestamp: new Date(),
        lastPaymentDate: new Date(data.paymentDate),
        lastPaymentAmountUSD: paymentAmountUSD,
        lastPaymentMethod: data.paymentMethod
      };

      console.log('Updating invoice with:', {
        newAmountPaidInCompanyCurrency,
        newStatus,
        updatedConversionRate
      });

      // Update the invoice document
      await updateInvoice(selectedInvoice.id, {
        amountPaidInCompanyCurrency: newAmountPaidInCompanyCurrency,
        status: newStatus,
        conversionRate: updatedConversionRate,
        updatedAt: new Date()
      });

      console.log('Invoice updated successfully');

      toast({
        title: "Success",
        description: `Payment of $${paymentAmountUSD.toFixed(2)} recorded successfully. Total paid: $${newAmountPaidInCompanyCurrency.toFixed(2)}`,
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
          <DialogTitle>Record Payment (USD)</DialogTitle>
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
                        const displayAmount = invoice.totalAmount || 0;
                        return (
                          <SelectItem key={invoice.id} value={invoice.id}>
                            {invoice.invoiceNumber} - {invoice.clientName} - ${displayAmount.toFixed(2)}
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
                    Amount Already Paid (USD)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      value={`$${(selectedInvoice.amountPaidInCompanyCurrency || 0).toFixed(2)}`}
                      readOnly
                      className="bg-gray-50"
                    />
                  </FormControl>
                </FormItem>

                <FormItem>
                  <FormLabel>
                    Total Invoice Amount (USD)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      value={`$${(selectedInvoice.totalAmount || 0).toFixed(2)}`}
                      readOnly
                      className="bg-gray-50"
                    />
                  </FormControl>
                </FormItem>

                <FormItem>
                  <FormLabel>
                    Pending Amount (USD)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      value={`$${Math.max(0, (selectedInvoice.totalAmount || 0) - (selectedInvoice.amountPaidInCompanyCurrency || 0)).toFixed(2)}`}
                      readOnly
                      className="bg-gray-50"
                    />
                  </FormControl>
                </FormItem>
              </>
            )}

            <FormField
              control={form.control}
              name="amountUSD"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount (USD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter amount in USD"
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
                      <SelectItem value="wire_transfer">Wire Transfer</SelectItem>
                      <SelectItem value="ach">ACH Transfer</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="debit_card">Debit Card</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
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

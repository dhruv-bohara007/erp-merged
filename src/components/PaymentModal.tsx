
import { useState } from 'react';
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
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { toast } from '@/components/ui/use-toast';
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
  const { addPayment } = usePayments();
  const { invoices } = useInvoices();
  const { convertToINR } = useCurrencyConverter();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoiceId: '',
      amount: '',
      paymentMethod: '',
      paymentDate: new Date().toISOString().split('T')[0],
    },
  });

  const selectedInvoiceId = form.watch('invoiceId');
  const selectedInvoice = invoices.find(inv => inv.id === selectedInvoiceId);
  const companyCurrency = selectedInvoice ? getCurrencyByCountry(selectedInvoice.companyCountry) : null;

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

      // Parse the entered amount
      const enteredAmount = parseFloat(data.amount);
      if (isNaN(enteredAmount) || enteredAmount <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid amount",
          variant: "destructive",
        });
        return;
      }

      // Convert the entered amount to INR
      const companyCurrencyCode = companyCurrency?.code || 'USD';
      const { amountInINR } = await convertToINR(enteredAmount, selectedInvoice.companyCountry);

      // Calculate pending amount in INR
      const pendingAmountINR = selectedInvoice.totalAmountINR - amountInINR;

      // Copy all invoice fields and add payment-specific data
      await addPayment({
        // Invoice fields
        invoiceId: selectedInvoice.id,
        invoiceNumber: selectedInvoice.invoiceNumber,
        clientId: selectedInvoice.clientId,
        clientName: selectedInvoice.clientName,
        clientEmail: selectedInvoice.clientEmail,
        clientState: selectedInvoice.clientState,
        clientPhone: selectedInvoice.clientPhone,
        clientPincode: selectedInvoice.clientPincode,
        clientAddress: selectedInvoice.clientAddress,
        clientCountry: selectedInvoice.clientCountry,
        clientCurrency: selectedInvoice.clientCurrency,
        clientAmount: selectedInvoice.clientAmount,
        clientTaxInfo: selectedInvoice.clientTaxInfo,
        companyId: selectedInvoice.companyId,
        companyName: selectedInvoice.companyName,
        companyCountry: selectedInvoice.companyCountry,
        companyCurrency: selectedInvoice.companyCurrency,
        companyAmount: selectedInvoice.companyAmount,
        companyAddress: selectedInvoice.companyAddress,
        companyEmail: selectedInvoice.companyEmail,
        companyWebsite: selectedInvoice.companyWebsite,
        companyPhone: selectedInvoice.companyPhone,
        companyCity: selectedInvoice.companyCity,
        companyTaxInfo: selectedInvoice.companyTaxInfo,
        companyBankDetails: selectedInvoice.companyBankDetails,
        companyLogoUrl: selectedInvoice.companyLogoUrl,
        businessOwnerName: selectedInvoice.businessOwnerName,
        businessOwnerPosition: selectedInvoice.businessOwnerPosition,
        ownerSignatureUrl: selectedInvoice.ownerSignatureUrl,
        logoUrl: selectedInvoice.logoUrl,
        signatureUrl: selectedInvoice.signatureUrl,
        bankInfo: selectedInvoice.bankInfo,
        items: selectedInvoice.items,
        subtotal: selectedInvoice.subtotal,
        cgst: selectedInvoice.cgst,
        sgst: selectedInvoice.sgst,
        igst: selectedInvoice.igst,
        totalGst: selectedInvoice.totalGst,
        totalAmount: selectedInvoice.totalAmount,
        totalAmountINR: selectedInvoice.totalAmountINR,
        conversionRate: selectedInvoice.conversionRate,
        issueDate: selectedInvoice.issueDate,
        dueDate: selectedInvoice.dueDate,
        terms: selectedInvoice.terms,
        notes: selectedInvoice.notes,
        status: selectedInvoice.status,
        // Payment-specific fields
        amount: amountInINR, // Store converted INR amount
        paymentAmount: enteredAmount, // Store original entered amount
        paymentCurrency: companyCurrencyCode, // Store payment currency
        pendingAmountINR: Math.max(0, pendingAmountINR), // Store pending amount in INR
        paymentMethod: data.paymentMethod,
        paymentDate: new Date(data.paymentDate),
      });

      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
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
                      {invoices.map((invoice) => {
                        const invoiceCurrency = getCurrencyByCountry(invoice.companyCountry);
                        return (
                          <SelectItem key={invoice.id} value={invoice.id}>
                            {invoice.invoiceNumber} - {invoice.clientName} - {invoiceCurrency.symbol}{(invoice.companyAmount || 0).toLocaleString()}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Amount ({companyCurrency?.symbol || '$'})
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

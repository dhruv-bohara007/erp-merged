
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
import { toast } from '@/components/ui/use-toast';
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
  const { addPayment } = usePayments();
  const { invoices } = useInvoices();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoiceId: '',
      amount: '',
      paymentMethod: '',
      paymentDate: new Date().toISOString().split('T')[0],
    },
  });

  // Update selected invoice when invoiceId changes
  useEffect(() => {
    const invoiceId = form.watch('invoiceId');
    if (invoiceId) {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      setSelectedInvoice(invoice);
    } else {
      setSelectedInvoice(null);
    }
  }, [form.watch('invoiceId'), invoices]);

  const getCompanyCurrencySymbol = (invoice: any) => {
    if (!invoice) return '$';
    const currencyInfo = getCurrencyByCountry(invoice.companyCountry || 'US');
    return currencyInfo.symbol;
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
      
      // Convert payment amount to INR
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
      
      // Convert to INR
      const { amountInINR: convertedAmountINR } = await exchangeRateService.convertToINR(
        paymentAmount, 
        companyCurrency
      );

      console.log('Converted amount in INR:', convertedAmountINR);

      // Calculate pending amount in INR
      const totalAmountINR = selectedInvoice.totalAmountINR || selectedInvoice.totalAmount || 0;
      const pendingAmountINR = totalAmountINR - convertedAmountINR;

      console.log('Total amount INR:', totalAmountINR, 'Pending amount INR:', pendingAmountINR);

      // Prepare payment data with all invoice fields copied
      const paymentData = {
        // Payment specific fields
        invoiceId: data.invoiceId,
        invoiceNumber: selectedInvoice.invoiceNumber,
        clientId: selectedInvoice.clientId,
        clientName: selectedInvoice.clientName,
        amount: convertedAmountINR, // Store converted INR amount
        paymentMethod: data.paymentMethod,
        paymentDate: new Date(data.paymentDate),
        status: 'completed' as const,
        
        // Copy all invoice fields
        clientEmail: selectedInvoice.clientEmail,
        clientState: selectedInvoice.clientState,
        clientPhone: selectedInvoice.clientPhone,
        clientPincode: selectedInvoice.clientPincode,
        items: selectedInvoice.items,
        subtotal: selectedInvoice.subtotal,
        cgst: selectedInvoice.cgst,
        sgst: selectedInvoice.sgst,
        igst: selectedInvoice.igst,
        totalGst: selectedInvoice.totalGst,
        totalAmount: selectedInvoice.totalAmount,
        totalAmountINR: selectedInvoice.totalAmountINR,
        companyCurrency: selectedInvoice.companyCurrency,
        companyAmount: selectedInvoice.companyAmount,
        clientCurrency: selectedInvoice.clientCurrency,
        clientAmount: selectedInvoice.clientAmount,
        conversionRate: selectedInvoice.conversionRate,
        companyCountry: selectedInvoice.companyCountry,
        clientCountry: selectedInvoice.clientCountry,
        companyName: selectedInvoice.companyName,
        companyLogoUrl: selectedInvoice.companyLogoUrl,
        companyEmail: selectedInvoice.companyEmail,
        companyWebsite: selectedInvoice.companyWebsite,
        companyPhone: selectedInvoice.companyPhone,
        companyCity: selectedInvoice.companyCity,
        companyTaxInfo: selectedInvoice.companyTaxInfo,
        companyBankDetails: selectedInvoice.companyBankDetails,
        companyAddress: selectedInvoice.companyAddress,
        ownerSignatureUrl: selectedInvoice.ownerSignatureUrl,
        businessOwnerName: selectedInvoice.businessOwnerName,
        businessOwnerPosition: selectedInvoice.businessOwnerPosition,
        clientAddress: selectedInvoice.clientAddress,
        clientTaxInfo: selectedInvoice.clientTaxInfo,
        bankInfo: selectedInvoice.bankInfo,
        logoUrl: selectedInvoice.logoUrl,
        signatureUrl: selectedInvoice.signatureUrl,
        issueDate: selectedInvoice.issueDate,
        dueDate: selectedInvoice.dueDate,
        notes: selectedInvoice.notes,
        terms: selectedInvoice.terms,
        
        // Add pending amount calculation
        pendingAmountINR: pendingAmountINR,
        
        // Payment specific amounts in original currency
        originalPaymentAmount: paymentAmount,
        originalCurrency: companyCurrency,
      };

      await addPayment(paymentData);

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
                      {invoices.map((invoice) => {
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

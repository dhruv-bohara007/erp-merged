
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
  const { addPayment, payments } = usePayments();
  const { invoices, updateInvoice } = useInvoices();

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
        const totalPaidCompanyCurrency = invoicePayments.reduce((sum, p) => sum + (p.companyAmount || p.originalPaymentAmount || 0), 0);
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
    const totalPaidINR = invoicePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
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

      console.log('Processing multi-currency payment for invoice:', selectedInvoice);
      
      // Payment amount in INR (the amount client is paying)
      const amountINR = parseFloat(data.amount);
      if (isNaN(amountINR) || amountINR <= 0) {
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
        amountINR,
        companyCurrency,
        clientCurrency
      });

      // Fetch current exchange rates and perform conversions
      const rates = await exchangeRateService.getRates();
      
      // Calculate conversion rates
      const INRToCompany = rates[companyCurrency] ? (1 / rates[companyCurrency]) : 1; // 1 INR = X Company Currency
      const companyToClient = rates[clientCurrency] && rates[companyCurrency] 
        ? (rates[clientCurrency] / rates[companyCurrency]) 
        : 1; // 1 Company Currency = Y Client Currency
      const INRToClient = rates[clientCurrency] ? rates[clientCurrency] : 1; // 1 INR = Z Client Currency

      // Convert amounts with full precision (no rounding during calculations)
      const companyAmount = amountINR * INRToCompany; // Amount in company currency (e.g., USD)
      const clientAmount = companyAmount * companyToClient; // Amount in client currency (e.g., GBP)

      console.log('Conversion results:', {
        INRToCompany,
        companyToClient,
        INRToClient,
        companyAmount,
        clientAmount
      });

      // Calculate pending amount in INR
      const totalAmountINR = selectedInvoice.totalAmountINR || selectedInvoice.totalAmount || 0;
      const invoicePayments = payments.filter(p => p.invoiceId === selectedInvoice.id);
      const totalAlreadyPaidINR = invoicePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const pendingAmountINR = totalAmountINR - (totalAlreadyPaidINR + amountINR);

      console.log('Payment calculation:', {
        totalAmountINR,
        totalAlreadyPaidINR,
        amountINR,
        pendingAmountINR
      });

      // Determine status based on pending amount
      const paymentStatus = pendingAmountINR <= 0 ? 'completed' : 'pending';

      // Prepare payment data with multi-currency fields
      const paymentData = filterUndefinedValues({
        // Payment specific fields
        invoiceId: data.invoiceId,
        invoiceNumber: selectedInvoice.invoiceNumber,
        clientId: selectedInvoice.clientId,
        clientName: selectedInvoice.clientName,
        amount: amountINR, // Store INR amount as primary amount
        
        // Multi-currency fields
        amountINR: amountINR,
        companyAmount: companyAmount,
        clientAmount: clientAmount,
        conversionRate: {
          INRToCompany: INRToCompany,
          companyToClient: companyToClient,
          INRToClient: INRToClient,
          timestamp: new Date()
        },
        
        paymentMethod: data.paymentMethod,
        paymentDate: new Date(data.paymentDate),
        status: paymentStatus,
        
        // Copy all invoice fields - only if they are defined
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
        pendingAmountINR: Math.max(0, pendingAmountINR),
        
        // Legacy fields for backward compatibility
        originalPaymentAmount: companyAmount,
        originalCurrency: companyCurrency,
        amountPaidByClient: clientAmount,
      });

      console.log('Final payment data:', paymentData);

      await addPayment(paymentData);

      // Update the invoice's amountPaidByClient field (add the new client amount)
      const currentAmountPaidByClient = selectedInvoice.amountPaidByClient || 0;
      const newAmountPaidByClient = currentAmountPaidByClient + clientAmount;
      
      await updateInvoice(selectedInvoice.id, {
        amountPaidByClient: newAmountPaidByClient
      });

      console.log('Updated invoice amountPaidByClient:', newAmountPaidByClient);

      toast({
        title: "Success",
        description: "Multi-currency payment recorded successfully",
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Multi-currency payment recording error:', error);
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
                        const currencySymbol = getCompanyCurrencySymbol(invoice);
                        const displayAmount = invoice.companyAmount || invoice.totalAmount || 0;
                        return (
                          <SelectItem key={invoice.id} value={invoice.id}>
                            {invoice.invoiceNumber} - {invoice.clientName} - {currencySymbol}{Math.round(displayAmount).toLocaleString()}
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
                    value={`${getCompanyCurrencySymbol(selectedInvoice)}${Math.round(amountAlreadyPaidCompanyCurrency).toLocaleString()}`}
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

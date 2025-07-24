import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Mail, Paperclip, Send } from 'lucide-react';
import { Invoice } from '@/hooks/useFirestore';
import { useToast } from '@/hooks/use-toast';

interface EmailInvoiceModalProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EmailInvoiceModal = ({ invoice, open, onOpenChange }: EmailInvoiceModalProps) => {
  const [emailData, setEmailData] = useState({
    to: '',
    cc: '',
    subject: '',
    message: ''
  });
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  // Initialize email data when invoice changes
  useEffect(() => {
    if (invoice) {
      setEmailData({
        to: invoice.clientEmail || '',
        cc: '',
        subject: `Invoice ${invoice.invoiceNumber} - ${invoice.companyName || 'Your Company'}`,
        message: `Dear ${invoice.clientName || 'Valued Customer'},

Please find attached your invoice ${invoice.invoiceNumber}.

Invoice Details:
- Invoice Number: ${invoice.invoiceNumber}
- Issue Date: ${invoice.issueDate?.toLocaleDateString() || 'N/A'}
- Due Date: ${invoice.dueDate?.toLocaleDateString() || 'N/A'}
- Total Amount: ${invoice.companyCurrency || 'USD'} ${invoice.companyAmount || invoice.totalAmount || 0}

Please make payment by the due date to avoid any late fees.

If you have any questions, please don't hesitate to contact us.

Best regards,
${invoice.companyName || 'Your Company'}`
      });
    }
  }, [invoice]);

  const handleSendEmail = async () => {
    if (!emailData.to) {
      toast({
        title: "Error",
        description: "Please enter a recipient email address",
        variant: "destructive",
      });
      return;
    }

    if (!emailData.subject) {
      toast({
        title: "Error", 
        description: "Please enter a subject line",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      // Here you would integrate with your email service
      // For now, we'll simulate the email sending
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Success",
        description: "Invoice email sent successfully",
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Send Invoice Email
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Invoice Details</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Invoice #: {invoice.invoiceNumber}</div>
              <div>Client: {invoice.clientName}</div>
              <div>Amount: {invoice.companyCurrency || 'USD'} {invoice.companyAmount || invoice.totalAmount || 0}</div>
              <div className="flex items-center gap-2">
                <Paperclip className="w-3 h-3" />
                PDF Invoice will be attached
              </div>
            </div>
          </div>

          <Separator />

          {/* Email Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="to">To *</Label>
                <Input
                  id="to"
                  type="email"
                  value={emailData.to}
                  onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
                  placeholder="client@example.com"
                />
              </div>
              <div>
                <Label htmlFor="cc">CC</Label>
                <Input
                  id="cc"
                  type="email"
                  value={emailData.cc}
                  onChange={(e) => setEmailData(prev => ({ ...prev, cc: e.target.value }))}
                  placeholder="manager@example.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={emailData.subject}
                onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Invoice subject"
              />
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={emailData.message}
                onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Email message"
                rows={8}
                className="resize-none"
              />
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={isSending}
              className="gap-2"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailInvoiceModal;
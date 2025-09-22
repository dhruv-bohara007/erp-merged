import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Upload, X, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailPurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: any;
}

const EmailPurchaseOrderModal = ({ isOpen, onClose, purchaseOrder }: EmailPurchaseOrderModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    to: purchaseOrder?.supplier?.email || '',
    cc: '',
    subject: `Purchase Order ${purchaseOrder?.purchaseNumber || purchaseOrder?.id}`,
    message: `Dear ${purchaseOrder?.supplier?.name || 'Supplier'},\n\nPlease find attached the purchase order for your review.\n\nBest regards,\n${purchaseOrder?.companyName || 'Company'}`
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF file",
          variant: "destructive"
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleSendEmail = async () => {
    if (!formData.to || !formData.subject) {
      toast({
        title: "Missing required fields",
        description: "Please fill in recipient email and subject",
        variant: "destructive"
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to attach",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('to', formData.to);
      formDataToSend.append('cc', formData.cc);
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('message', formData.message);
      formDataToSend.append('pdf', selectedFile);

      const response = await fetch('/api/send-purchase-order-email', {
        method: 'POST',
        body: formDataToSend
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Email sent successfully",
          description: "Purchase order has been sent to the supplier",
        });
        onClose();
      } else {
        throw new Error(result.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Failed to send email",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Purchase Order
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipient Email */}
          <div className="space-y-2">
            <Label htmlFor="to">To *</Label>
            <Input
              id="to"
              type="email"
              value={formData.to}
              onChange={(e) => handleInputChange('to', e.target.value)}
              placeholder="supplier@example.com"
              required
            />
          </div>

          {/* CC Email */}
          <div className="space-y-2">
            <Label htmlFor="cc">CC (optional)</Label>
            <Input
              id="cc"
              type="email"
              value={formData.cc}
              onChange={(e) => handleInputChange('cc', e.target.value)}
              placeholder="cc@example.com"
            />
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="Purchase Order Subject"
              required
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Enter your message here..."
              rows={4}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>PDF Attachment *</Label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
              >
                <Upload className="w-4 h-4" />
                Select PDF
              </label>
              
              {selectedFile && (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-md">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800">{selectedFile.name}</span>
                  <button
                    onClick={handleRemoveFile}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Only PDF files are allowed. Maximum size: 10MB
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSending}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={isSending}>
              {isSending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Send Email
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailPurchaseOrderModal;
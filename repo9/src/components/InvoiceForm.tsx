
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus } from 'lucide-react';
import { useInvoices, useClients, InvoiceItem } from '@/hooks/useFirestore';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const InvoiceForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addInvoice } = useInvoices();
  const { clients } = useClients();
  
  const [loading, setLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    clientId: '',
    notes: '',
    terms: 'Payment due within 30 days of invoice date.',
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, rate: 0, amount: 0 }
  ]);

  const [selectedClient, setSelectedClient] = useState<any>(null);

  // Find selected client details
  useEffect(() => {
    if (invoiceData.clientId) {
      const client = clients.find(c => c.id === invoiceData.clientId);
      setSelectedClient(client);
    } else {
      setSelectedClient(null);
    }
  }, [invoiceData.clientId, clients]);

  const addItem = () => {
    const newItem: InvoiceItem = {
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updatedItem.amount = updatedItem.quantity * updatedItem.rate;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  
  // GST calculation based on client's state
  const calculateGST = () => {
    if (!selectedClient || subtotal === 0) {
      return { cgst: 0, sgst: 0, igst: 0, totalGst: 0 };
    }

    // Assuming business is registered in Maharashtra for this example
    const businessState = 'Maharashtra';
    const isInterState = selectedClient.state !== businessState;
    
    if (isInterState) {
      // Inter-state: IGST only
      const igst = subtotal * 0.18; // 18% IGST
      return { cgst: 0, sgst: 0, igst, totalGst: igst };
    } else {
      // Intra-state: CGST + SGST
      const cgst = subtotal * 0.09; // 9% CGST
      const sgst = subtotal * 0.09; // 9% SGST
      return { cgst, sgst, igst: 0, totalGst: cgst + sgst };
    }
  };

  const gstCalculation = calculateGST();
  const totalAmount = subtotal + gstCalculation.totalGst;

  const handleSubmit = async (status: 'draft' | 'sent') => {
    if (!invoiceData.clientId) {
      toast({
        title: "Error",
        description: "Please select a client",
        variant: "destructive",
      });
      return;
    }

    if (!invoiceData.dueDate) {
      toast({
        title: "Error",
        description: "Please select a due date",
        variant: "destructive",
      });
      return;
    }

    if (items.some(item => !item.description || item.quantity <= 0 || item.rate <= 0)) {
      toast({
        title: "Error",
        description: "Please fill all item details correctly",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const invoice = {
        invoiceNumber: invoiceData.invoiceNumber,
        clientId: invoiceData.clientId,
        clientName: selectedClient?.name || '',
        clientEmail: selectedClient?.email || '',
        clientState: selectedClient?.state || '',
        items,
        subtotal,
        cgst: gstCalculation.cgst,
        sgst: gstCalculation.sgst,
        igst: gstCalculation.igst,
        totalGst: gstCalculation.totalGst,
        totalAmount,
        status,
        issueDate: new Date(invoiceData.issueDate),
        dueDate: new Date(invoiceData.dueDate),
        notes: invoiceData.notes,
        terms: invoiceData.terms,
      };

      await addInvoice(invoice);
      
      toast({
        title: "Success",
        description: `Invoice ${status === 'draft' ? 'saved as draft' : 'created'} successfully`,
      });

      navigate('/invoices');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create invoice",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Create New Invoice</h1>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => handleSubmit('draft')}
            disabled={loading}
          >
            Save as Draft
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => handleSubmit('sent')}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Invoice'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  value={invoiceData.invoiceNumber}
                  onChange={(e) => setInvoiceData({...invoiceData, invoiceNumber: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="issueDate">Issue Date</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={invoiceData.issueDate}
                  onChange={(e) => setInvoiceData({...invoiceData, issueDate: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={invoiceData.dueDate}
                onChange={(e) => setInvoiceData({...invoiceData, dueDate: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="client">Select Client *</Label>
              <Select onValueChange={(value) => setInvoiceData({...invoiceData, clientId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} - {client.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedClient && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">{selectedClient.name}</p>
                <p className="text-sm text-blue-700">{selectedClient.email}</p>
                <p className="text-sm text-blue-700">{selectedClient.address}, {selectedClient.city}</p>
                <p className="text-sm text-blue-700">{selectedClient.state} - {selectedClient.pincode}</p>
                {selectedClient.gstin && (
                  <p className="text-sm text-blue-700">GSTIN: {selectedClient.gstin}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* GST Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              
              {selectedClient && (
                <>
                  {gstCalculation.igst > 0 ? (
                    <div className="flex justify-between text-sm">
                      <span>IGST (18%) - Inter-state:</span>
                      <span>₹{gstCalculation.igst.toFixed(2)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>CGST (9%) - Intra-state:</span>
                        <span>₹{gstCalculation.cgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>SGST (9%) - Intra-state:</span>
                        <span>₹{gstCalculation.sgst.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-sm font-medium">
                    <span>Total GST:</span>
                    <span>₹{gstCalculation.totalGst.toFixed(2)}</span>
                  </div>
                </>
              )}
              
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total Amount:</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
            
            {selectedClient && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-900">GST Calculation</p>
                <p className="text-xs text-green-700">
                  {gstCalculation.igst > 0 
                    ? `Inter-state transaction with ${selectedClient.state}. IGST applicable.`
                    : `Intra-state transaction. CGST + SGST applicable.`
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoice Items */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Invoice Items</CardTitle>
            <Button onClick={addItem} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-center p-4 bg-gray-50 rounded-lg">
                <div className="col-span-5">
                  <Label htmlFor={`desc-${index}`}>Description *</Label>
                  <Input
                    id={`desc-${index}`}
                    placeholder="Item description"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor={`qty-${index}`}>Quantity *</Label>
                  <Input
                    id={`qty-${index}`}
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor={`rate-${index}`}>Rate (₹) *</Label>
                  <Input
                    id={`rate-${index}`}
                    type="text"
                    placeholder="0.00"
                    value={item.rate === 0 ? '' : item.rate.toString()}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty string or valid numbers
                      if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
                        updateItem(index, 'rate', value === '' ? 0 : Number(value));
                      }
                    }}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Amount</Label>
                  <div className="p-2 bg-gray-100 rounded border text-right">
                    ₹{item.amount.toFixed(2)}
                  </div>
                </div>
                <div className="col-span-1 flex justify-center">
                  {items.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notes & Terms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Additional notes for the client..."
              value={invoiceData.notes}
              onChange={(e) => setInvoiceData({...invoiceData, notes: e.target.value})}
              rows={4}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Payment terms and conditions..."
              value={invoiceData.terms}
              onChange={(e) => setInvoiceData({...invoiceData, terms: e.target.value})}
              rows={4}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvoiceForm;

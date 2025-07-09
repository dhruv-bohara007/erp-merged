import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Loader2, Package, Edit3 } from 'lucide-react';
import { useInvoices, useClients, InvoiceItem } from '@/hooks/useFirestore';
import { useCompanyData } from '@/hooks/useCompanyData';
import { useTaxCalculations } from '@/hooks/useTaxCalculations';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useInventory } from '@/hooks/useFirestore';
import SearchableDropdown from './SearchableDropdown';

interface InvoiceFormItem {
  productCategory: string;
  itemName: string;
  productVersion: string;
  quantity: number;
  rate: number;
  productRate?: number; // Rate from inventory
  discount: string; // Changed to string for text input
  amount: number;
  sourceType: 'available' | 'manual';
}

const InvoiceForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addInvoice } = useInvoices();
  const { clients } = useClients();
  const { inventory } = useInventory();
  const { companyData } = useCompanyData();
  const { calculateTaxes, getTaxDisplayName } = useTaxCalculations();
  const { convertToINR, convertFromINR, formatCurrency, getCurrencyInfo, loading: currencyLoading } = useCurrencyConverter();
  
  const [loading, setLoading] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [productSource, setProductSource] = useState<'available' | 'manual'>('available');
  const [currencyAmounts, setCurrencyAmounts] = useState({
    companyAmount: 0,
    totalAmountINR: 0,
    clientAmount: 0,
    companyToINRRate: 1,
    INRToClientRate: 1
  });

  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    clientId: '',
    notes: '',
    terms: 'Payment due within 30 days of invoice date.',
  });

  const [items, setItems] = useState<InvoiceFormItem[]>([
    { 
      productCategory: '', 
      itemName: '', 
      productVersion: '', 
      quantity: 1, 
      rate: 0,
      productRate: 0,
      discount: '0', 
      amount: 0,
      sourceType: 'available'
    }
  ]);

  const [selectedClient, setSelectedClient] = useState<any>(null);

  // Get active inventory items
  const activeInventory = inventory.filter(item => item.status === 'active');
  
  // Get unique categories, names, and versions from active inventory
  const availableCategories = [...new Set(activeInventory.map(item => item.productCategory))].filter(Boolean);
  const availableNames = [...new Set(activeInventory.map(item => item.itemName))].filter(Boolean);
  const availableVersions = [...new Set(activeInventory.map(item => item.productVersion))].filter(Boolean);

  // Calculate totals first
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const companyCountry = companyData?.country || 'US';
  const clientCountry = selectedClient?.country || 'US';
  const taxCalculation = calculateTaxes(subtotal, companyCountry, clientCountry);

  // Find selected client details
  useEffect(() => {
    if (invoiceData.clientId) {
      const client = clients.find(c => c.id === invoiceData.clientId);
      setSelectedClient(client);
    } else {
      setSelectedClient(null);
    }
  }, [invoiceData.clientId, clients]);

  // Improved currency conversion effect with better error handling
  useEffect(() => {
    if (!selectedClient || subtotal === 0) {
      // Reset to default values when no client or no items
      setCurrencyAmounts({
        companyAmount: taxCalculation.totalAmount,
        totalAmountINR: taxCalculation.totalAmount,
        clientAmount: taxCalculation.totalAmount,
        companyToINRRate: 1,
        INRToClientRate: 1
      });
      setConversionError(null);
      return;
    }

    const convertAmounts = async () => {
      const companyTotal = taxCalculation.totalAmount;
      setConversionError(null);

      try {
        console.log('Starting currency conversion for:', companyTotal, companyCountry, 'to', clientCountry);
        
        // If company currency is already INR, no need for conversion
        if (companyCountry === 'IN') {
          const { convertedAmount: clientTotal, rate: INRToClientRate } = await convertFromINR(companyTotal, clientCountry);
          
          setCurrencyAmounts({
            companyAmount: companyTotal,
            totalAmountINR: companyTotal,
            clientAmount: clientTotal,
            companyToINRRate: 1,
            INRToClientRate
          });
        } else {
          // Convert company currency to INR first
          const { amountInINR, rate: companyToINRRate } = await convertToINR(companyTotal, companyCountry);
          
          // Then convert INR to client currency if needed
          if (clientCountry === 'IN') {
            setCurrencyAmounts({
              companyAmount: companyTotal,
              totalAmountINR: amountInINR,
              clientAmount: amountInINR,
              companyToINRRate,
              INRToClientRate: 1
            });
          } else {
            const { convertedAmount: clientTotal, rate: INRToClientRate } = await convertFromINR(amountInINR, clientCountry);
            
            setCurrencyAmounts({
              companyAmount: companyTotal,
              totalAmountINR: amountInINR,
              clientAmount: clientTotal,
              companyToINRRate,
              INRToClientRate
            });
          }
        }
        
        console.log('Currency conversion completed successfully');
      } catch (error) {
        console.error('Currency conversion failed:', error);
        setConversionError('Currency conversion failed. Using fallback rates.');
        
        // Use fallback conversion or 1:1 rates
        setCurrencyAmounts({
          companyAmount: companyTotal,
          totalAmountINR: companyTotal,
          clientAmount: companyTotal,
          companyToINRRate: 1,
          INRToClientRate: 1
        });
      }
    };

    // Debounce the conversion to prevent too many API calls
    const timeoutId = setTimeout(convertAmounts, 300);
    return () => clearTimeout(timeoutId);
  }, [subtotal, selectedClient, companyData?.country, taxCalculation.totalAmount]);

  const addItem = () => {
    const newItem: InvoiceFormItem = {
      productCategory: '',
      itemName: '',
      productVersion: '',
      quantity: 1,
      rate: 0,
      productRate: 0,
      discount: '0',
      amount: 0,
      sourceType: productSource
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof InvoiceFormItem, value: string | number) => {
    setItems(items.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };
        
        // Auto-fill rate when category, name, and version are selected for available products
        if (updatedItem.sourceType === 'available' && 
            (field === 'productCategory' || field === 'itemName' || field === 'productVersion')) {
          if (updatedItem.productCategory && updatedItem.itemName && updatedItem.productVersion) {
            const companyCurrency = companyData?.companyCurrency || 'INR';
            const inventoryItem = activeInventory.find(inv => 
              inv.productCategory === updatedItem.productCategory &&
              inv.itemName === updatedItem.itemName &&
              inv.productVersion === updatedItem.productVersion &&
              inv.companyCurrency === companyCurrency
            );
            if (inventoryItem) {
              updatedItem.rate = inventoryItem.rate || 0;
              updatedItem.productRate = inventoryItem.rate || 0;
            }
          }
        }
        
        // Recalculate amount when quantity, rate, or discount changes
        if (field === 'quantity' || field === 'rate' || field === 'discount') {
          const subtotalAmount = updatedItem.quantity * updatedItem.rate;
          const discountPercent = parseFloat(updatedItem.discount.toString()) || 0;
          const discountAmount = (subtotalAmount * discountPercent) / 100;
          updatedItem.amount = subtotalAmount - discountAmount;
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  // Currency info
  const companyCurrency = getCurrencyInfo(companyCountry);
  const clientCurrency = getCurrencyInfo(clientCountry);

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

    if (items.some(item => !item.itemName || item.quantity <= 0 || item.rate <= 0)) {
      toast({
        title: "Error",
        description: "Please fill all item details correctly",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Convert InvoiceFormItem[] to InvoiceItem[] expected by firestore
      const firestoreItems: InvoiceItem[] = items.map(item => ({
        description: `${item.productCategory} - ${item.itemName} (${item.productVersion})`,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount
      }));

      const invoice = {
        invoiceNumber: invoiceData.invoiceNumber,
        clientId: invoiceData.clientId,
        items: firestoreItems,
        // Store additional product fields
        productDetails: items.map(item => ({
          productCategory: item.productCategory,
          itemName: item.itemName,
          productVersion: item.productVersion,
          quantity: item.quantity,
          rate: item.rate,
          productRate: item.productRate || item.rate,
          discount: item.discount,
          amount: item.amount,
          sourceType: item.sourceType
        })),
        subtotal,
        cgst: taxCalculation.taxes.find(t => t.name === 'CGST')?.amount || 0,
        sgst: taxCalculation.taxes.find(t => t.name === 'SGST')?.amount || 0,
        igst: taxCalculation.taxes.find(t => t.name === 'IGST')?.amount || 0,
        totalGst: taxCalculation.totalTaxAmount,
        totalAmount: currencyAmounts.companyAmount,
        // Currency fields
        totalAmountINR: currencyAmounts.totalAmountINR,
        companyCurrency: companyCurrency.code,
        companyAmount: currencyAmounts.companyAmount,
        clientCurrency: clientCurrency.code,
        clientAmount: currencyAmounts.clientAmount,
        conversionRate: {
          companyToINR: currencyAmounts.companyToINRRate,
          INRToClient: currencyAmounts.INRToClientRate,
          timestamp: new Date()
        },
        status,
        issueDate: new Date(invoiceData.issueDate),
        dueDate: new Date(invoiceData.dueDate),
        notes: invoiceData.notes,
        terms: invoiceData.terms,
      };

      console.log('Creating invoice with automatic field population from clients and companies collections...');
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
                      {client.name} - {client.country}
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
                <p className="text-sm text-blue-700">{selectedClient.country}</p>
                {selectedClient.gstin && (
                  <p className="text-sm text-blue-700">Tax ID: {selectedClient.gstin}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Invoice Summary with Multi-Currency Display */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal, companyCountry)}</span>
              </div>
              
              {selectedClient && taxCalculation.taxes.length > 0 && (
                <>
                  {taxCalculation.taxes.map((tax, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{tax.name} ({tax.rate}%):</span>
                      <span>{formatCurrency(tax.amount, companyCountry)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-medium">
                    <span>Total {getTaxDisplayName(companyCountry, clientCountry)}:</span>
                    <span>{formatCurrency(taxCalculation.totalTaxAmount, companyCountry)}</span>
                  </div>
                </>
              )}
              
              <Separator />
              
              {/* Multi-Currency Display */}
              <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between font-bold text-lg">
                  <span>Company Currency ({companyCurrency.code}):</span>
                  <span>{formatCurrency(currencyAmounts.companyAmount, companyCountry)}</span>
                </div>
                
                <div className="flex justify-between text-sm text-blue-700">
                  <span>Converted to INR:</span>
                  <span>
                    {currencyLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin inline" />
                    ) : (
                      `₹${currencyAmounts.totalAmountINR.toFixed(2)}`
                    )}
                  </span>
                </div>

                {selectedClient && companyCountry !== clientCountry && (
                  <div className="flex justify-between text-sm text-green-700">
                    <span>Client Currency ({clientCurrency.code}):</span>
                    <span>
                      {currencyLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin inline" />
                      ) : (
                        `${clientCurrency.symbol}${currencyAmounts.clientAmount.toFixed(2)}`
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Exchange Rate Info */}
              {selectedClient && currencyAmounts.companyToINRRate !== 1 && (
                <div className="text-xs text-gray-500 mt-2">
                  <p>Exchange rates: 1 {companyCurrency.code} = ₹{currencyAmounts.companyToINRRate.toFixed(4)}</p>
                  {companyCountry !== clientCountry && (
                    <p>1 INR = {currencyAmounts.INRToClientRate.toFixed(4)} {clientCurrency.code}</p>
                  )}
                </div>
              )}

              {/* Show conversion error if any */}
              {conversionError && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  {conversionError}
                </div>
              )}
            </div>
            
            {selectedClient && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Tax Information</p>
                <p className="text-xs text-blue-700">
                  {companyCountry === 'IN' && clientCountry === 'IN' 
                    ? 'Intra-state transaction: CGST + SGST applicable'
                    : companyCountry === 'IN' && clientCountry !== 'IN'
                    ? 'Inter-state/International transaction: IGST applicable'
                    : `${getTaxDisplayName(companyCountry, clientCountry)} based on company location (${companyCountry})`
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Invoice Items */}
      <Card className="border-2 border-blue-100">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Package className="w-6 h-6 text-blue-600" />
              <CardTitle className="text-xl text-blue-900">Invoice Items</CardTitle>
            </div>
            <Button onClick={addItem} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
          
          {/* Product Source Toggle */}
          <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
            <Label className="text-sm font-medium text-blue-900 mb-2 block">Select Product Source</Label>
            <Select value={productSource} onValueChange={(value: 'available' | 'manual') => setProductSource(value)}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  From Available Products
                </SelectItem>
                <SelectItem value="manual" className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  Manual Entry
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="space-y-6">
            {items.map((item, index) => (
              <div key={index} className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="grid grid-cols-12 gap-4 items-end">
                  
                  {/* Product Category */}
                  <div className="col-span-2">
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Category *
                    </Label>
                    {item.sourceType === 'available' ? (
                      <SearchableDropdown
                        items={availableCategories}
                        value={item.productCategory}
                        onValueChange={(value) => updateItem(index, 'productCategory', value)}
                        placeholder="Select category"
                      />
                    ) : (
                      <Input
                        placeholder="Enter category"
                        value={item.productCategory}
                        onChange={(e) => updateItem(index, 'productCategory', e.target.value)}
                        className="border-blue-200 focus:border-blue-400"
                      />
                    )}
                  </div>

                  {/* Product Name */}
                  <div className="col-span-2">
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Name *
                    </Label>
                    {item.sourceType === 'available' ? (
                      <SearchableDropdown
                        items={availableNames}
                        value={item.itemName}
                        onValueChange={(value) => updateItem(index, 'itemName', value)}
                        placeholder="Select name"
                      />
                    ) : (
                      <Input
                        placeholder="Enter name"
                        value={item.itemName}
                        onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                        className="border-blue-200 focus:border-blue-400"
                      />
                    )}
                  </div>

                  {/* Product Version */}
                  <div className="col-span-2">
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Version *
                    </Label>
                    {item.sourceType === 'available' ? (
                      <SearchableDropdown
                        items={availableVersions}
                        value={item.productVersion}
                        onValueChange={(value) => updateItem(index, 'productVersion', value)}
                        placeholder="Select version"
                      />
                    ) : (
                      <Input
                        placeholder="Enter version"
                        value={item.productVersion}
                        onChange={(e) => updateItem(index, 'productVersion', e.target.value)}
                        className="border-blue-200 focus:border-blue-400"
                      />
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="col-span-1">
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Qty *
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                      className="border-blue-200 focus:border-blue-400"
                    />
                  </div>

                  {/* Rate */}
                  <div className="col-span-1">
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Rate ({companyCurrency.symbol}) *
                    </Label>
                    {item.sourceType === 'available' ? (
                      <div className="p-2 bg-blue-100 rounded border text-center text-sm font-medium">
                        {item.rate === 0 ? 'Auto' : item.rate.toFixed(2)}
                      </div>
                    ) : (
                      <Input
                        type="text"
                        placeholder="0.00"
                        value={item.rate === 0 ? '' : item.rate.toString()}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
                            updateItem(index, 'rate', value === '' ? 0 : Number(value));
                          }
                        }}
                        className="border-blue-200 focus:border-blue-400"
                      />
                    )}
                  </div>

                  {/* Discount */}
                  <div className="col-span-1">
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Discount (%)
                    </Label>
                    <Input
                      type="text"
                      placeholder="0"
                      value={item.discount}
                      onChange={(e) => updateItem(index, 'discount', e.target.value)}
                      className="border-blue-200 focus:border-blue-400"
                    />
                  </div>

                  {/* Amount */}
                  <div className="col-span-2">
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Amount
                    </Label>
                    <div className="p-3 bg-green-50 rounded border border-green-200 text-right font-bold text-green-800">
                      {formatCurrency(item.amount, companyCountry)}
                    </div>
                  </div>

                  {/* Remove Button */}
                  <div className="col-span-1 flex justify-center">
                    {items.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Source Type Indicator */}
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  {item.sourceType === 'available' ? (
                    <>
                      <Package className="w-3 h-3" />
                      From Available Products
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-3 h-3" />
                      Manual Entry
                    </>
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

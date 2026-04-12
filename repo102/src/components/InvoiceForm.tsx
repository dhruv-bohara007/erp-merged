
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { useInvoices, useClients, InvoiceItem } from '@/hooks/useFirestore';
import { useCompanyData } from '@/hooks/useCompanyData';
import { useTaxCalculations } from '@/hooks/useTaxCalculations';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useInventory } from '@/hooks/useFirestore';
import { useProductDefinitions } from '@/hooks/useProductDefinitions';
import { useStockDetails } from '@/hooks/useStockDetails';
import { InvoiceStockService } from '@/services/invoiceStockService';
import SearchableDropdown from './SearchableDropdown';

interface InvoiceFormItem {
  productCategory: string;
  itemName: string;
  productVersion: string;
  quantity: number;
  unit?: string;
  rate: number;
  discount: string;
  amount: number;
  productRate?: number;
  sourceType: 'manual' | 'stock' | 'inventory';
}

const InvoiceForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const { addInvoice } = useInvoices();
  const { clients } = useClients();
  const { inventory } = useInventory();
  const { productDefinitions, addProductDefinition } = useProductDefinitions();
  const { stockDetails } = useStockDetails();
  const { companyData } = useCompanyData();
  const { calculateTaxes, getTaxDisplayName } = useTaxCalculations();
  const { convertToINR, convertFromINR, formatCurrency, getCurrencyInfo, loading: currencyLoading } = useCurrencyConverter();
  
  const [loading, setLoading] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);
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
    notes: 'Prices exclude applicable local taxes, currency conversion charges, international bank transfer fees, import duties, and any additional processing or compliance fees. The client is responsible for covering all applicable charges beyond the invoiced amount.',
    terms: 'Payment due within 30 days of invoice date.',
  });

  
  const [items, setItems] = useState<InvoiceFormItem[]>([
    { 
      productCategory: '', 
      itemName: '', 
      productVersion: '', 
      quantity: 1, 
      unit: '',
      rate: 0, 
      discount: '0', 
      amount: 0,
      sourceType: 'manual'
    }
  ]);

  const [selectedClient, setSelectedClient] = useState<any>(null);

  // Get active inventory items
  const activeInventory = inventory.filter(item => item.status === 'active');
  
  // Get data based on source type
  const getDataSource = (sourceType: 'manual' | 'stock' | 'inventory') => {
    switch (sourceType) {
      case 'stock':
        return {
          categories: [...new Set(stockDetails.map(p => p.productCategory))],
          getNames: (category: string) => [...new Set(stockDetails.filter(p => p.productCategory === category).map(p => p.itemName))],
          getVersions: (category: string, name: string) => [...new Set(stockDetails.filter(p => p.productCategory === category && p.itemName === name).map(p => p.productVersion))],
          getUnits: (category: string, name: string, version: string) => {
            const item = stockDetails.find(p => p.productCategory === category && p.itemName === name && p.productVersion === version);
            return item ? [item.unit] : [];
          }
        };
      case 'inventory':
        return {
          categories: [...new Set(activeInventory.map(p => p.productCategory))],
          getNames: (category: string) => [...new Set(activeInventory.filter(p => p.productCategory === category).map(p => p.itemName))],
          getVersions: (category: string, name: string) => [...new Set(activeInventory.filter(p => p.productCategory === category && p.itemName === name).map(p => p.productVersion))],
          getUnits: () => []
        };
      default: // manual
        return {
          categories: [...new Set(productDefinitions.map(p => p.productCategory))],
          getNames: (category: string) => [...new Set(productDefinitions.filter(p => p.productCategory === category).map(p => p.itemName))],
          getVersions: (category: string, name: string) => [...new Set(productDefinitions.filter(p => p.productCategory === category && p.itemName === name).map(p => p.productVersion))],
          getUnits: () => []
        };
    }
  };

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
      unit: '',
      rate: 0,
      discount: '0',
      amount: 0,
      sourceType: 'manual'
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
        
        // Auto-fill rate and unit based on source type
        if ((field === 'productCategory' || field === 'itemName' || field === 'productVersion') && 
            updatedItem.productCategory && updatedItem.itemName && updatedItem.productVersion) {
          
          if (updatedItem.sourceType === 'stock') {
            const stockItem = stockDetails.find(stock => 
              stock.productCategory === updatedItem.productCategory &&
              stock.itemName === updatedItem.itemName &&
              stock.productVersion === updatedItem.productVersion
            );
            if (stockItem) {
              updatedItem.rate = stockItem.pricePerUnit || 0;
              updatedItem.productRate = stockItem.pricePerUnit || 0;
              updatedItem.unit = stockItem.unit;
            }
          } else if (updatedItem.sourceType === 'inventory') {
            const inventoryItem = activeInventory.find(inv => 
              inv.productCategory === updatedItem.productCategory &&
              inv.itemName === updatedItem.itemName &&
              inv.productVersion === updatedItem.productVersion &&
              inv.status === 'active'
            );
            if (inventoryItem) {
              updatedItem.rate = inventoryItem.unitPrice || 0;
              updatedItem.productRate = inventoryItem.unitPrice || 0;
              // For inventory items, don't show quantity and unit fields
            }
          }
        }
        
        // Recalculate amount when quantity, rate, or discount changes
        if (field === 'quantity' || field === 'rate' || field === 'discount') {
          const quantity = updatedItem.sourceType === 'inventory' ? 1 : updatedItem.quantity;
          const subtotalAmount = quantity * updatedItem.rate;
          const discountPercent = typeof updatedItem.discount === 'string' ? parseFloat(updatedItem.discount) || 0 : updatedItem.discount;
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
      // Convert InvoiceFormItem[] to extended InvoiceItem[] with product details first
      const firestoreItems: InvoiceItem[] = items.map(item => ({
        description: `${item.productCategory} - ${item.itemName} (${item.productVersion})${item.unit ? ` [${item.unit}]` : ''}`,
        quantity: item.sourceType === 'inventory' ? 1 : item.quantity,
        rate: item.rate,
        amount: item.amount,
        // Store all product fields as required
        productCategory: item.productCategory,
        itemName: item.itemName,
        productVersion: item.productVersion,
        discount: item.discount,
        productRate: item.productRate || item.rate,
        sourceType: item.sourceType,
        unit: item.unit
      }));

      // Validate stock availability for stock items before proceeding
      if (!currentUser?.companyId) {
        throw new Error('Company ID not found');
      }

      const stockValidation = await InvoiceStockService.validateStockAvailability(
        currentUser.companyId,
        firestoreItems
      );

      if (!stockValidation.isValid) {
        const insufficientItems = stockValidation.insufficientStockItems
          .map(item => `${item.itemName} (${item.productCategory}): Required ${item.requiredQuantity} ${item.unit}, Available ${item.availableStock} ${item.unit}`)
          .join('\n');
        
        toast({
          title: "Invoice cannot be created for items with depleted stock.",
          description: `Insufficient stock for:\n${insufficientItems}`,
          variant: "destructive",
        });
        return;
      }

      // Ensure product definitions exist for manual entries
      for (const item of items) {
        if (item.sourceType === 'manual' && item.productCategory && item.itemName && item.productVersion) {
          await addProductDefinition({
            productCategory: item.productCategory,
            itemName: item.itemName,
            productVersion: item.productVersion
          });
        }
      }

      const invoice = {
        invoiceNumber: invoiceData.invoiceNumber,
        clientId: invoiceData.clientId,
        items: firestoreItems,
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
        amountPaidByClient: 0, // Initialize with default value
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
      
      // Update stock for stock items after successful invoice creation
      await InvoiceStockService.updateStockOnInvoiceCreation(
        currentUser.companyId,
        firestoreItems
      );
      
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

      {/* Invoice Items */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-semibold text-primary">Invoice Items</CardTitle>
            <Button onClick={addItem} size="sm" className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
          
          {/* Information Text */}
          <div className="mt-4 p-4 bg-background rounded-lg border">
            <p className="text-sm text-muted-foreground">
              Each item can have its own entry type. You can mix manual entries, stock items, and stockless products in a single invoice.
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {items.map((item, index) => (
              <div key={index} className="relative bg-gradient-to-br from-card to-card/80 border border-border/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
                {/* Item Header with Individual Entry Type */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-muted-foreground">
                      Item #{index + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Entry Type:</Label>
                      <Select 
                        value={item.sourceType} 
                        onValueChange={(value: 'manual' | 'stock' | 'inventory') => {
                          // Batch all updates together to prevent state update issues
                          setItems(currentItems => 
                            currentItems.map((currentItem, currentIndex) => {
                              if (currentIndex === index) {
                                return {
                                  ...currentItem,
                                  sourceType: value,
                                  productCategory: '',
                                  itemName: '',
                                  productVersion: '',
                                  rate: 0,
                                  unit: '',
                                  amount: 0
                                };
                              }
                              return currentItem;
                            })
                          );
                        }}
                      >
                        <SelectTrigger className="w-48 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual Entry</SelectItem>
                          <SelectItem value="stock">Through Existing Stock</SelectItem>
                          <SelectItem value="inventory">Through Products (Stockless Items)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Stock Information Display in Row for Stock Mode */}
                    {item.sourceType === 'stock' && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>From Available Stock</span>
                        {item.productCategory && item.itemName && item.productVersion && (() => {
                          const stockItem = stockDetails.find(stock => 
                            stock.productCategory === item.productCategory &&
                            stock.itemName === item.itemName &&
                            stock.productVersion === item.productVersion
                          );
                          
                          if (!stockItem) {
                            return (
                              <div className="px-2 py-1 bg-red-50 border border-red-200 rounded text-red-600 font-medium">
                                Stock Not Found
                              </div>
                            );
                          }
                          
                          const currentStock = stockItem.currentStock || 0;
                          const unit = stockItem.unit || 'pcs';
                          const remainingStock = currentStock - (item.quantity || 0);
                          const minRequired = stockItem.minRequired || 0;
                          const safeQuantityLimit = stockItem.safeQuantityLimit || 0;
                          
                          // Calculate stock status
                          let stockStatus = 'normal';
                          let statusBg = 'bg-green-50 border-green-200 text-green-700';
                          
                          if (currentStock < safeQuantityLimit) {
                            stockStatus = 'critical';
                            statusBg = 'bg-red-50 border-red-200 text-red-700';
                          } else if (currentStock < minRequired) {
                            stockStatus = 'low';
                            statusBg = 'bg-yellow-50 border-yellow-200 text-yellow-700';
                          }
                          
                          return (
                            <div className="flex items-center gap-2">
                              {/* Current Stock */}
                              <div className="px-2 py-1 bg-blue-50 border border-blue-200 rounded text-blue-700 font-medium">
                                Current: {currentStock} {unit}
                              </div>
                              
                              {/* Stock Status */}
                              <div className={`px-2 py-1 border rounded font-medium ${statusBg}`}>
                                Status: {stockStatus.charAt(0).toUpperCase() + stockStatus.slice(1)}
                              </div>
                              
                              {/* Remaining Stock */}
                              <div className={`px-2 py-1 border rounded font-medium ${
                                remainingStock < 0 
                                  ? 'bg-red-50 border-red-200 text-red-700' 
                                  : 'bg-gray-50 border-gray-200 text-gray-700'
                              }`}>
                                {remainingStock < 0 ? (
                                  <>⚠️ Depleted by {Math.abs(remainingStock)} {unit}</>
                                ) : (
                                  <>Remaining: {remainingStock} {unit}</>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  {items.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {item.sourceType !== 'manual' ? (
                  // Stock or Inventory Products Mode
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-foreground mb-2 block">Product Category *</Label>
                      <SearchableDropdown
                        items={item.sourceType === 'stock' ? 
                          [...new Set(stockDetails.map(p => p.productCategory))] :
                          [...new Set(activeInventory.map(p => p.productCategory))]
                        }
                        value={item.productCategory}
                        onValueChange={(value) => updateItem(index, 'productCategory', value)}
                        placeholder="Select category"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-foreground mb-2 block">Product Name *</Label>
                      <SearchableDropdown
                        items={item.productCategory ? (
                          item.sourceType === 'stock' ?
                            [...new Set(stockDetails.filter(p => p.productCategory === item.productCategory).map(p => p.itemName))] :
                            [...new Set(activeInventory.filter(p => p.productCategory === item.productCategory).map(p => p.itemName))]
                        ) : []}
                        value={item.itemName}
                        onValueChange={(value) => updateItem(index, 'itemName', value)}
                        placeholder="Select name"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-foreground mb-2 block">Product Version *</Label>
                      <SearchableDropdown
                        items={item.productCategory && item.itemName ? (
                          item.sourceType === 'stock' ?
                            [...new Set(stockDetails.filter(p => p.productCategory === item.productCategory && p.itemName === item.itemName).map(p => p.productVersion))] :
                            [...new Set(activeInventory.filter(p => p.productCategory === item.productCategory && p.itemName === item.itemName).map(p => p.productVersion))]
                        ) : []}
                        value={item.productVersion}
                        onValueChange={(value) => updateItem(index, 'productVersion', value)}
                        placeholder="Select version"
                      />
                    </div>
                    
                    {/* Quantity and Unit for Stock mode only */}
                    {item.sourceType === 'stock' && (
                      <>
                         <div>
                           <Label className="text-sm font-medium text-foreground mb-2 block">Quantity *</Label>
                           <Input
                             type="number"
                             step="any"
                             min="0"
                             value={item.quantity}
                             onChange={(e) => updateItem(index, 'quantity', Number(e.target.value) || 0)}
                             className="bg-background"
                           />
                         </div>
                        <div>
                          <Label className="text-sm font-medium text-foreground mb-2 block">Unit</Label>
                          <Input
                            type="text"
                            value={item.unit || ''}
                            readOnly
                            className="bg-muted text-muted-foreground"
                            placeholder="Auto-filled"
                          />
                        </div>
                      </>
                    )}
                    
                    <div>
                      <Label className="text-sm font-medium text-foreground mb-2 block">
                        Rate ({companyCurrency.symbol})
                      </Label>
                      <Input
                        type="text"
                        value={item.rate === 0 ? '' : item.rate.toString()}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
                            updateItem(index, 'rate', value === '' ? 0 : Number(value));
                          }
                        }}
                        className="bg-background"
                        placeholder="Auto-filled but editable"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-foreground mb-2 block">Discount (%)</Label>
                      <Input
                        type="text"
                        value={item.discount}
                        onChange={(e) => updateItem(index, 'discount', e.target.value)}
                        className="bg-background"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-foreground mb-2 block">Amount</Label>
                      <div className="h-10 px-3 py-2 bg-primary/10 text-primary font-semibold rounded-md border flex items-center justify-end">
                        {formatCurrency(item.amount, companyCountry)}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Manual Entry Mode
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-foreground mb-2 block">Product Category *</Label>
                      <Input
                        value={item.productCategory}
                        onChange={(e) => updateItem(index, 'productCategory', e.target.value)}
                        placeholder="Enter category"
                        className="bg-background"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-foreground mb-2 block">Product Name *</Label>
                      <Input
                        value={item.itemName}
                        onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                        placeholder="Enter product name"
                        className="bg-background"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-foreground mb-2 block">Product Version *</Label>
                      <Input
                        value={item.productVersion}
                        onChange={(e) => updateItem(index, 'productVersion', e.target.value)}
                        placeholder="Enter version"
                        className="bg-background"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-foreground mb-2 block">Quantity (Optional)</Label>
                      <Input
                        type="number"
                        step="any"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value) || 0)}
                        className="bg-background"
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-foreground mb-2 block">Unit (Optional)</Label>
                      <Input
                        type="text"
                        value={item.unit || ''}
                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                        className="bg-background"
                        placeholder="e.g., pcs, kg, meters"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-foreground mb-2 block">
                        Rate ({companyCurrency.symbol}) *
                      </Label>
                      <Input
                        type="text"
                        value={item.rate === 0 ? '' : item.rate.toString()}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
                            updateItem(index, 'rate', value === '' ? 0 : Number(value));
                          }
                        }}
                        placeholder="0.00"
                        className="bg-background"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-foreground mb-2 block">Discount (%)</Label>
                      <Input
                        type="text"
                        value={item.discount}
                        onChange={(e) => updateItem(index, 'discount', e.target.value)}
                        className="bg-background"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-foreground mb-2 block">Amount</Label>
                      <div className="h-10 px-3 py-2 bg-primary/10 text-primary font-semibold rounded-md border flex items-center justify-end">
                        {formatCurrency(item.amount, companyCountry)}
                      </div>
                    </div>
                  </div>
                )}
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

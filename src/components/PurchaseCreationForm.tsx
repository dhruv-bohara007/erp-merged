
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Loader2, Edit2, Package } from 'lucide-react';
import { useSuppliers } from '@/hooks/useFirestore';
import { useCompanyData } from '@/hooks/useCompanyData';
import { useTaxCalculations } from '@/hooks/useTaxCalculations';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import SearchableDropdown from './SearchableDropdown';

interface PurchaseFormItem {
  productCategory: string;
  itemName: string;
  productVersion: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: string;
  amount: number;
  sourceType: 'available' | 'manual';
}

interface PurchaseRequest {
  id: string;
  companyId: string;
  employeeName: string;
  employeeEmail: string;
  productCategory: string;
  itemName: string;
  productVersion: string;
  stockStatus: string;
  quantityRequired: number;
  unit: string;
  requestedDate: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseCreationForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { suppliers } = useSuppliers();
  const { companyData } = useCompanyData();
  const { calculateTaxes, getTaxDisplayName } = useTaxCalculations();
  const { convertToINR, convertFromINR, formatCurrency, getCurrencyInfo, loading: currencyLoading } = useCurrencyConverter();
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [stockDetails, setStockDetails] = useState<any[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<PurchaseRequest[]>([]);
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [showRequestDropdown, setShowRequestDropdown] = useState(false);

  const [purchaseData, setPurchaseData] = useState({
    purchaseNumber: `PUR-${Date.now().toString().slice(-6)}`,
    purchaseDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    supplierId: '',
    notes: 'Prices exclude applicable local taxes, import duties, delivery charges, and customs fees.',
    terms: 'Payment due within 30 days of purchase date.',
  });

  const [productSourceType, setProductSourceType] = useState<'available' | 'manual'>('available');
  const [items, setItems] = useState<PurchaseFormItem[]>([
    { 
      productCategory: '', 
      itemName: '', 
      productVersion: '', 
      quantity: 1, 
      unit: 'pcs',
      rate: 0, 
      discount: '0', 
      amount: 0,
      sourceType: 'available'
    }
  ]);

  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [currencyAmounts, setCurrencyAmounts] = useState({
    companyAmount: 0,
    totalAmountINR: 0,
    supplierAmount: 0,
    companyToINRRate: 1,
    INRToSupplierRate: 1
  });

  // Check if coming from purchase request page
  useEffect(() => {
    const fromRequest = searchParams.get('fromRequest');
    setShowRequestDropdown(fromRequest === 'true');
  }, [searchParams]);

  // Fetch stock details from Firestore
  useEffect(() => {
    const fetchStockDetails = async () => {
      if (!currentUser?.companyId) return;
      
      try {
        const stockDetailsCollection = collection(db, 'stock_details');
        const q = query(stockDetailsCollection, where('companyId', '==', currentUser.companyId));
        const snapshot = await getDocs(q);
        
        const stockData = snapshot.docs.map(doc => doc.data());
        setStockDetails(stockData);
      } catch (error) {
        console.error('Error fetching stock details:', error);
      }
    };

    fetchStockDetails();
  }, [currentUser?.companyId]);

  // Fetch approved purchase requests when coming from request page
  useEffect(() => {
    const fetchApprovedRequests = async () => {
      if (!currentUser?.companyId || !showRequestDropdown) return;
      
      try {
        const requestsCollection = collection(db, 'purchase_requests');
        const q = query(
          requestsCollection, 
          where('companyId', '==', currentUser.companyId),
          where('status', '==', 'approved')
        );
        const snapshot = await getDocs(q);
        
        const fetchedRequests = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            requestedDate: data.requestedDate?.toDate() || new Date(),
            priority: data.priority || 'medium'
          };
        }) as PurchaseRequest[];

        // Sort by creation date (newest first)
        fetchedRequests.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
        setApprovedRequests(fetchedRequests);
      } catch (error) {
        console.error('Error fetching approved purchase requests:', error);
        toast({
          title: "Error",
          description: "Failed to load approved purchase requests",
          variant: "destructive"
        });
      }
    };

    fetchApprovedRequests();
  }, [currentUser?.companyId, showRequestDropdown, toast]);

  // Get categories, names, and versions from stock_details
  const availableCategories = [...new Set(stockDetails.map(p => p.productCategory))];
  const getAvailableNames = (category: string) => 
    [...new Set(stockDetails.filter(p => p.productCategory === category).map(p => p.itemName))];
  const getAvailableVersions = (category: string, name: string) =>
    [...new Set(stockDetails.filter(p => p.productCategory === category && p.itemName === name).map(p => p.productVersion))];
  
  const getProductPrice = (category: string, name: string, version: string): number => {
    const product = stockDetails.find(p => 
      p.productCategory === category && 
      p.itemName === name && 
      p.productVersion === version
    );
    return product?.pricePerUnit || 0;
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const companyCountry = companyData?.country || 'US';
  const supplierCountry = selectedSupplier?.country || 'US';
  const taxCalculation = calculateTaxes(subtotal, companyCountry, supplierCountry);

  // Find selected supplier details
  useEffect(() => {
    if (purchaseData.supplierId) {
      const supplier = suppliers.find(s => s.id === purchaseData.supplierId);
      setSelectedSupplier(supplier);
    } else {
      setSelectedSupplier(null);
    }
  }, [purchaseData.supplierId, suppliers]);

  // Currency conversion effect (similar to InvoiceForm)
  useEffect(() => {
    if (!selectedSupplier || subtotal === 0) {
      setCurrencyAmounts({
        companyAmount: taxCalculation.totalAmount,
        totalAmountINR: taxCalculation.totalAmount,
        supplierAmount: taxCalculation.totalAmount,
        companyToINRRate: 1,
        INRToSupplierRate: 1
      });
      setConversionError(null);
      return;
    }

    const convertAmounts = async () => {
      const companyTotal = taxCalculation.totalAmount;
      setConversionError(null);

      try {
        console.log('Starting currency conversion for purchase:', companyTotal, companyCountry, 'to', supplierCountry);
        
        if (companyCountry === 'IN') {
          const { convertedAmount: supplierTotal, rate: INRToSupplierRate } = await convertFromINR(companyTotal, supplierCountry);
          
          setCurrencyAmounts({
            companyAmount: companyTotal,
            totalAmountINR: companyTotal,
            supplierAmount: supplierTotal,
            companyToINRRate: 1,
            INRToSupplierRate
          });
        } else {
          const { amountInINR, rate: companyToINRRate } = await convertToINR(companyTotal, companyCountry);
          
          if (supplierCountry === 'IN') {
            setCurrencyAmounts({
              companyAmount: companyTotal,
              totalAmountINR: amountInINR,
              supplierAmount: amountInINR,
              companyToINRRate,
              INRToSupplierRate: 1
            });
          } else {
            const { convertedAmount: supplierTotal, rate: INRToSupplierRate } = await convertFromINR(amountInINR, supplierCountry);
            
            setCurrencyAmounts({
              companyAmount: companyTotal,
              totalAmountINR: amountInINR,
              supplierAmount: supplierTotal,
              companyToINRRate,
              INRToSupplierRate
            });
          }
        }
        
        console.log('Currency conversion completed successfully');
      } catch (error) {
        console.error('Currency conversion failed:', error);
        setConversionError('Currency conversion failed. Using fallback rates.');
        
        setCurrencyAmounts({
          companyAmount: companyTotal,
          totalAmountINR: companyTotal,
          supplierAmount: companyTotal,
          companyToINRRate: 1,
          INRToSupplierRate: 1
        });
      }
    };

    const timeoutId = setTimeout(convertAmounts, 300);
    return () => clearTimeout(timeoutId);
  }, [subtotal, selectedSupplier, companyData?.country, taxCalculation.totalAmount]);

  const addItem = () => {
    const newItem: PurchaseFormItem = {
      productCategory: '',
      itemName: '',
      productVersion: '',
      quantity: 1,
      unit: 'pcs',
      rate: 0,
      discount: '0',
      amount: 0,
      sourceType: productSourceType
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof PurchaseFormItem, value: string | number) => {
    setItems(items.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };
        
        // Auto-populate rate when product is selected (only for 'available' source type)
        if ((field === 'productCategory' || field === 'itemName' || field === 'productVersion') && updatedItem.sourceType === 'available') {
          if (updatedItem.productCategory && updatedItem.itemName && updatedItem.productVersion) {
            const price = getProductPrice(updatedItem.productCategory, updatedItem.itemName, updatedItem.productVersion);
            if (price > 0) {
              updatedItem.rate = price;
            }
          }
        }
        
        // Recalculate amount when quantity, rate, or discount changes
        if (field === 'quantity' || field === 'rate' || field === 'discount') {
          const subtotalAmount = updatedItem.quantity * updatedItem.rate;
          const discountPercent = typeof updatedItem.discount === 'string' ? parseFloat(updatedItem.discount) || 0 : updatedItem.discount;
          const discountAmount = (subtotalAmount * discountPercent) / 100;
          updatedItem.amount = subtotalAmount - discountAmount;
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  // Handle purchase request multi-selection
  const handleRequestSelection = (requestId: string, checked: boolean) => {
    if (checked) {
      setSelectedRequestIds(prev => [...prev, requestId]);
    } else {
      setSelectedRequestIds(prev => prev.filter(id => id !== requestId));
    }
  };

  // Auto-fill items when requests are selected
  useEffect(() => {
    if (selectedRequestIds.length > 0) {
      const selectedRequests = approvedRequests.filter(req => selectedRequestIds.includes(req.id));
      
      const newItems: PurchaseFormItem[] = selectedRequests.map(request => {
        // Use pricePerUnit from the request if available, otherwise get from stock_details
        const priceFromRequest = (request as any).pricePerUnit || 0;
        const priceFromStock = getProductPrice(request.productCategory, request.itemName, request.productVersion);
        const finalPrice = priceFromRequest || priceFromStock;
        
        const newItem: PurchaseFormItem = {
          productCategory: request.productCategory,
          itemName: request.itemName,
          productVersion: request.productVersion,
          quantity: request.quantityRequired,
          unit: request.unit,
          rate: finalPrice,
          discount: '0',
          amount: finalPrice ? request.quantityRequired * finalPrice : 0,
          sourceType: 'available'
        };
        return newItem;
      });

      if (newItems.length > 0) {
        setItems(newItems);
        setProductSourceType('available');
      }
    } else {
      // Reset to default item if no requests selected
      setItems([{ 
        productCategory: '', 
        itemName: '', 
        productVersion: '', 
        quantity: 1, 
        unit: 'pcs',
        rate: 0, 
        discount: '0', 
        amount: 0,
        sourceType: 'available'
      }]);
    }
  }, [selectedRequestIds, approvedRequests]);

  // Currency info
  const companyCurrency = getCurrencyInfo(companyCountry);
  const supplierCurrency = getCurrencyInfo(supplierCountry);

  const handleSubmit = async (status: 'draft' | 'completed') => {
    if (!currentUser?.companyId) {
      toast({
        title: "Error",
        description: "Company information is required",
        variant: "destructive",
      });
      return;
    }

    if (!purchaseData.supplierId) {
      toast({
        title: "Error",
        description: "Please select a supplier",
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
      const { addDoc, collection } = await import('firebase/firestore');
      
      // Create purchase order document with all required data
      const purchaseOrderData = {
        // Purchase details
        ...purchaseData,
        items,
        subtotal,
        taxCalculation,
        status,
        
        // Currency amounts
        currencyAmounts,
        
        // Supplier details (copy all fields)
        supplier: selectedSupplier ? { ...selectedSupplier } : null,
        
        // Company details (copy all fields)
        company: companyData ? { ...companyData } : null,
        
        // Additional metadata
        companyId: currentUser.companyId,
        createdBy: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save to purchase_orders collection
      await addDoc(collection(db, 'purchase_orders'), purchaseOrderData);

      // Update selected purchase requests status to 'PO Created' if the order is completed
      if (status === 'completed' && selectedRequestIds.length > 0) {
        const { doc, updateDoc } = await import('firebase/firestore');
        const { syncPurchaseRequestStatus } = await import('@/services/stockSyncService');
        
        const updatePromises = selectedRequestIds.map(async (requestId) => {
          const requestRef = doc(db, 'purchase_requests', requestId);
          await updateDoc(requestRef, {
            status: 'PO Created',
            updatedAt: new Date()
          });

          // Find the matching request to get product details for sync
          const matchingRequest = approvedRequests.find(req => req.id === requestId);
          if (matchingRequest) {
            // Sync with stock_details to update poCreatedQuantity and lastRequestStatus
            await syncPurchaseRequestStatus(
              currentUser.companyId,
              matchingRequest.productCategory,
              matchingRequest.itemName,
              matchingRequest.productVersion,
              'PO Created',
              matchingRequest.quantityRequired
            );
          }
        });
        
        await Promise.all(updatePromises);
      }

      toast({
        title: "Success",
        description: `Purchase order ${status === 'draft' ? 'saved as draft' : 'created'} successfully`,
      });

      navigate('/purchases');
    } catch (error) {
      console.error('Error creating purchase order:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create purchase order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Create New Purchase</h1>
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
            onClick={() => handleSubmit('completed')}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Purchase'}
          </Button>
        </div>
      </div>

      {/* Purchase Request Selection (Only shown when fromRequest=true) */}
      {showRequestDropdown && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Select Approved Purchase Request
            </CardTitle>
            <p className="text-blue-700 text-sm">
              Choose an approved purchase request to auto-fill product details into the purchase order.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="purchaseRequest">Select Approved Purchase Requests</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Select multiple purchase requests to auto-fill as purchase items. 
                  Each selected request will become a separate item in your purchase order.
                </p>
                
                {approvedRequests.length === 0 ? (
                  <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
                    No approved purchase requests found
                  </div>
                ) : (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {selectedRequestIds.length === 0
                          ? "Select purchase requests..."
                          : `${selectedRequestIds.length} request(s) selected`}
                        <Package className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                      <div className="max-h-80 overflow-y-auto">
                        {approvedRequests.map((request) => (
                          <div
                            key={request.id}
                            className="flex items-start space-x-3 p-3 hover:bg-accent cursor-pointer border-b border-border/50 last:border-0"
                            onClick={() => handleRequestSelection(request.id, !selectedRequestIds.includes(request.id))}
                          >
                            <Checkbox
                              checked={selectedRequestIds.includes(request.id)}
                              onCheckedChange={(checked) => handleRequestSelection(request.id, checked as boolean)}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm text-foreground">
                                  {request.itemName}
                                </span>
                                <span className="text-xs text-muted-foreground font-mono">
                                  ID: {request.id.slice(0, 8)}...
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                <span className="font-medium">{request.productCategory}</span> • 
                                v{request.productVersion} • 
                                {request.quantityRequired} {request.unit}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Requested by: {request.employeeName} • 
                                {request.requestedDate.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              
              {selectedRequestIds.length > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800 mb-3">
                    Selected Requests ({selectedRequestIds.length}):
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedRequestIds.map((requestId, index) => {
                      const request = approvedRequests.find(req => req.id === requestId);
                      return request ? (
                        <div key={requestId} className="flex items-center justify-between bg-white p-2 rounded border border-green-200">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-green-800">
                              Item {index + 1}: {request.itemName} ({request.productCategory})
                            </p>
                            <p className="text-xs text-green-600">
                              v{request.productVersion} • {request.quantityRequired} {request.unit} • {request.employeeName}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRequestSelection(requestId, false)}
                            className="text-green-700 hover:text-green-900 hover:bg-green-100"
                          >
                            ×
                          </Button>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Purchase Details */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchaseNumber">Purchase Number</Label>
                <Input
                  id="purchaseNumber"
                  value={purchaseData.purchaseNumber}
                  onChange={(e) => setPurchaseData({...purchaseData, purchaseNumber: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="purchaseDate">Issue Date</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={purchaseData.purchaseDate}
                  onChange={(e) => setPurchaseData({...purchaseData, purchaseDate: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={purchaseData.dueDate || ''}
                onChange={(e) => setPurchaseData({...purchaseData, dueDate: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="supplier">Select Supplier *</Label>
              <Select onValueChange={(value) => setPurchaseData({...purchaseData, supplierId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name} - {supplier.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedSupplier && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">{selectedSupplier.name}</p>
                <p className="text-sm text-blue-700">{selectedSupplier.email}</p>
                <p className="text-sm text-blue-700">{selectedSupplier.address}, {selectedSupplier.city}</p>
                <p className="text-sm text-blue-700">{selectedSupplier.state} - {selectedSupplier.pincode}</p>
                <p className="text-sm text-blue-700">{selectedSupplier.country}</p>
                {selectedSupplier.taxId && (
                  <p className="text-sm text-blue-700">Tax ID: {selectedSupplier.taxId}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Purchase Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal, companyCountry)}</span>
              </div>
              
              {selectedSupplier && taxCalculation.taxes.length > 0 && (
                <>
                  {taxCalculation.taxes.map((tax, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{tax.name} ({tax.rate}%):</span>
                      <span>{formatCurrency(tax.amount, companyCountry)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-medium">
                    <span>Total {getTaxDisplayName(companyCountry, supplierCountry)}:</span>
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

                {selectedSupplier && companyCountry !== supplierCountry && (
                  <div className="flex justify-between text-sm text-green-700">
                    <span>Supplier Currency ({supplierCurrency.code}):</span>
                    <span>
                      {currencyLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin inline" />
                      ) : (
                        `${supplierCurrency.symbol}${currencyAmounts.supplierAmount.toFixed(2)}`
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Exchange Rate Info */}
              {selectedSupplier && currencyAmounts.companyToINRRate !== 1 && (
                <div className="text-xs text-gray-500 mt-2">
                  <p>Exchange rates: 1 {companyCurrency.code} = ₹{currencyAmounts.companyToINRRate.toFixed(4)}</p>
                  {companyCountry !== supplierCountry && (
                    <p>1 INR = {currencyAmounts.INRToSupplierRate.toFixed(4)} {supplierCurrency.code}</p>
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
            
            {selectedSupplier && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Tax Information</p>
                <p className="text-xs text-blue-700">
                  {companyCountry === 'IN' && supplierCountry === 'IN' 
                    ? 'Intra-state transaction: CGST + SGST applicable'
                    : companyCountry === 'IN' && supplierCountry !== 'IN'
                    ? 'Inter-state/International transaction: IGST applicable'
                    : `${getTaxDisplayName(companyCountry, supplierCountry)} based on company location (${companyCountry})`
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Purchase Items */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-semibold text-primary">Purchase Items</CardTitle>
            <Button onClick={addItem} size="sm" className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
          
          {/* Product Source Selector */}
          <div className="mt-4 p-4 bg-background rounded-lg border">
            <Label className="text-sm font-medium mb-3 block">Select Product Source</Label>
            <Select value={productSourceType} onValueChange={(value: 'available' | 'manual') => {
              setProductSourceType(value);
              setItems(items.map(item => ({ ...item, sourceType: value })));
            }}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">From Available Products</SelectItem>
                <SelectItem value="manual">Manual Entry</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {items.map((item, index) => (
              <div key={index} className="relative bg-gradient-to-br from-card to-card/80 border border-border/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
                {/* Item Header */}
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    Item #{index + 1} • {productSourceType === 'available' ? 'From Stock Details' : 'Manual Entry'}
                  </span>
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

                {productSourceType === 'available' ? (
                  // Available Products Mode
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-foreground mb-2 block">Product Category *</Label>
                      <SearchableDropdown
                        items={availableCategories}
                        value={item.productCategory}
                        onValueChange={(value) => updateItem(index, 'productCategory', value)}
                        placeholder="Select category"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-foreground mb-2 block">Product Name *</Label>
                      <SearchableDropdown
                        items={item.productCategory ? getAvailableNames(item.productCategory) : []}
                        value={item.itemName}
                        onValueChange={(value) => updateItem(index, 'itemName', value)}
                        placeholder="Select name"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-foreground mb-2 block">Product Version *</Label>
                      <SearchableDropdown
                        items={item.productCategory && item.itemName ? getAvailableVersions(item.productCategory, item.itemName) : []}
                        value={item.productVersion}
                        onValueChange={(value) => updateItem(index, 'productVersion', value)}
                        placeholder="Select version"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-foreground mb-2 block">Quantity *</Label>
                      <Input
                        type="number"
                        step="any"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value) || 0)}
                        className="bg-background"
                        placeholder="Enter quantity"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-foreground mb-2 block">Unit *</Label>
                      <Select value={item.unit} onValueChange={(value) => updateItem(index, 'unit', value)}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pcs">Pieces</SelectItem>
                          <SelectItem value="kg">Kilograms</SelectItem>
                          <SelectItem value="g">Grams</SelectItem>
                          <SelectItem value="lbs">Pounds</SelectItem>
                          <SelectItem value="oz">Ounces</SelectItem>
                          <SelectItem value="l">Liters</SelectItem>
                          <SelectItem value="ml">Milliliters</SelectItem>
                          <SelectItem value="m">Meters</SelectItem>
                          <SelectItem value="cm">Centimeters</SelectItem>
                          <SelectItem value="ft">Feet</SelectItem>
                          <SelectItem value="in">Inches</SelectItem>
                          <SelectItem value="box">Box</SelectItem>
                          <SelectItem value="pack">Pack</SelectItem>
                          <SelectItem value="set">Set</SelectItem>
                          <SelectItem value="pair">Pair</SelectItem>
                          <SelectItem value="dozen">Dozen</SelectItem>
                          <SelectItem value="each">Each</SelectItem>
                          <SelectItem value="unit">Unit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                        Rate ({companyCurrency.symbol})
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            const rateInput = document.querySelector(`input[data-rate-index="${index}"]`) as HTMLInputElement;
                            if (rateInput) {
                              rateInput.readOnly = false;
                              rateInput.className = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
                              rateInput.focus();
                            }
                          }}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </Label>
                      <Input
                        type="text"
                        value={item.rate === 0 ? '' : item.rate.toString()}
                        readOnly
                        className="bg-muted text-muted-foreground"
                        placeholder="Auto-filled"
                        data-rate-index={index}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
                            updateItem(index, 'rate', value === '' ? 0 : Number(value));
                          }
                        }}
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
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
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
                      <Label className="text-sm font-medium text-foreground mb-2 block">Quantity *</Label>
                      <Input
                        type="number"
                        step="any"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value) || 0)}
                        className="bg-background"
                        placeholder="Enter quantity"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-foreground mb-2 block">Unit *</Label>
                      <Select value={item.unit} onValueChange={(value) => updateItem(index, 'unit', value)}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pcs">Pieces</SelectItem>
                          <SelectItem value="kg">Kilograms</SelectItem>
                          <SelectItem value="g">Grams</SelectItem>
                          <SelectItem value="lbs">Pounds</SelectItem>
                          <SelectItem value="oz">Ounces</SelectItem>
                          <SelectItem value="l">Liters</SelectItem>
                          <SelectItem value="ml">Milliliters</SelectItem>
                          <SelectItem value="m">Meters</SelectItem>
                          <SelectItem value="cm">Centimeters</SelectItem>
                          <SelectItem value="ft">Feet</SelectItem>
                          <SelectItem value="in">Inches</SelectItem>
                          <SelectItem value="box">Box</SelectItem>
                          <SelectItem value="pack">Pack</SelectItem>
                          <SelectItem value="set">Set</SelectItem>
                          <SelectItem value="pair">Pair</SelectItem>
                          <SelectItem value="dozen">Dozen</SelectItem>
                          <SelectItem value="each">Each</SelectItem>
                          <SelectItem value="unit">Unit</SelectItem>
                        </SelectContent>
                      </Select>
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
              placeholder="Additional notes for the purchase..."
              value={purchaseData.notes}
              onChange={(e) => setPurchaseData({...purchaseData, notes: e.target.value})}
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
              placeholder="Purchase terms and conditions..."
              value={purchaseData.terms}
              onChange={(e) => setPurchaseData({...purchaseData, terms: e.target.value})}
              rows={4}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PurchaseCreationForm;

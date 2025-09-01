
import { Timestamp } from 'firebase/firestore';

export interface Company {
  id: string;
  name: string;
  logo?: string;
  address: string;
  phone: string; // Format: +91 XXXXX XXXXX
  email: string;
  website?: string;
  gstin: string; // GST Identification Number (15 chars)
  pan: string; // PAN number (10 chars)
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountHolderName: string;
  };
  currency: string; // default: 'INR'
  defaultCGST: number; // default: 9
  defaultSGST: number; // default: 9  
  defaultIGST: number; // default: 18
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string; // Format: +91 XXXXX XXXXX or international format
  address: string;
  city: string;
  state: string; // For GST calculation (CGST+SGST vs IGST) or general location
  pincode: string; // PIN code or postal code
  country?: string; // ISO country code (e.g., 'IN', 'US', 'GB')
  gstin?: string; // Client's GSTIN if registered (backward compatibility)
  pan?: string; // Client's PAN (backward compatibility)
  taxInfo?: {
    id: string; // Tax ID (GSTIN, EIN, VAT, etc.)
    type: string; // Tax type label (GSTIN, Federal EIN, VAT Number, etc.)
  };
  status: 'active' | 'inactive';
  totalInvoices: number;
  totalAmount: number;
  outstandingAmount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface InvoiceItem {
  id: string;
  description: string;
  hsn?: string; // HSN/SAC code
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string; // denormalized
  clientEmail: string;
  clientGSTIN?: string;
  issueDate: Timestamp;
  dueDate: Timestamp;
  status: 'draft' | 'sent' | 'paid' | 'unpaid' | 'overdue' | 'cancelled' | 'pending' | 'partially-paid' | 'paid-after-due';
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  discountAmount: number;
  isInterState: boolean; // determines CGST+SGST vs IGST
  cgstRate?: number;
  sgstRate?: number;
  igstRate?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  totalGST: number;
  total: number;
  currency: string; // 'INR'
  // New currency conversion fields
  totalAmountINR: number; // Final amount stored in INR
  companyCurrency: string; // Original company currency (e.g., 'EUR', 'USD')
  companyAmount: number; // Amount in company's original currency
  clientCurrency: string; // Client's local currency
  clientAmount: number; // Amount converted to client's currency from INR
  conversionRate?: {
    companyToINR: number; // Rate used for company currency → INR
    INRToClient: number; // Rate used for INR → client currency
    timestamp: Timestamp; // When the conversion was done
  };
  // New country fields for automatic population
  companyCountry: string; // Automatically fetched from company document
  clientCountry: string; // Automatically fetched from client document
  // New company snapshot fields
  companyName: string;
  companyLogoUrl?: string;
  companyTaxInfo?: {
    gstin: string;
    pan: string;
  };
  companyBankDetails?: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountHolderName: string;
  };
  companyAddress: string;
  ownerSignatureUrl?: string;
  // New client snapshot fields
  clientAddress: string;
  clientTaxInfo?: {
    id: string;
    type: string;
  };
  notes?: string;
  terms?: string;
  paidDate?: Timestamp;
  paidAmount?: number;
  paidUSD?: number; // Amount paid in company currency
  paidINR?: number; // Amount paid in INR
  pendingINR?: number; // Remaining amount pending in INR
  // New field: Array to store all partial payments made for this invoice
  partialPayments?: PartialPayment[]; // Individual payments made towards this invoice
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PartialPayment {
  paymentDate: Timestamp;
  originalPaymentAmount: number; // Amount in original payment currency
  paymentMethod: 'neft' | 'rtgs' | 'imps' | 'upi' | 'cash' | 'credit_card' | 'debit_card' | 'cheque';
  amountPaidByClient: number; // Amount paid in client's currency
  amount: number; // Amount in company currency
  conversionRate: {
    companyToINR: number; // Rate used for company currency → INR
    INRToClient: number; // Rate used for INR → client currency
    timestamp: Timestamp; // When the conversion was done
  };
  pendingPaymentInINR: number;
  clientCurrency: string;
  companyCurrency: string;
  referenceNumber?: string; // UTR/Transaction ID
  bankDetails?: {
    fromAccount?: string;
    toAccount?: string;
    ifscCode?: string;
  };
  notes?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string; // denormalized
  clientId: string;
  clientName: string; // denormalized
  companyId: string;
  totalPaidUSD: number; // Total amount paid in company currency
  totalPaidINR: number; // Total amount paid in INR
  pendingINR: number; // Remaining amount pending in INR
  status: 'completed' | 'partial' | 'pending';
  partialPayments: PartialPayment[]; // Array of individual payments
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GSTReturn {
  id: string;
  month: number;
  year: number;
  gstr1Filed: boolean;
  gstr3bFiled: boolean;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  totalTDS: number;
  filingDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TDSRecord {
  id: string;
  invoiceId: string;
  clientId: string;
  invoiceAmount: number;
  tdsRate: number; // Usually 10%
  tdsAmount: number;
  netPayable: number;
  quarter: string; // Q1, Q2, Q3, Q4
  financialYear: string; // FY 2024-25
  certificateNumber?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Supplier {
  id: string;
  companyId?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  taxInfo?: {
    id: string;
    type: string;
  };
  status: 'active' | 'inactive';
  totalPurchases?: number;
  totalAmount?: number;
  outstandingAmount?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Purchase {
  id: string;
  companyId?: string;
  supplierId?: string;
  supplierName?: string;
  itemName?: string;
  productCategory?: string;
  productName?: string;
  productVersion?: string;
  quantity?: number;
  unit?: string;
  pricePerUnit?: number;
  discount?: string;
  totalAmount?: number;
  totalAmountAfterTax?: number; // Added Total Amount After Tax field
  totalAmountINR?: number;
  companyCurrency?: string;
  exchangeRateUsed?: number;
  purchaseDate?: Date;
  status?: 'completed' | 'pending' | 'cancelled';
  description?: string;
  receipt?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Purchase item interface for items array in purchase records
export interface PurchaseItem {
  productCategory: string;
  itemName: string;
  productVersion: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  discount?: string;
  amount: number;
}

// Note: This interface is used for the purchase_records collection (migrated from expenses)
export interface Expense {
  id: string;
  companyId?: string;
  title: string;
  amount: number;
  category: string;
  clientId?: string;
  clientName?: string;
  projectName?: string;
  description: string;
  expenseDate: Date;
  receipt?: string;
  status: 'recorded' | 'approved' | 'reimbursed';
  // Purchase-specific fields (for when used as Purchase)
  purchaseRecordId?: string; // Added for purchase record identification
  supplierName?: string;
  supplierCountry?: string; // New field for supplier country
  supplierCurrency?: string; // New field for supplier currency
  companyCountry?: string; // New field for company country
  itemName?: string;
  productCategory?: string; // Added for product categorization
  productName?: string; // Added for consistency with productCategory
  productVersion?: string; // Added for product versioning
  quantity?: number;
  unit?: string;
  pricePerUnit?: number;
  discount?: string;
  totalAmount?: number;
  totalAmountAfterTax?: number; // Total Amount After Tax in company currency
  totalAmountAfterTaxINR?: number; // Total Amount After Tax in INR
  totalAmountINR?: number;
  companyCurrency?: string;
  exchangeRateUsed?: number;
  purchaseDate?: Date;
  purchaseStatus?: 'completed' | 'pending' | 'cancelled';
  // New fields for storing multiple items in a single purchase record
  items?: PurchaseItem[]; // Array of purchase items
  subtotal?: number; // Subtotal of all items
  totalTaxAmount?: number; // Total tax amount
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  id: string;
  companyId: string;
  name: string;
  email: string;
  temporaryPassword?: string;
  needsPasswordReset: boolean;
  country?: string;
  phoneCode?: string;
  phoneNumber?: string;
  status: 'active' | 'inactive' | 'not_verified' | 'verified' | 'invited';
  role: 'employee';
  createdAt: any;
  updatedAt: any;
}

// InventoryItem interface with all required fields
export interface InventoryItem {
  id: string;
  companyId?: string;
  itemName: string;
  productCategory?: string;
  productVersion?: string;
  unitPrice?: number;
  rate?: number;
  rateInInr?: number;
  exchangeRateUsed?: number;
  quantity?: number; // Added quantity field
  unit?: string; // Added unit field
  totalAmountAfterTax?: number; // Total Amount After Tax in company currency
  totalAmountAfterTaxINR?: number; // Total Amount After Tax in INR
  companyCurrency?: string;
  companyCountry?: string;
  status?: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

// StockDetails interface for the new stock_details collection
export interface StockDetailsData {
  id: string;
  companyId: string;
  productCategory: string;
  itemName: string;
  productVersion: string;
  currentStock: number;
  pricePerUnit?: number;
  lastPurchaseDate?: Date;
  unit: string;
  minRequired?: number;
  safeQuantityLimit?: number;
  displayStatus: 'displayed' | 'suspended';
  stock_status?: 'normal' | 'low' | 'critical';
  createdAt: Date;
  updatedAt: Date;
  // New fields for purchase request status tracking
  pendingQuantity?: number;
  approvedQuantity?: number;
  poCreatedQuantity?: number;
  rejectedQuantity?: number;
  lastRequestStatus?: 'pending' | 'approved' | 'po_created' | 'rejected' | 'Order Recorded';
  lastRecordedOrderQuantity?: number;
}

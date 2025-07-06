
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
  status: 'draft' | 'sent' | 'paid' | 'unpaid' | 'overdue' | 'cancelled';
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
  notes?: string;
  terms?: string;
  paidDate?: Timestamp;
  paidAmount?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string; // denormalized
  clientId: string;
  clientName: string; // denormalized
  amount: number;
  paymentMethod: 'neft' | 'rtgs' | 'imps' | 'upi' | 'cash' | 'credit_card' | 'debit_card' | 'cheque';
  paymentDate: Timestamp;
  status: 'completed' | 'pending' | 'failed';
  referenceNumber?: string; // UTR/Transaction ID
  bankDetails?: {
    fromAccount?: string;
    toAccount?: string;
    ifscCode?: string;
  };
  notes?: string;
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


import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { Company, Client, GSTReturn, TDSRecord } from '../types/firestore';
import { Invoice } from '../hooks/useFirestore';
import { LegacyPayment } from '@/types/payment-legacy';

export const initializeCollections = async () => {
  try {
    console.log('Initializing Firestore collections...');

    // Sample Company Data
    const sampleCompany: Omit<Company, 'id'> = {
      name: 'TechSolutions Pvt Ltd',
      address: '123 Business Park, Mumbai, Maharashtra - 400001',
      phone: '+91 98765 43210',
      email: 'info@techsolutions.com',
      website: 'www.techsolutions.com',
      gstin: '27AABCT1234M1Z5',
      pan: 'AABCT1234M',
      bankDetails: {
        accountNumber: '123456789012',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank',
        accountHolderName: 'TechSolutions PvLtd'
      },
      currency: 'INR',
      defaultCGST: 9,
      defaultSGST: 9,
      defaultIGST: 18,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    // Sample Client Data
    const sampleClients: Omit<Client, 'id'>[] = [
      {
        name: 'ABC Corporation',
        email: 'contact@abccorp.com',
        phone: '+91 99887 76543',
        address: '456 Corporate Avenue, Delhi - 110001',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        country: 'IN',
        gstin: '07AABCA1234N1Z9',
        taxInfo: {
          id: '07AABCA1234N1Z9',
          type: 'GSTIN'
        },
        status: 'active',
        totalInvoices: 0,
        totalAmount: 0,
        outstandingAmount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        name: 'XYZ Enterprises',
        email: 'admin@xyzent.com',
        phone: '+91 88776 65432',
        address: '789 Industrial Area, Bangalore - 560001',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        country: 'IN',
        gstin: '29AABCX1234P1Z1',
        taxInfo: {
          id: '29AABCX1234P1Z1',
          type: 'GSTIN'
        },
        status: 'active',
        totalInvoices: 0,
        totalAmount: 0,
        outstandingAmount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }
    ];

    // Add Company
    const companyRef = await addDoc(collection(db, 'companies'), sampleCompany);
    console.log('Company added with ID:', companyRef.id);

    // Add Clients
    const clientRefs = [];
    for (const client of sampleClients) {
      const clientRef = await addDoc(collection(db, 'clients'), client);
      clientRefs.push(clientRef);
      console.log('Client added with ID:', clientRef.id);
    }

    // Sample Invoice Data - now includes ALL required fields including amountPaidByClient
    const sampleInvoice: Omit<Invoice, 'id'> = {
      companyId: companyRef.id,
      invoiceNumber: 'INV-2024-001',
      clientId: clientRefs[0].id,
      clientName: 'ABC Corporation',
      clientEmail: 'contact@abccorp.com',
      clientState: 'Delhi',
      items: [
        {
          description: 'Software Development Services',
          quantity: 1,
          rate: 100000,
          amount: 100000
        }
      ],
      subtotal: 100000,
      cgst: 9000,
      sgst: 9000,
      igst: 0,
      totalGst: 18000,
      totalAmount: 118000,
      // Currency fields
      totalAmountINR: 118000,
      companyCurrency: 'INR',
      companyAmount: 118000,
      clientCurrency: 'INR',
      clientAmount: 118000,
      amountPaidByClient: 0,
      conversionRate: {
        companyToINR: 1,
        INRToClient: 1,
        timestamp: new Date()
      },
      // Country fields
      companyCountry: 'IN',
      clientCountry: 'IN',
      // Company snapshot fields
      companyName: 'TechSolutions Pvt Ltd',
      companyLogoUrl: undefined,
      companyTaxInfo: {
        primaryType: 'GSTIN',
        primaryId: '27AABCT1234M1Z5',
        gstin: '27AABCT1234M1Z5'
      },
      companyBankDetails: {
        accountNumber: '123456789012',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank',
        accountHolderName: 'TechSolutions PvLtd'
      },
      companyAddress: '123 Business Park, Mumbai, Maharashtra - 400001',
      ownerSignatureUrl: undefined,
      // Client snapshot fields
      clientAddress: '456 Corporate Avenue, Delhi - 110001',
      clientTaxInfo: {
        id: '07AABCA1234N1Z9',
        type: 'GSTIN'
      },
      status: 'sent',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      notes: 'Payment due within 30 days',
      terms: 'Net 30 days payment terms',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add Invoice
    const invoiceRef = await addDoc(collection(db, 'invoices'), sampleInvoice);
    console.log('Invoice added with ID:', invoiceRef.id);

    // Sample Payment Data - using Date instead of Timestamp for paymentDate
    const samplePayment: Omit<LegacyPayment, 'id' | 'createdAt'> = {
      invoiceId: invoiceRef.id,
      invoiceNumber: 'INV-2024-001',
      clientId: clientRefs[0].id,
      clientName: 'ABC Corporation',
      amount: 59000,
      paymentMethod: 'neft',
      paymentDate: new Date(), // Changed from Timestamp.now() to new Date()
      status: 'completed',
      referenceNumber: 'UTR123456789',
      bankDetails: {
        fromAccount: '987654321098',
        toAccount: '123456789012',
        ifscCode: 'HDFC0001234'
      },
      notes: 'Partial payment received',
      amountPaidByClient: 59000,
    };

    // Add Payment
    const paymentRef = await addDoc(collection(db, 'payments'), samplePayment);
    console.log('Payment added with ID:', paymentRef.id);

    // Sample GST Return Data
    const sampleGSTReturn: Omit<GSTReturn, 'id'> = {
      month: 12,
      year: 2024,
      gstr1Filed: false,
      gstr3bFiled: false,
      totalCGST: 45000,
      totalSGST: 45000,
      totalIGST: 90000,
      totalTDS: 10000,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    // Add GST Return
    const gstReturnRef = await addDoc(collection(db, 'gst_returns'), sampleGSTReturn);
    console.log('GST Return added with ID:', gstReturnRef.id);

    // Sample TDS Record Data
    const sampleTDSRecord: Omit<TDSRecord, 'id'> = {
      invoiceId: invoiceRef.id,
      clientId: clientRefs[0].id,
      invoiceAmount: 118000,
      tdsRate: 10,
      tdsAmount: 11800,
      netPayable: 106200,
      quarter: 'Q3',
      financialYear: 'FY 2024-25',
      certificateNumber: 'TDS-2024-001',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    // Add TDS Record
    const tdsRecordRef = await addDoc(collection(db, 'tds_records'), sampleTDSRecord);
    console.log('TDS Record added with ID:', tdsRecordRef.id);

    console.log('All collections initialized successfully!');
    return true;
  } catch (error) {
    console.error('Error initializing collections:', error);
    return false;
  }
};

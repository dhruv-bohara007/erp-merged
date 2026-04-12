import { collection, getDocs, addDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { Expense } from '../types/firestore';

export const migrateExpensesToPurchaseRecords = async (): Promise<boolean> => {
  try {
    console.log('Starting migration from expenses to purchase_records...');

    // Step 1: Get all documents from expenses collection
    const expensesSnapshot = await getDocs(collection(db, 'expenses'));
    const expensesData = expensesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as (Expense & { id: string })[];

    console.log(`Found ${expensesData.length} expense records to migrate`);

    if (expensesData.length === 0) {
      console.log('No expenses to migrate');
      return true;
    }

    // Step 2: Use batch write to copy all data to purchase_records collection
    const batch = writeBatch(db);
    const purchaseRecordsRef = collection(db, 'purchase_records');

    for (const expense of expensesData) {
      const { id, ...expenseDataWithoutId } = expense;
      const newDocRef = doc(purchaseRecordsRef);
      batch.set(newDocRef, expenseDataWithoutId);
    }

    // Commit the batch write
    await batch.commit();
    console.log(`Successfully migrated ${expensesData.length} records to purchase_records`);

    // Step 3: Delete all documents from expenses collection
    const deleteBatch = writeBatch(db);
    expensesSnapshot.docs.forEach(doc => {
      deleteBatch.delete(doc.ref);
    });

    await deleteBatch.commit();
    console.log('Successfully deleted all records from expenses collection');

    console.log('Migration completed successfully!');
    return true;

  } catch (error) {
    console.error('Error during migration:', error);
    return false;
  }
};

export const verifyMigration = async (): Promise<{ success: boolean; expensesCount: number; purchaseRecordsCount: number }> => {
  try {
    const expensesSnapshot = await getDocs(collection(db, 'expenses'));
    const purchaseRecordsSnapshot = await getDocs(collection(db, 'purchase_records'));

    const expensesCount = expensesSnapshot.docs.length;
    const purchaseRecordsCount = purchaseRecordsSnapshot.docs.length;

    console.log(`Verification - Expenses: ${expensesCount}, Purchase Records: ${purchaseRecordsCount}`);

    return {
      success: expensesCount === 0 && purchaseRecordsCount > 0,
      expensesCount,
      purchaseRecordsCount
    };
  } catch (error) {
    console.error('Error during verification:', error);
    return { success: false, expensesCount: -1, purchaseRecordsCount: -1 };
  }
};
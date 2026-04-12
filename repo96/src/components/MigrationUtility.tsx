import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { migrateExpensesToPurchaseRecords, verifyMigration } from '@/lib/expensesToPurchaseRecordsMigration';

export const MigrationUtility: React.FC = () => {
  const [migrating, setMigrating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [migrationResult, setMigrationResult] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const handleMigration = async () => {
    setMigrating(true);
    setMigrationResult(null);
    
    try {
      const success = await migrateExpensesToPurchaseRecords();
      if (success) {
        setMigrationResult('Migration completed successfully!');
      } else {
        setMigrationResult('Migration failed. Check console for details.');
      }
    } catch (error) {
      setMigrationResult(`Migration error: ${error}`);
    } finally {
      setMigrating(false);
    }
  };

  const handleVerification = async () => {
    setVerifying(true);
    
    try {
      const result = await verifyMigration();
      setVerificationResult(result);
    } catch (error) {
      setVerificationResult({ success: false, error: error.toString() });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Expenses to Purchase Records Migration</CardTitle>
        <CardDescription>
          Migrate all data from the expenses collection to the new purchase_records collection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button 
            onClick={handleMigration} 
            disabled={migrating}
            className="w-full"
          >
            {migrating ? 'Migrating...' : 'Start Migration'}
          </Button>
          
          <Button 
            onClick={handleVerification} 
            disabled={verifying}
            variant="outline"
            className="w-full"
          >
            {verifying ? 'Verifying...' : 'Verify Migration'}
          </Button>
        </div>

        {migrationResult && (
          <Alert>
            <AlertDescription>{migrationResult}</AlertDescription>
          </Alert>
        )}

        {verificationResult && (
          <Alert>
            <AlertDescription>
              <div>
                <div>Migration Status: {verificationResult.success ? 'SUCCESS' : 'INCOMPLETE'}</div>
                <div>Expenses remaining: {verificationResult.expensesCount}</div>
                <div>Purchase records: {verificationResult.purchaseRecordsCount}</div>
                {verificationResult.error && <div>Error: {verificationResult.error}</div>}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
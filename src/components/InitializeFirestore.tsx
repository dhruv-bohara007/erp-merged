
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { initializeCollections } from '@/lib/initializeFirestore';
import { Database, CheckCircle, AlertCircle } from 'lucide-react';

const InitializeFirestore = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInitialize = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await initializeCollections();
      if (success) {
        setIsInitialized(true);
      } else {
        setError('Failed to initialize collections');
      }
    } catch (err) {
      setError('Error initializing Firestore: ' + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Initialize Firestore Collections
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600 text-sm">
          Click the button below to create all Firestore collections with sample data for your invoice management system.
        </p>
        
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        
        {isInitialized && (
          <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Collections initialized successfully!</span>
          </div>
        )}
        
        <Button 
          onClick={handleInitialize} 
          disabled={isLoading || isInitialized}
          className="w-full"
        >
          {isLoading ? 'Initializing...' : isInitialized ? 'Initialized' : 'Initialize Collections'}
        </Button>
        
        <div className="text-xs text-gray-500">
          <p>This will create the following collections:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>companies</li>
            <li>clients</li>
            <li>invoices</li>
            <li>payments</li>
            <li>gst_returns</li>
            <li>tds_records</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default InitializeFirestore;

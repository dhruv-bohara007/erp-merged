
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { TestTube } from 'lucide-react';
import { useSampleData } from '@/contexts/SampleDataContext';

const SampleDataToggle = () => {
  const { showSampleData, toggleSampleData } = useSampleData();

  return (
    <Card className="mb-6 bg-amber-50 border-amber-200">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <TestTube className="w-5 h-5 text-amber-600" />
          <div className="flex items-center space-x-2">
            <Switch
              id="sample-data-toggle"
              checked={showSampleData}
              onCheckedChange={toggleSampleData}
            />
            <Label htmlFor="sample-data-toggle" className="text-sm font-medium text-amber-800">
              Show Sample Data
            </Label>
          </div>
          <span className="text-xs text-amber-600">
            {showSampleData ? 'Displaying mock data for testing' : 'Showing real Firestore data'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default SampleDataToggle;

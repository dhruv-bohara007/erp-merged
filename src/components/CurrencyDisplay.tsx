
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface CurrencyDisplayProps {
  amountINR: number;
  className?: string;
  showOriginal?: boolean;
}

const CurrencyDisplay = ({ amountINR, className = '', showOriginal = false }: CurrencyDisplayProps) => {
  const { displayCurrency, convertFromINR, getCurrencySymbol } = useCurrency();
  const [convertedData, setConvertedData] = useState<{
    amount: number;
    isLive: boolean;
    error?: string;
    timestamp: Date;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const performConversion = async () => {
      if (displayCurrency === 'INR') {
        setConvertedData({
          amount: amountINR,
          isLive: true,
          timestamp: new Date()
        });
        return;
      }

      setLoading(true);
      try {
        const result = await convertFromINR(amountINR, displayCurrency);
        setConvertedData({
          amount: result.convertedAmount,
          isLive: result.isLive,
          error: result.error,
          timestamp: result.timestamp
        });
      } catch (error) {
        console.error('Conversion failed:', error);
        setConvertedData({
          amount: amountINR,
          isLive: false,
          error: 'Conversion failed',
          timestamp: new Date()
        });
      } finally {
        setLoading(false);
      }
    };

    performConversion();
  }, [amountINR, displayCurrency, convertFromINR]);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-gray-500">Converting...</span>
      </div>
    );
  }

  if (!convertedData) {
    return (
      <span className={className}>
        ₹{amountINR.toFixed(2)}
      </span>
    );
  }

  const symbol = getCurrencySymbol(displayCurrency);
  const formattedAmount = `${symbol}${convertedData.amount.toFixed(2)}`;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span>{formattedAmount}</span>
      
      {convertedData.error && (
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <Badge variant="outline" className="text-xs text-yellow-600">
            {convertedData.error.includes('cached') ? 'Cached' : 'Fallback'}
          </Badge>
        </div>
      )}
      
      {!convertedData.isLive && !convertedData.error && (
        <Badge variant="outline" className="text-xs text-blue-600">
          Cached
        </Badge>
      )}
      
      {showOriginal && displayCurrency !== 'INR' && (
        <span className="text-sm text-gray-500">
          (₹{amountINR.toFixed(2)})
        </span>
      )}
      
      {convertedData.error?.includes('original') && (
        <Badge variant="outline" className="text-xs text-red-600">
          Displaying original INR values
        </Badge>
      )}
    </div>
  );
};

export default CurrencyDisplay;

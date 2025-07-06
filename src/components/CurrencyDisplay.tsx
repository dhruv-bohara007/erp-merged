
import { useCurrency } from '@/contexts/CurrencyContext';
import { Loader2 } from 'lucide-react';

interface CurrencyDisplayProps {
  amount: number;
  className?: string;
  showOriginal?: boolean;
}

const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({ 
  amount, 
  className = '', 
  showOriginal = false 
}) => {
  const { selectedCurrency, isLoading, formatAmount } = useCurrency();

  if (isLoading && selectedCurrency !== 'INR') {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <Loader2 className="h-3 w-3 animate-spin" />
        Converting...
      </span>
    );
  }

  const displayAmount = formatAmount(amount);
  
  return (
    <span className={className}>
      {displayAmount}
      {showOriginal && selectedCurrency !== 'INR' && (
        <span className="text-xs text-gray-500 ml-1">
          (₹{amount.toLocaleString()})
        </span>
      )}
    </span>
  );
};

export default CurrencyDisplay;

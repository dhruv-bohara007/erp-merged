
import { Card, CardContent } from '@/components/ui/card';
import { IndianRupee, Calendar } from 'lucide-react';
import { Payment } from '@/hooks/useFirestore';

interface PaymentSummaryCardsProps {
  payments: Payment[];
}

const PaymentSummaryCards = ({ payments }: PaymentSummaryCardsProps) => {
  const totalReceived = payments.filter(p => p.status === 'completed').reduce((sum, payment) => sum + payment.amount, 0);
  const pendingAmount = payments.filter(p => p.status === 'pending').reduce((sum, payment) => sum + payment.amount, 0);

  // Calculate this month's payments
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const thisMonthPayments = payments
    .filter(payment => {
      const paymentDate = payment.paymentDate;
      return paymentDate.getMonth() === currentMonth && 
             paymentDate.getFullYear() === currentYear &&
             payment.status === 'completed';
    })
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Received</p>
              <p className="text-2xl font-bold text-green-600">₹{totalReceived.toLocaleString()}</p>
            </div>
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <IndianRupee className="h-4 w-4 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">₹{pendingAmount.toLocaleString()}</p>
            </div>
            <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <Calendar className="h-4 w-4 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold">₹{thisMonthPayments.toLocaleString()}</p>
            </div>
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSummaryCards;

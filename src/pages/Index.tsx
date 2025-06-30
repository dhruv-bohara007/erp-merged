
import Dashboard from '@/components/Dashboard';
import Navigation from '@/components/Navigation';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="lg:pl-64">
        <Dashboard />
      </div>
    </div>
  );
};

export default Index;

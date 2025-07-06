
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';
import Dashboard from '@/pages/Dashboard';
import SuperDashboard from '@/pages/SuperDashboard';
import InvoiceForm from '@/components/InvoiceForm';
import InvoiceList from '@/components/InvoiceList';
import ClientManagement from '@/components/ClientManagement';
import Payments from '@/components/Payments';
import ExpenseManagement from '@/components/ExpenseManagement';
import InventoryManagement from '@/components/InventoryManagement';
import Reports from '@/components/Reports';
import ProfitabilityReports from '@/components/ProfitabilityReports';
import Settings from '@/components/Settings';
import AdminNavigation from '@/components/AdminNavigation';
import InitializeFirestore from '@/components/InitializeFirestore';
import { useAuth } from '@/contexts/AuthContext';

const queryClient = new QueryClient();

const AuthenticatedApp = () => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <div>Loading...</div>;
  }

  const isAdmin = currentUser.role === 'company_admin' || currentUser.role === 'super_admin';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {isAdmin && <AdminNavigation />}
      <div className={isAdmin ? "lg:pl-64" : ""}>
        <Routes>
          <Route path="/" element={<Navigate to="/admin-dashboard" replace />} />
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/super-dashboard" 
            element={
              <ProtectedRoute>
                <SuperDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/invoices/new" 
            element={
              <ProtectedRoute>
                <InvoiceForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/invoices" 
            element={
              <ProtectedRoute>
                <InvoiceList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/clients" 
            element={
              <ProtectedRoute>
                <ClientManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/payments" 
            element={
              <ProtectedRoute>
                <Payments />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/expenses" 
            element={
              <ProtectedRoute>
                <ExpenseManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/inventory" 
            element={
              <ProtectedRoute>
                <InventoryManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profitability" 
            element={
              <ProtectedRoute>
                <ProfitabilityReports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CurrencyProvider>
            <Router>
              <InitializeFirestore />
              <Routes>
                <Route path="/login" element={<LoginForm />} />
                <Route path="/register" element={<RegisterForm />} />
                <Route path="/*" element={<AuthenticatedApp />} />
              </Routes>
              <Toaster />
            </Router>
          </CurrencyProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

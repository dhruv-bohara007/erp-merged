
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';
import CompanySignupForm from '@/components/CompanySignupForm';
import Dashboard from '@/pages/Dashboard';
import SuperDashboard from '@/pages/SuperDashboard';
import InvoiceForm from '@/components/InvoiceForm';
import InvoiceList from '@/components/InvoiceList';
import InvoiceView from '@/components/InvoiceView';
import ClientManagement from '@/components/ClientManagement';
import Payments from '@/components/Payments';
import Reports from '@/components/Reports';
import Settings from '@/components/Settings';
import NotFound from '@/pages/NotFound';
import AdminNavigation from '@/components/AdminNavigation';
import Navigation from '@/components/Navigation';
import { Toaster } from '@/components/ui/toaster';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CurrencyProvider>
            <Router>
              <div className="min-h-screen bg-gray-50">
                <Routes>
                  <Route path="/login" element={<LoginForm />} />
                  <Route path="/register" element={<RegisterForm />} />
                  <Route path="/company-signup" element={<CompanySignupForm />} />
                  <Route
                    path="/admin-dashboard"
                    element={
                      <ProtectedRoute requiredRole="super_admin">
                        <div className="flex">
                          <AdminNavigation />
                          <div className="flex-1 lg:ml-64">
                            <SuperDashboard />
                          </div>
                        </div>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <div className="flex">
                          <Navigation />
                          <div className="flex-1 lg:ml-64">
                            <Routes>
                              <Route path="/" element={<Dashboard />} />
                              <Route path="/invoices" element={<InvoiceList />} />
                              <Route path="/invoices/new" element={<InvoiceForm />} />
                              <Route path="/invoices/:id" element={<InvoiceView />} />
                              <Route path="/clients" element={<ClientManagement />} />
                              <Route path="/payments" element={<Payments />} />
                              <Route path="/reports" element={<Reports />} />
                              <Route path="/settings" element={<Settings />} />
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </div>
                        </div>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
                <Toaster />
              </div>
            </Router>
          </CurrencyProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

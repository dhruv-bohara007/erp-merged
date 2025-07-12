import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AdminDashboard from './pages/AdminDashboard';
import Dashboard from './pages/Dashboard';
import InvoicesPage from './pages/InvoicesPage';
import ClientsPage from './pages/ClientsPage';
import PaymentsPage from './pages/PaymentsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import CompanyProfilePage from './pages/CompanyProfilePage';
import InventoryPage from './pages/InventoryPage';
import ProfitabilityPage from './pages/ProfitabilityPage';
import InvoiceView from './pages/InvoiceView';
import ClientView from './pages/ClientView';
import PaymentView from './pages/PaymentView';
import CreateInvoice from './pages/CreateInvoice';
import RecordPayment from './pages/RecordPayment';
import RequireAuth from './components/RequireAuth';
import { checkAuthentication } from './utils/auth';
import PurchaseManagement from './components/PurchaseManagement';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  const { setCurrentUser, setAuthLoading } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      setAuthLoading(true);
      const user = await checkAuthentication();
      if (user) {
        setCurrentUser(user);
      }
      setAuthLoading(false);
    };

    checkAuth();
  }, [setCurrentUser, setAuthLoading]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegistrationPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Admin Routes */}
      <Route path="/admin-dashboard" element={<RequireAuth roles={['admin']}><AdminDashboard /></RequireAuth>} />
      <Route path="/company-profile" element={<RequireAuth roles={['admin']}><CompanyProfilePage /></RequireAuth>} />
      <Route path="/inventory" element={<RequireAuth roles={['admin']}><InventoryPage /></RequireAuth>} />
      <Route path="/profitability" element={<RequireAuth roles={['admin']}><ProfitabilityPage /></RequireAuth>} />
       <Route path="/purchases" element={<RequireAuth roles={['admin']}><PurchaseManagement /></RequireAuth>} />

      {/* Common Routes - Accessible to both 'admin' and 'user' */}
      <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/invoices" element={<RequireAuth><InvoicesPage /></RequireAuth>} />
      <Route path="/invoices/:invoiceId" element={<RequireAuth><InvoiceView /></RequireAuth>} />
      <Route path="/clients" element={<RequireAuth><ClientsPage /></RequireAuth>} />
      <Route path="/clients/:clientId" element={<RequireAuth><ClientView /></RequireAuth>} />
      <Route path="/payments" element={<RequireAuth><PaymentsPage /></RequireAuth>} />
      <Route path="/payments/:paymentId" element={<RequireAuth><PaymentView /></RequireAuth>} />
      <Route path="/reports" element={<RequireAuth><ReportsPage /></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
      <Route path="/create-invoice" element={<RequireAuth><CreateInvoice /></RequireAuth>} />
      <Route path="/record-payment/:invoiceId" element={<RequireAuth><RecordPayment /></RequireAuth>} />

      {/* Redirect unauthenticated users to login page */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default App;

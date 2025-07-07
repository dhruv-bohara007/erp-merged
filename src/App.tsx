import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";
import Index from "./pages/Index";
import SuperDashboard from "./pages/SuperDashboard";
import InvoiceForm from "./components/InvoiceForm";
import InvoiceList from "./components/InvoiceList";
import ClientManagement from "./components/ClientManagement";
import Payments from "./components/Payments";
import Reports from "./components/Reports";
import Settings from "./components/Settings";
import AdminNavigation from "./components/AdminNavigation";
import NotFound from "./pages/NotFound";
import ExpenseManagement from "./components/ExpenseManagement";
import InventoryManagement from "./components/InventoryManagement";
import ProfitabilityReports from "./components/ProfitabilityReports";
import CompanySignupForm from "./components/CompanySignupForm";

const queryClient = new QueryClient();

const AuthenticatedApp = () => {
  const { currentUser } = useAuth();

  console.log('Current user:', currentUser);
  console.log('Has completed setup:', currentUser?.hasCompletedSetup);

  // If user is authenticated but on login/register page, redirect to their dashboard
  const getDefaultRedirect = () => {
    if (!currentUser) return '/login';
    
    // If company admin hasn't completed setup, redirect to company signup
    if (currentUser.role === 'company_admin' && !currentUser.hasCompletedSetup) {
      return '/company-setup';
    }
    
    const roleRedirects = {
      company_admin: '/admin-dashboard',
      super_admin: '/super-dashboard'
    };
    
    return roleRedirects[currentUser.role || 'company_admin'];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={
          currentUser ? <Navigate to={getDefaultRedirect()} replace /> : <LoginForm />
        } />
        <Route path="/register" element={
          currentUser ? <Navigate to={getDefaultRedirect()} replace /> : <RegisterForm />
        } />

        {/* Company Setup Route - only for authenticated company admins who haven't completed setup */}
        <Route path="/company-setup" element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            {currentUser && !currentUser.hasCompletedSetup ? (
              <CompanySignupForm />
            ) : (
              <Navigate to="/admin-dashboard" replace />
            )}
          </ProtectedRoute>
        } />

        {/* Super Admin Dashboard */}
        <Route path="/super-dashboard" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperDashboard />
          </ProtectedRoute>
        } />

        {/* Company Admin routes - redirect to setup if not completed */}
        <Route path="/admin-dashboard" element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            {currentUser?.hasCompletedSetup ? (
              <div>
                <AdminNavigation />
                <div className="lg:pl-64">
                  <Index />
                </div>
              </div>
            ) : (
              <Navigate to="/company-setup" replace />
            )}
          </ProtectedRoute>
        } />
        
        <Route path="/invoices" element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            {currentUser?.hasCompletedSetup ? (
              <div>
                <AdminNavigation />
                <div className="lg:pl-64">
                  <InvoiceList />
                </div>
              </div>
            ) : (
              <Navigate to="/company-setup" replace />
            )}
          </ProtectedRoute>
        } />
        
        <Route path="/invoices/new" element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            {currentUser?.hasCompletedSetup ? (
              <div>
                <AdminNavigation />
                <div className="lg:pl-64">
                  <InvoiceForm />
                </div>
              </div>
            ) : (
              <Navigate to="/company-setup" replace />
            )}
          </ProtectedRoute>
        } />

        <Route path="/invoices/edit/:id" element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            {currentUser?.hasCompletedSetup ? (
              <div>
                <AdminNavigation />
                <div className="lg:pl-64">
                  <InvoiceForm />
                </div>
              </div>
            ) : (
              <Navigate to="/company-setup" replace />
            )}
          </ProtectedRoute>
        } />
        
        <Route path="/clients" element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            {currentUser?.hasCompletedSetup ? (
              <div>
                <AdminNavigation />
                <div className="lg:pl-64">
                  <ClientManagement />
                </div>
              </div>
            ) : (
              <Navigate to="/company-setup" replace />
            )}
          </ProtectedRoute>
        } />
        
        <Route path="/payments" element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            {currentUser?.hasCompletedSetup ? (
              <div>
                <AdminNavigation />
                <div className="lg:pl-64">
                  <Payments />
                </div>
              </div>
            ) : (
              <Navigate to="/company-setup" replace />
            )}
          </ProtectedRoute>
        } />
        
        <Route path="/reports" element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            {currentUser?.hasCompletedSetup ? (
              <div>
                <AdminNavigation />
                <div className="lg:pl-64">
                  <Reports />
                </div>
              </div>
            ) : (
              <Navigate to="/company-setup" replace />
            )}
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            {currentUser?.hasCompletedSetup ? (
              <div>
                <AdminNavigation />
                <div className="lg:pl-64">
                  <Settings />
                </div>
              </div>
            ) : (
              <Navigate to="/company-setup" replace />
            )}
          </ProtectedRoute>
        } />

        <Route path="/expenses" element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            {currentUser?.hasCompletedSetup ? (
              <div>
                <AdminNavigation />
                <div className="lg:pl-64">
                  <ExpenseManagement />
                </div>
              </div>
            ) : (
              <Navigate to="/company-setup" replace />
            )}
          </ProtectedRoute>
        } />

        <Route path="/inventory" element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            {currentUser?.hasCompletedSetup ? (
              <div>
                <AdminNavigation />
                <div className="lg:pl-64">
                  <InventoryManagement />
                </div>
              </div>
            ) : (
              <Navigate to="/company-setup" replace />
            )}
          </ProtectedRoute>
        } />

        <Route path="/profitability" element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            {currentUser?.hasCompletedSetup ? (
              <div>
                <AdminNavigation />
                <div className="lg:pl-64">
                  <ProfitabilityReports />
                </div>
              </div>
            ) : (
              <Navigate to="/company-setup" replace />
            )}
          </ProtectedRoute>
        } />

        {/* Root redirect - Always redirect to login if no user */}
        <Route path="/" element={
          <Navigate to={currentUser ? getDefaultRedirect() : "/login"} replace />
        } />

        {/* 404 page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <AuthenticatedApp />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

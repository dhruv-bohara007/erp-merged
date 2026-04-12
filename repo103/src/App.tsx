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
import PasswordResetForm from "@/components/PasswordResetForm";
import Index from "./pages/Index";
import SuperDashboard from "./pages/SuperDashboard";
import InvoiceForm from "./components/InvoiceForm";
import InvoiceList from "./components/InvoiceList";
import ClientManagement from "./components/ClientManagement";
import SupplierManagement from "./components/SupplierManagement";
import Payments from "./components/Payments";
import Reports from "./components/Reports";
import Settings from "./components/Settings";
import AdminNavigation from "./components/AdminNavigation";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import ExpenseManagement from "./components/ExpenseManagement";
import InventoryManagement from "./components/InventoryManagement";
import ProfitabilityReports from "./components/ProfitabilityReports";
import CompanySignupForm from "./components/CompanySignupForm";
import PurchaseManagement from "./components/PurchaseManagement";
import PurchaseForm from "./components/PurchaseForm";
import PaymentSyncProvider from "./components/PaymentSyncProvider";
import EmployeeManagement from "./components/EmployeeManagement";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import EmployeeNavigation from "./components/EmployeeNavigation";
import EmployeeInventory from "./components/EmployeeInventory";
import EmployeePurchases from "./components/EmployeePurchases";
import StockDetails from "./components/StockDetails";
import PurchaseRequests from "./components/PurchaseRequests";
import PurchaseRequestsAdmin from "./components/PurchaseRequestsAdmin";
import PurchaseCreationForm from "./components/PurchaseCreationForm";

const queryClient = new QueryClient();

const AuthenticatedApp = () => {
  const { currentUser } = useAuth();

  // Always redirect to login if not authenticated
  const getDefaultRedirect = () => {
    if (!currentUser) return '/login';
    
    // If company admin hasn't completed setup, redirect to company signup
    if (currentUser.role === 'company_admin' && !currentUser.hasCompletedSetup) {
      return '/company-setup';
    }
    
    const roleRedirects = {
      company_admin: '/admin-dashboard',
      super_admin: '/super-dashboard',
      employee: '/employee-dashboard'
    };
    
    return roleRedirects[currentUser.role || 'company_admin'];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Routes>
        {/* Public routes - Always accessible */}
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/password-reset" element={<PasswordResetForm />} />

        {/* Company Setup Route - Only for authenticated company admins */}
        <Route path="/company-setup" element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            <CompanySignupForm />
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
        
        <Route path="/suppliers" element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            {currentUser?.hasCompletedSetup ? (
              <div>
                <AdminNavigation />
                <div className="lg:pl-64">
                  <SupplierManagement />
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

        <Route path="/purchases" element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            {currentUser?.hasCompletedSetup ? (
              <div>
                <AdminNavigation />
                <div className="lg:pl-64">
                  {(() => {
                    const urlParams = new URLSearchParams(window.location.search);
                    const section = urlParams.get('section');
                    if (section === 'purchase-requests') {
                      return <PurchaseRequestsAdmin />;
                    }
                    return <PurchaseManagement />;
                  })()}
                </div>
              </div>
            ) : (
              <Navigate to="/company-setup" replace />
            )}
          </ProtectedRoute>
        } />

        <Route path="/add-purchase" element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            {currentUser?.hasCompletedSetup ? (
              <div>
                <AdminNavigation />
                <div className="lg:pl-64">
                  <PurchaseForm />
                </div>
              </div>
            ) : (
              <Navigate to="/company-setup" replace />
            )}
          </ProtectedRoute>
        } />

        <Route path="/create-purchase-order" element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            {currentUser?.hasCompletedSetup ? (
              <div>
                <AdminNavigation />
                <div className="lg:pl-64">
                  <PurchaseCreationForm />
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

        <Route path="/employees" element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            {currentUser?.hasCompletedSetup ? (
              <div>
                <AdminNavigation />
                <div className="lg:pl-64">
                  <EmployeeManagement />
                </div>
              </div>
            ) : (
              <Navigate to="/company-setup" replace />
            )}
          </ProtectedRoute>
        } />

        <Route path="/stock-details" element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            {currentUser?.hasCompletedSetup ? (
              <div>
                <AdminNavigation />
                <div className="lg:pl-64">
                  <StockDetails />
                </div>
              </div>
            ) : (
              <Navigate to="/company-setup" replace />
            )}
          </ProtectedRoute>
        } />

        {/* Employee routes */}
        <Route path="/employee-dashboard" element={
          <ProtectedRoute allowedRoles={['employee']}>
            <div>
              <EmployeeNavigation />
              <div className="lg:pl-64">
                <EmployeeDashboard />
              </div>
            </div>
          </ProtectedRoute>
        } />

        <Route path="/employee-inventory" element={
          <ProtectedRoute allowedRoles={['employee']}>
            <div>
              <EmployeeNavigation />
              <div className="lg:pl-64">
                <EmployeeInventory />
              </div>
            </div>
          </ProtectedRoute>
        } />

        <Route path="/employee-purchases" element={
          <ProtectedRoute allowedRoles={['employee']}>
            <div>
              <EmployeeNavigation />
              <div className="lg:pl-64">
                <EmployeePurchases />
              </div>
            </div>
          </ProtectedRoute>
        } />

        <Route path="/employee-alerts" element={
          <ProtectedRoute allowedRoles={['employee']}>
            <div>
              <EmployeeNavigation />
              <div className="lg:pl-64">
                <EmployeeDashboard />
              </div>
            </div>
          </ProtectedRoute>
        } />

        {/* Root redirect - Always go to login first */}
        <Route path="/" element={<Navigate to="/landing" replace />} />


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
            <PaymentSyncProvider>
              <AuthenticatedApp />
            </PaymentSyncProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

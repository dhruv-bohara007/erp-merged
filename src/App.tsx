
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";
import Index from "./pages/Index";
import ClientDashboard from "./pages/ClientDashboard";
import SuperDashboard from "./pages/SuperDashboard";
import InvoiceForm from "./components/InvoiceForm";
import InvoiceList from "./components/InvoiceList";
import ClientManagement from "./components/ClientManagement";
import Payments from "./components/Payments";
import Reports from "./components/Reports";
import Settings from "./components/Settings";
import AdminNavigation from "./components/AdminNavigation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AuthenticatedApp = () => {
  const { currentUser } = useAuth();

  // If user is authenticated but on login/register page, redirect to their dashboard
  const getDefaultRedirect = () => {
    if (!currentUser) return '/login';
    
    const roleRedirects = {
      client: '/client-dashboard',
      company_admin: '/admin-dashboard',
      super_admin: '/super-dashboard'
    };
    
    return roleRedirects[currentUser.role || 'client'];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={
          currentUser ? <Navigate to={getDefaultRedirect()} replace /> : <LoginForm />
        } />
        <Route path="/register" element={
          currentUser ? <Navigate to={getDefaultRedirect()} replace /> : <RegisterForm />
        } />

        {/* Client Dashboard */}
        <Route path="/client-dashboard" element={
          <ProtectedRoute allowedRoles={['client']}>
            <ClientDashboard />
          </ProtectedRoute>
        } />

        {/* Super Admin Dashboard */}
        <Route path="/super-dashboard" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperDashboard />
          </ProtectedRoute>
        } />

        {/* Company Admin routes - using single AdminNavigation */}
        <Route path="/admin-dashboard" element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            <div>
              <AdminNavigation />
              <div className="lg:pl-64">
                <Index />
              </div>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/invoices" element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            <div>
              <AdminNavigation />
              <div className="lg:pl-64">
                <InvoiceList />
              </div>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/invoices/new" element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            <div>
              <AdminNavigation />
              <div className="lg:pl-64">
                <InvoiceForm />
              </div>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/clients" element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            <div>
              <AdminNavigation />
              <div className="lg:pl-64">
                <ClientManagement />
              </div>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/payments" element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            <div>
              <AdminNavigation />
              <div className="lg:pl-64">
                <Payments />
              </div>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/reports" element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            <div>
              <AdminNavigation />
              <div className="lg:pl-64">
                <Reports />
              </div>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            <div>
              <AdminNavigation />
              <div className="lg:pl-64">
                <Settings />
              </div>
            </div>
          </ProtectedRoute>
        } />

        {/* Root redirect */}
        <Route path="/" element={
          currentUser ? (
            <Navigate to={getDefaultRedirect()} replace />
          ) : (
            <Navigate to="/login" replace />
          )
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
        <AuthProvider>
          <AuthenticatedApp />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

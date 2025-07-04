
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navigation from "@/components/Navigation";
import AdminNavigation from "@/components/AdminNavigation";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import SuperDashboard from "./pages/SuperDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import InvoiceList from "@/components/InvoiceList";
import InvoiceForm from "@/components/InvoiceForm";
import ClientManagement from "@/components/ClientManagement";
import Payments from "@/components/Payments";
import Reports from "@/components/Reports";
import ProfitabilityReports from "@/components/ProfitabilityReports";
import ExpenseManagement from "@/components/ExpenseManagement";
import InventoryManagement from "@/components/InventoryManagement";
import Settings from "@/components/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CurrencyProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                <Route path="/login" element={<LoginForm />} />
                <Route path="/register" element={<RegisterForm />} />
                
                {/* Protected Routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Navigation />
                    <Index />
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Navigation />
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/super-dashboard" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminNavigation />
                    <SuperDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/client-dashboard" element={
                  <ProtectedRoute allowedRoles={['client']}>
                    <Navigation />
                    <ClientDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/invoices" element={
                  <ProtectedRoute>
                    <Navigation />
                    <InvoiceList />
                  </ProtectedRoute>
                } />
                
                <Route path="/invoices/new" element={
                  <ProtectedRoute>
                    <Navigation />
                    <InvoiceForm />
                  </ProtectedRoute>
                } />
                
                <Route path="/clients" element={
                  <ProtectedRoute>
                    <Navigation />
                    <ClientManagement />
                  </ProtectedRoute>
                } />
                
                <Route path="/payments" element={
                  <ProtectedRoute>
                    <Navigation />
                    <Payments />
                  </ProtectedRoute>
                } />
                
                <Route path="/reports" element={
                  <ProtectedRoute>
                    <Navigation />
                    <Reports />
                  </ProtectedRoute>
                } />
                
                <Route path="/profitability" element={
                  <ProtectedRoute>
                    <Navigation />
                    <ProfitabilityReports />
                  </ProtectedRoute>
                } />
                
                <Route path="/expenses" element={
                  <ProtectedRoute>
                    <Navigation />
                    <ExpenseManagement />
                  </ProtectedRoute>
                } />
                
                <Route path="/inventory" element={
                  <ProtectedRoute>
                    <Navigation />
                    <InventoryManagement />
                  </ProtectedRoute>
                } />
                
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Navigation />
                    <Settings />
                  </ProtectedRoute>
                } />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </CurrencyProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

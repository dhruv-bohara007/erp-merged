import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from '@/components/ui/sonner';
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import SuperDashboard from '@/pages/SuperDashboard';
import NotFound from '@/pages/NotFound';
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';
import ProtectedRoute from '@/components/ProtectedRoute';
import PurchaseManagement from '@/components/PurchaseManagement';
import PurchaseForm from '@/components/PurchaseForm';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-dashboard"
              element={
                <ProtectedRoute requireSuperAdmin={true}>
                  <SuperDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchase-management"
              element={
                <ProtectedRoute>
                  <PurchaseManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-purchase"
              element={
                <ProtectedRoute>
                  <PurchaseForm />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;

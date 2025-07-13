
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navigation from '@/components/Navigation';
import Dashboard from '@/pages/Dashboard';
import Index from '@/pages/Index';
import SuperDashboard from '@/pages/SuperDashboard';
import NotFound from '@/pages/NotFound';
import PaymentSyncProvider from '@/components/PaymentSyncProvider';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <PaymentSyncProvider>
            <Router>
              <div className="min-h-screen bg-background">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Navigation />
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/super-dashboard"
                    element={
                      <ProtectedRoute>
                        <Navigation />
                        <SuperDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <Navigation />
                        <Routes>
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
                <Toaster />
              </div>
            </Router>
          </PaymentSyncProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

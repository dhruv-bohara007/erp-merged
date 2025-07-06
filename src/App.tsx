
import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { Toaster } from '@/components/ui/toaster';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navigation from '@/components/Navigation';
import AdminNavigation from '@/components/AdminNavigation';
import InitializeFirestore from '@/components/InitializeFirestore';

// Lazy load components
const Index = lazy(() => import('@/pages/Index'));
const SuperDashboard = lazy(() => import('@/pages/SuperDashboard'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CurrencyProvider>
            <Router>
              <div className="min-h-screen bg-gray-50">
                <InitializeFirestore />
                <Routes>
                  {/* Super Admin Dashboard */}
                  <Route 
                    path="/super-admin" 
                    element={
                      <ProtectedRoute>
                        <AdminNavigation />
                        <Suspense fallback={<div>Loading...</div>}>
                          <SuperDashboard />
                        </Suspense>
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Main App Routes */}
                  <Route 
                    path="/*" 
                    element={
                      <ProtectedRoute>
                        <Navigation />
                        <Suspense fallback={<div>Loading...</div>}>
                          <Index />
                        </Suspense>
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* 404 Page */}
                  <Route 
                    path="/404" 
                    element={
                      <Suspense fallback={<div>Loading...</div>}>
                        <NotFound />
                      </Suspense>
                    } 
                  />
                  
                  {/* Redirect unknown routes to 404 */}
                  <Route path="*" element={<Navigate to="/404" replace />} />
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

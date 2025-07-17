import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import UpdateProfilePage from './pages/UpdateProfilePage';
import Dashboard from './pages/Dashboard';
import SuperDashboard from './pages/SuperDashboard';
import CompanyDashboard from './pages/CompanyDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import Clients from './pages/Clients';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Inventory from './pages/Inventory';
import StockDetails from './pages/StockDetails';
import Purchases from './pages/Purchases';
import Suppliers from './pages/Suppliers';
import Employees from './pages/Employees';
import CompanyProfile from './pages/CompanyProfile';
import Settings from './pages/Settings';
import AdminNavigation from './components/AdminNavigation';
import EmployeeInventory from './components/EmployeeInventory';
import PurchaseRequests from './components/PurchaseRequests';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/update-profile" element={<PrivateRoute><UpdateProfilePage /></PrivateRoute>} />
          <Route path="/super-dashboard" element={<PrivateRoute role="super_admin"><SuperDashboard /></PrivateRoute>} />
          <Route path="/employee-dashboard" element={<PrivateRoute role="employee"><EmployeeDashboard /></PrivateRoute>} />
          <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

function DashboardLayout() {
  const { currentUser } = useAuth();
  const location = useLocation();

  // Determine the base path for the dashboard based on user role
  let basePath = "/dashboard";
  if (currentUser?.role === 'super_admin') {
    basePath = "/super-dashboard";
  } else if (currentUser?.role === 'employee') {
    basePath = "/employee-dashboard";
  }

  // Redirect to the appropriate dashboard if at the root path
  if (location.pathname === "/") {
    if (currentUser?.role === 'super_admin') {
      return <Navigate to="/super-dashboard" replace />;
    } else if (currentUser?.role === 'employee') {
      return <Navigate to="/employee-dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  if (currentUser?.role === 'company_admin') {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex h-screen">
          <div className="w-64 bg-white border-r border-gray-200">
            <AdminNavigation />
          </div>
          <div className="flex-1 overflow-x-hidden overflow-y-auto p-4">
            <Routes>
              <Route path="/dashboard" element={<PrivateRoute role="company_admin"><CompanyDashboard /></PrivateRoute>} />
              <Route path="/dashboard/clients" element={<PrivateRoute role="company_admin"><Clients /></PrivateRoute>} />
              <Route path="/dashboard/invoices" element={<PrivateRoute role="company_admin"><Invoices /></PrivateRoute>} />
              <Route path="/dashboard/payments" element={<PrivateRoute role="company_admin"><Payments /></PrivateRoute>} />
              <Route path="/dashboard/reports" element={<PrivateRoute role="company_admin"><Reports /></PrivateRoute>} />
              <Route path="/dashboard/inventory" element={<PrivateRoute role="company_admin"><Inventory /></PrivateRoute>} />
              <Route path="/dashboard/stock-details" element={<PrivateRoute role="company_admin"><StockDetails /></PrivateRoute>} />
              <Route path="/dashboard/purchases" element={<PrivateRoute role="company_admin"><Purchases /></PrivateRoute>} />
              <Route path="/dashboard/suppliers" element={<PrivateRoute role="company_admin"><Suppliers /></PrivateRoute>} />
              <Route path="/dashboard/employees" element={<PrivateRoute role="company_admin"><Employees /></PrivateRoute>} />
              <Route path="/dashboard/company" element={<PrivateRoute role="company_admin"><CompanyProfile /></PrivateRoute>} />
              <Route path="/dashboard/settings" element={<PrivateRoute role="company_admin"><Settings /></PrivateRoute>} />
              <Route path="/dashboard/purchase-requests" element={<PurchaseRequests />} />
            </Routes>
          </div>
        </div>
      </div>
    );
  } else if (currentUser?.role === 'employee') {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex h-screen">
          <div className="flex-1 overflow-x-hidden overflow-y-auto p-4">
            <Routes>
              <Route path="/employee-dashboard" element={<PrivateRoute role="employee"><EmployeeDashboard /></PrivateRoute>} />
              <Route path="/employee-inventory" element={<PrivateRoute role="employee"><EmployeeInventory /></PrivateRoute>} />
            </Routes>
          </div>
        </div>
      </div>
    );
  } else {
    // Super Admin Layout (or default)
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex h-screen">
          <div className="w-64 bg-white border-r border-gray-200">
            <AdminNavigation />
          </div>
          <div className="flex-1 overflow-x-hidden overflow-y-auto p-4">
            <Routes>
              <Route path="/super-dashboard" element={<PrivateRoute role="super_admin"><SuperDashboard /></PrivateRoute>} />
            </Routes>
          </div>
        </div>
      </div>
    );
  }
}

function PrivateRoute({ children, role }: { children: React.ReactNode, role?: string }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (role && currentUser.role !== role) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default App;

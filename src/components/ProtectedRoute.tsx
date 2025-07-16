
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [],
  redirectTo = '/login'
}) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to={redirectTo} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role || 'company_admin')) {
    // Redirect to appropriate dashboard based on role
    const roleRedirects = {
      company_admin: '/admin-dashboard',
      super_admin: '/super-dashboard',
      employee: '/employee-dashboard'
    };
    
    return <Navigate to={roleRedirects[currentUser.role || 'company_admin']} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

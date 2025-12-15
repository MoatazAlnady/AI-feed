import React from 'react';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireEmployer?: boolean;
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  requireEmployer = false,
  fallback 
}) => {
  const { user, isAdmin, isEmployer, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return fallback || (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Authentication Required
        </h2>
        <p className="text-muted-foreground">
          Please sign in to access this feature.
        </p>
      </div>
    );
  }

  // Admin check uses role_id = 1 OR account_type = 'admin' (from AuthContext)
  if (requireAdmin && !isAdmin) {
    return fallback || (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Admin Access Required
        </h2>
        <p className="text-muted-foreground">
          You don't have permission to access this page.
        </p>
      </div>
    );
  }

  // Employer check uses company_page_id from database (from AuthContext)
  if (requireEmployer && !isEmployer) {
    return fallback || (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Employer Access Required
        </h2>
        <p className="text-muted-foreground">
          You need an employer account to access this feature.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
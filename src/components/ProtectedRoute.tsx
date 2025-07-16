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
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return fallback || (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Authentication Required
        </h2>
        <p className="text-gray-600">
          Please sign in to access this feature.
        </p>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return fallback || (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Admin Access Required
        </h2>
        <p className="text-gray-600">
          You don't have permission to access this page.
        </p>
      </div>
    );
  }

  if (requireEmployer && user.user_metadata?.account_type !== 'employer') {
    return fallback || (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Employer Access Required
        </h2>
        <p className="text-gray-600">
          You need an employer account to access this feature.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
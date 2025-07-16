import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AuthModal from '@/components/AuthModal';

const Auth = () => {
  const [showModal, setShowModal] = useState(true);
  const { user, loading } = useAuth();

  // Redirect authenticated users to home
  useEffect(() => {
    if (user && !loading) {
      // Small delay to prevent flash
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <AuthModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        initialMode="signin"
      />
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-6">Authentication</h1>
        <p className="text-muted-foreground">
          Sign in or create an account to access the AI Nexus Platform.
        </p>
      </div>
    </div>
  );
};

export default Auth;
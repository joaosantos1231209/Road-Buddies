import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, requiresVerification, appUser } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) {
      return; // Wait until loading is complete
    }
    
    if (!isAuthenticated) {
      // Not authenticated, redirect to login
      setLocation('/login');
      return;
    }
    
    if (requiresVerification) {
      // User is authenticated but requires email verification
      const email = appUser?.email;
      setLocation(`/verification-pending${email ? `?email=${encodeURIComponent(email)}` : ''}`);
      return;
    }
  }, [isAuthenticated, isLoading, requiresVerification, appUser, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || requiresVerification) {
    return null; // Will redirect via the useEffect
  }

  return <>{children}</>;
}
import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export default function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const { appUser, isAuthenticated, isLoading, requiresVerification } = useAuth();
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
    
    // If user is authenticated but not an admin, redirect to dashboard
    if (!appUser?.isAdmin) {
      setLocation('/');
      return;
    }
  }, [isAuthenticated, isLoading, requiresVerification, appUser, setLocation]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || requiresVerification || !appUser?.isAdmin) {
    return null; // Will redirect via the useEffect
  }

  return <>{children}</>;
}
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, signInWithGoogle, signOutUser, handleRedirectResult } from '../lib/firebase';
import { syncUserWithBackend } from '../lib/userSync';
import type { User as AppUser } from '@shared/schema';
import { useLocation } from 'wouter';

// Define the type for our authentication context
interface AuthContextType {
  currentUser: User | null;
  appUser: AppUser | null;
  isAuthenticated: boolean;
  isVerified: boolean;
  requiresVerification: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  appUser: null,
  isAuthenticated: false,
  isVerified: false,
  requiresVerification: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component that wraps the app and makes auth object available
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for redirect result and listen for auth state changes when component mounts
  useEffect(() => {
    const checkRedirectResult = async () => {
      console.log("Checking for redirect result on app load/reload");
      setIsLoading(true);
      
      try {
        // This handles the case when returning from a Google sign-in redirect
        const user = await handleRedirectResult();
        
        if (user) {
          console.log("User found from redirect, syncing with backend");
          setCurrentUser(user);
          
          // Sync user with backend
          try {
            console.log("Syncing redirect user with backend");
            const appUserData = await syncUserWithBackend(user);
            console.log("User synced successfully:", appUserData?.username || appUserData?.email);
            setAppUser(appUserData);
          } catch (error) {
            console.error('Error syncing redirect user with backend:', error);
            setAppUser(null);
          }
        } else {
          console.log("No user from redirect, checking current auth state");
        }
      } catch (error) {
        console.error('Error handling redirect:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Listen for auth state changes
    console.log("Setting up auth state change listener");
    const unsubscribe = onAuthChange(async (user) => {
      console.log("Auth state changed:", user ? "User logged in" : "User logged out");
      setCurrentUser(user);
      
      // If user is logged in, sync with backend
      if (user) {
        try {
          console.log("Syncing auth state user with backend");
          // Sync user data with backend and get app user data
          const appUserData = await syncUserWithBackend(user);
          console.log("User synced via auth state change:", appUserData?.username || appUserData?.email);
          setAppUser(appUserData);
        } catch (error) {
          console.error('Error syncing user with backend:', error);
          setAppUser(null);
        }
      } else {
        console.log("No current user, clearing app user");
        setAppUser(null);
      }
      
      setIsLoading(false);
    });

    // Check for redirect result - this is crucial for handling the post-redirect state
    console.log("Checking redirect result on mount");
    checkRedirectResult();

    // Cleanup subscription on unmount
    return () => {
      console.log("Cleaning up auth listener");
      unsubscribe();
    };
  }, []);

  // Login with Google function - now using redirect
  const login = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      // The actual user auth will be handled in the redirect callback
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      await signOutUser();
      // Auth state change will be caught by the listener
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  // Check if user has verified email
  const isVerified = appUser?.isEmailVerified ?? false;
  
  // Check if verification is required (user is authenticated but not verified)
  const requiresVerification = !!currentUser && !!appUser && !isVerified;
  
  const value = {
    currentUser,
    appUser,
    isAuthenticated: !!currentUser,
    isVerified,
    requiresVerification,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
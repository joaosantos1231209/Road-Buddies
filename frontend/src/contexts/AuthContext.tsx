import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth, loginWithGoogle, logout as firebaseLogout } from "../lib/firebase";

interface AuthContextType {
  user: User | null;
  dbUser: any | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateDbUser: (newData: any) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  dbUser: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  updateDbUser: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const response = await fetch("http://localhost:3000/api/auth/sync", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await response.json();
          setDbUser(data.user);
        } catch (error) {
          console.error("Erro ao sincronizar com backend", error);
        }
      } else {
        setDbUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    await loginWithGoogle();
  };

  const logout = async () => {
    await firebaseLogout();
  };

  const updateDbUser = (newData: any) => {
    setDbUser((prev: any) => ({ ...prev, ...newData }));
  };

  return (
    <AuthContext.Provider value={{ user, dbUser, loading, login, logout, updateDbUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

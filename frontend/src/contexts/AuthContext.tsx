import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth, loginWithGoogle, logout as firebaseLogout } from "../lib/firebase";
import { API_BASE_URL } from "../lib/constants";

interface AuthContextType {
  user: User | null;
  dbUser: any | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateDbUser: (newData: any) => void;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  dbUser: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  updateDbUser: () => {},
  getToken: async () => null,
});

/**
 * Verifica se estamos a correr no Cypress e se existe um utilizador mockado
 * armazenado no localStorage (injetado pelo comando cy.login()).
 */
const getCypressMock = (): { user: any; dbUser: any } | null => {
  if (typeof window === 'undefined') return null;
  if (!(window as any).Cypress) return null;
  try {
    const raw = localStorage.getItem('__CYPRESS_MOCK_USER__');
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore parse errors
  }
  return null;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const cyMock = useRef(getCypressMock()).current;

  const [user, setUser] = useState<User | null>(cyMock?.user ?? null);
  const [dbUser, setDbUser] = useState<any | null>(cyMock?.dbUser ?? null);
  const [loading, setLoading] = useState(!cyMock); // se mock existe, já não está a carregar

  /**
   * getToken é a ponte central: em modo normal usa Firebase,
   * em modo Cypress devolve um token fake (os intercepts não validam).
   */
  const getToken = async (): Promise<string | null> => {
    if (cyMock) return 'cypress-fake-token-abc123';
    return auth.currentUser?.getIdToken() ?? null;
  };

  useEffect(() => {
    // Se já foi carregado via bridge Cypress (localStorage), não precisamos do Firebase
    if (cyMock) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const response = await fetch(`${API_BASE_URL}/auth/sync`, {
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
    localStorage.removeItem('__CYPRESS_MOCK_USER__');
    setUser(null);
    setDbUser(null);
    await firebaseLogout();
  };

  const updateDbUser = (newData: any) => {
    setDbUser((prev: any) => ({ ...prev, ...newData }));
  };

  return (
    <AuthContext.Provider value={{ user, dbUser, loading, login, logout, updateDbUser, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

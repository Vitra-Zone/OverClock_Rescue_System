import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseAuth, firebaseEnabled } from '../firebase/client';
import { clearStaffAuthToken, setStaffAuthToken } from '../api/client';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  enabled: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseEnabled || !firebaseAuth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        clearStaffAuthToken();
      } else {
        void nextUser.getIdToken().then((token) => setStaffAuthToken(token));
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    enabled: firebaseEnabled,
    login: async (email: string, password: string) => {
      if (!firebaseAuth) throw new Error('Firebase Auth not configured.');
      const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const token = await credential.user.getIdToken();
      setStaffAuthToken(token);
    },
    logout: async () => {
      if (!firebaseAuth) return;
      await signOut(firebaseAuth);
      clearStaffAuthToken();
    },
    getIdToken: async () => {
      if (!user) return null;
      return user.getIdToken();
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

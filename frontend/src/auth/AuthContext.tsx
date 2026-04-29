import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseAuth, firebaseEnabled } from '../firebase/client';
import { clearStaffAuthToken, setStaffAuthToken } from '../api/client';

async function isManagementUser(user: User): Promise<boolean> {
  try {
    const token = await user.getIdTokenResult(true);
    return token.claims.managementAccess === true;
  } catch {
    return false;
  }
}

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
      const credential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      if (!(await isManagementUser(credential.user))) {
        await signOut(firebaseAuth);
        clearStaffAuthToken();
        const error = new Error('This email belongs to a tourist account. Use the tourist portal.') as Error & { code?: string };
        error.code = 'auth/permission-denied';
        throw error;
      }
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
  if (context) {
    return context;
  }

  return {
    user: null,
    loading: false,
    enabled: false,
    login: async () => {
      throw new Error('AuthProvider is unavailable.');
    },
    logout: async () => {
      return;
    },
    getIdToken: async () => null,
  };
}

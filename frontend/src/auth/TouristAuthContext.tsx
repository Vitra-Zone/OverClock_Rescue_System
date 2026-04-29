import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseAuth, firebaseEnabled } from '../firebase/client';
import { clearTouristAuthToken, setTouristAuthToken, fetchTouristProfile, registerTouristProfile as saveTouristProfile } from '../api/client';
import type { TouristProfile, RegisterTouristRequest } from '../types/tourist';

interface TouristAuthValue {
  user: User | null;
  loading: boolean;
  enabled: boolean;
  profile: TouristProfile | null;
  login: (email: string, password: string) => Promise<void>;
  register: (request: RegisterTouristRequest & { password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<TouristProfile | null>;
}

const TouristAuthContext = createContext<TouristAuthValue | undefined>(undefined);

async function isManagementUser(user: User): Promise<boolean> {
  try {
    const token = await user.getIdTokenResult(true);
    return token.claims.managementAccess === true;
  } catch {
    return false;
  }
}

export function TouristAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<TouristProfile | null>(null);

  const syncProfile = async (nextUser: User | null) => {
    if (!nextUser) {
      clearTouristAuthToken();
      setProfile(null);
      return;
    }

    if (await isManagementUser(nextUser)) {
      clearTouristAuthToken();
      setProfile(null);
      return;
    }

    const token = await nextUser.getIdToken();
    setTouristAuthToken(token);
    const nextProfile = await fetchTouristProfile();
    setProfile(nextProfile);
  };

  useEffect(() => {
    if (!firebaseEnabled || !firebaseAuth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser);
      void syncProfile(nextUser).finally(() => setLoading(false));
    });

    return unsubscribe;
  }, []);

  const value = useMemo<TouristAuthValue>(() => ({
    user,
    loading,
    enabled: firebaseEnabled,
    profile,
    login: async (email: string, password: string) => {
      if (!firebaseAuth) throw new Error('Firebase Auth not configured.');
      const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      if (await isManagementUser(credential.user)) {
        clearTouristAuthToken();
        setProfile(null);
        return;
      }
      const token = await credential.user.getIdToken();
      setTouristAuthToken(token);
      const nextProfile = await fetchTouristProfile();
      setProfile(nextProfile);
    },
    register: async (request: RegisterTouristRequest & { password: string }) => {
      if (!firebaseAuth) throw new Error('Firebase Auth not configured.');
      const credential = await createUserWithEmailAndPassword(firebaseAuth, request.email, request.password);
      if (await isManagementUser(credential.user)) {
        throw new Error('Management accounts cannot be registered as tourist profiles. Use the staff portal.');
      }
      const token = await credential.user.getIdToken();
      setTouristAuthToken(token);
      const nextProfile = await saveTouristProfile({
        touristFirstName: request.touristFirstName,
        touristLastName: request.touristLastName,
        email: request.email,
        phoneNumber: request.phoneNumber,
        aadhaarNumber: request.aadhaarNumber,
        homeState: request.homeState,
        homeDistrict: request.homeDistrict,
        pinCode: request.pinCode,
      });
      setProfile(nextProfile);
    },
    logout: async () => {
      if (!firebaseAuth) return;
      await signOut(firebaseAuth);
      clearTouristAuthToken();
      setProfile(null);
    },
    refreshProfile: async () => {
      if (user && await isManagementUser(user)) {
        clearTouristAuthToken();
        setProfile(null);
        return null;
      }
      const nextProfile = await fetchTouristProfile();
      setProfile(nextProfile);
      return nextProfile;
    },
  }), [user, loading, profile]);

  return <TouristAuthContext.Provider value={value}>{children}</TouristAuthContext.Provider>;
}

export function useTouristAuth() {
  const context = useContext(TouristAuthContext);
  if (context) {
    return context;
  }

  return {
    user: null,
    loading: false,
    enabled: false,
    profile: null,
    login: async () => {
      throw new Error('TouristAuthProvider is unavailable.');
    },
    register: async () => {
      throw new Error('TouristAuthProvider is unavailable.');
    },
    logout: async () => {
      return;
    },
    refreshProfile: async () => null,
  };
}

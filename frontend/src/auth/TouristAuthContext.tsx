import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseAuth, firebaseEnabled } from '../firebase/client';
import { clearAuthToken, setTouristAuthToken, fetchTouristProfile, registerTouristProfile as saveTouristProfile } from '../api/client';
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

export function TouristAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<TouristProfile | null>(null);

  const syncProfile = async (nextUser: User | null) => {
    if (!nextUser) {
      clearAuthToken();
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
      const token = await credential.user.getIdToken();
      setTouristAuthToken(token);
      const nextProfile = await fetchTouristProfile();
      setProfile(nextProfile);
    },
    register: async (request: RegisterTouristRequest & { password: string }) => {
      if (!firebaseAuth) throw new Error('Firebase Auth not configured.');
      const credential = await createUserWithEmailAndPassword(firebaseAuth, request.email, request.password);
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
      clearAuthToken();
      setProfile(null);
    },
    refreshProfile: async () => {
      const nextProfile = await fetchTouristProfile();
      setProfile(nextProfile);
      return nextProfile;
    },
  }), [user, loading, profile]);

  return <TouristAuthContext.Provider value={value}>{children}</TouristAuthContext.Provider>;
}

export function useTouristAuth() {
  const context = useContext(TouristAuthContext);
  if (!context) {
    throw new Error('useTouristAuth must be used within TouristAuthProvider');
  }
  return context;
}

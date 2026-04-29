import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth'
import { initializeFirebase } from '@overclock/shared/firebase'
import { setTouristAuthToken, clearTouristAuthToken, fetchTouristProfile, registerTouristProfile as saveTouristProfile } from '@overclock/shared/api'
import type { TouristProfile, RegisterTouristRequest } from '@overclock/shared/types'

interface TouristAuthValue {
  user: User | null
  loading: boolean
  enabled: boolean
  profile: TouristProfile | null
  login: (email: string, password: string) => Promise<void>
  register: (request: RegisterTouristRequest & { password: string }) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<TouristProfile | null>
}

const TouristAuthContext = createContext<TouristAuthValue | undefined>(undefined)

// Initialize Firebase with environment variables
const firebase = initializeFirebase({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
})

const firebaseAuth = firebase.firebaseAuth
const firebaseEnabled = firebase.firebaseEnabled

async function isManagementUser(user: User): Promise<boolean> {
  try {
    const token = await user.getIdTokenResult(true)
    return token.claims.managementAccess === true
  } catch {
    return false
  }
}

export function TouristAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<TouristProfile | null>(null)

  const syncProfile = async (nextUser: User | null) => {
    if (!nextUser) {
      clearTouristAuthToken()
      setProfile(null)
      return
    }

    if (await isManagementUser(nextUser)) {
      clearTouristAuthToken()
      setProfile(null)
      return
    }

    const token = await nextUser.getIdToken()
    setTouristAuthToken(token)
    const nextProfile = await fetchTouristProfile()
    setProfile(nextProfile)
  }

  useEffect(() => {
    if (!firebaseEnabled || !firebaseAuth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser)
      void syncProfile(nextUser)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = useMemo<TouristAuthValue>(() => ({
    user,
    loading,
    enabled: firebaseEnabled,
    profile,
    login: async (email: string, password: string) => {
      if (!firebaseAuth) throw new Error('Firebase Auth not configured.')
      const credential = await signInWithEmailAndPassword(firebaseAuth, email, password)
      await syncProfile(credential.user)
    },
    register: async (request: RegisterTouristRequest & { password: string }) => {
      if (!firebaseAuth) throw new Error('Firebase Auth not configured.')
      const { password, ...profileData } = request
      const credential = await createUserWithEmailAndPassword(firebaseAuth, request.email, password)
      const profile = await saveTouristProfile(profileData)
      setProfile(profile)
      const token = await credential.user.getIdToken()
      setTouristAuthToken(token)
    },
    logout: async () => {
      if (!firebaseAuth) return
      await signOut(firebaseAuth)
      clearTouristAuthToken()
      setProfile(null)
    },
    refreshProfile: async () => {
      const nextProfile = await fetchTouristProfile()
      setProfile(nextProfile)
      return nextProfile
    },
  }), [user, loading, profile])

  return <TouristAuthContext.Provider value={value}>{children}</TouristAuthContext.Provider>
}

export function useTouristAuth() {
  const context = useContext(TouristAuthContext)
  if (!context) {
    throw new Error('useTouristAuth must be used within TouristAuthProvider')
  }
  return context
}

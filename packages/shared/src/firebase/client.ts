import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, isSupported } from 'firebase/messaging';

export interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

interface FirebaseRuntime {
  firebaseEnabled: boolean;
  firebaseApp: ReturnType<typeof initializeApp> | null;
  firebaseAuth: ReturnType<typeof getAuth> | null;
  firebaseDb: ReturnType<typeof getFirestore> | null;
  getFirebaseMessagingIfSupported: () => Promise<Awaited<ReturnType<typeof getMessaging>> | null>;
}

export function initializeFirebase(config: FirebaseConfig): FirebaseRuntime {
  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'] as const;
  const enabled = requiredKeys.every((key) => Boolean(config[key]));

  if (!enabled) {
    return {
      firebaseEnabled: false,
      firebaseApp: null,
      firebaseAuth: null,
      firebaseDb: null,
      getFirebaseMessagingIfSupported: async () => null,
    };
  }

  const app = getApps().length ? getApp() : initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);

  return {
    firebaseEnabled: true,
    firebaseApp: app,
    firebaseAuth: auth,
    firebaseDb: db,
    getFirebaseMessagingIfSupported: async () => {
      const supported = await isSupported();
      return supported ? getMessaging(app) : null;
    },
  };
}

// For backward compatibility - will be initialized by apps
let _firebase: FirebaseRuntime = {
  firebaseEnabled: false,
  firebaseApp: null,
  firebaseAuth: null,
  firebaseDb: null,
  getFirebaseMessagingIfSupported: async () => null,
};

export function setFirebaseInstance(firebase: FirebaseRuntime) {
  _firebase = firebase;
}

export const firebaseEnabled = () => _firebase.firebaseEnabled;
export const firebaseApp = () => _firebase.firebaseApp;
export const firebaseAuth = () => _firebase.firebaseAuth;
export const firebaseDb = () => _firebase.firebaseDb;
export const getFirebaseMessagingIfSupported = () => _firebase.getFirebaseMessagingIfSupported();

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'] as const;
const enabled = requiredKeys.every((key) => Boolean(firebaseConfig[key]));

let app = null as ReturnType<typeof initializeApp> | null;
let auth = null as ReturnType<typeof getAuth> | null;
let db = null as ReturnType<typeof getFirestore> | null;

if (enabled) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export const firebaseEnabled = enabled;
export const firebaseApp = app;
export const firebaseAuth = auth;
export const firebaseDb = db;

export async function getFirebaseMessagingIfSupported() {
  if (!enabled || !app) return null;
  const supported = await isSupported();
  if (!supported) return null;
  return getMessaging(app);
}

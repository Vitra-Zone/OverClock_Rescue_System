import admin from 'firebase-admin';

let initialized = false;

function initializeFirebaseAdmin() {
  if (initialized) return;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    console.warn('[FirebaseAdmin] FIREBASE_SERVICE_ACCOUNT_JSON not set. Running in local fallback mode.');
    return;
  }

  try {
    const credentialObj = JSON.parse(serviceAccountJson);
    admin.initializeApp({
      credential: admin.credential.cert(credentialObj),
    });
    initialized = true;
    console.log('[FirebaseAdmin] Initialized successfully.');
  } catch (error) {
    console.warn('[FirebaseAdmin] Failed to initialize. Falling back to local mode.', error);
  }
}

initializeFirebaseAdmin();

export function isFirebaseEnabled() {
  return initialized;
}

export function getFirestore() {
  return initialized ? admin.firestore() : null;
}

export function getFirebaseAuth() {
  return initialized ? admin.auth() : null;
}

export function getMessaging() {
  return initialized ? admin.messaging() : null;
}

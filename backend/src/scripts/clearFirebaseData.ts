import 'dotenv/config';
import { getFirestore, isFirebaseEnabled } from '../services/firebaseAdmin';

async function deleteCollectionRecursive(path: string): Promise<number> {
  const db = getFirestore();
  if (!db) return 0;

  const collectionRef = db.collection(path);
  const snapshot = await collectionRef.get();
  if (snapshot.empty) return 0;

  let deletedCount = 0;
  for (const doc of snapshot.docs) {
    const subcollections = await doc.ref.listCollections();
    for (const subcollection of subcollections) {
      deletedCount += await deleteCollectionRecursive(subcollection.path);
    }

    await doc.ref.delete();
    deletedCount += 1;
  }

  return deletedCount;
}

async function clearFirestoreData(): Promise<void> {
  if (!isFirebaseEnabled()) {
    console.error('[ClearFirebaseData] Firebase Admin is not enabled. Check FIREBASE_SERVICE_ACCOUNT_JSON in backend .env.');
    process.exitCode = 1;
    return;
  }

  const db = getFirestore();
  if (!db) {
    console.error('[ClearFirebaseData] Firestore client is unavailable.');
    process.exitCode = 1;
    return;
  }

  const topCollections = await db.listCollections();
  if (topCollections.length === 0) {
    console.log('[ClearFirebaseData] Firestore is already empty.');
    return;
  }

  console.log('[ClearFirebaseData] Starting Firestore cleanup...');
  console.log('[ClearFirebaseData] Firebase Auth users are NOT modified.');

  let totalDeleted = 0;
  for (const collection of topCollections) {
    const deletedInCollection = await deleteCollectionRecursive(collection.path);
    totalDeleted += deletedInCollection;
    console.log(`[ClearFirebaseData] Cleared collection: ${collection.path} (${deletedInCollection} docs)`);
  }

  console.log(`[ClearFirebaseData] Completed. Total Firestore docs deleted: ${totalDeleted}`);
}

clearFirestoreData().catch((error: unknown) => {
  console.error('[ClearFirebaseData] Unexpected failure:', error);
  process.exitCode = 1;
});

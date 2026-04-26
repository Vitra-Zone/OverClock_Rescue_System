import 'dotenv/config';
import { getFirestore, isFirebaseEnabled } from '../services/firebaseAdmin';

const COLLECTION = 'incidents';
const DEMO_IDS = ['inc-001', 'inc-002', 'inc-003'];

async function cleanupDemoIncidents() {
  if (!isFirebaseEnabled()) {
    console.error('[CleanupDemoIncidents] Firebase Admin is not enabled. Check FIREBASE_SERVICE_ACCOUNT_JSON in backend .env.');
    process.exitCode = 1;
    return;
  }

  const db = getFirestore();
  if (!db) {
    console.error('[CleanupDemoIncidents] Firestore client is unavailable.');
    process.exitCode = 1;
    return;
  }

  let deleted = 0;

  for (const incidentId of DEMO_IDS) {
    const ref = db.collection(COLLECTION).doc(incidentId);
    const snapshot = await ref.get();

    if (!snapshot.exists) {
      console.log(`[CleanupDemoIncidents] Not found: ${incidentId}`);
      continue;
    }

    await ref.delete();
    deleted += 1;
    console.log(`[CleanupDemoIncidents] Deleted: ${incidentId}`);
  }

  console.log(`[CleanupDemoIncidents] Completed. Deleted ${deleted} demo incident document(s).`);
}

cleanupDemoIncidents().catch((error: unknown) => {
  console.error('[CleanupDemoIncidents] Unexpected failure:', error);
  process.exitCode = 1;
});

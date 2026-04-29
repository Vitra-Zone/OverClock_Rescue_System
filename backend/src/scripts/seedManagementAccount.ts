import 'dotenv/config';
import { getFirebaseAuth, isFirebaseEnabled } from '../services/firebaseAdmin';

const EMAIL = 'Tester@gmail.com';
const PASSWORD = 'Testing';
const DISPLAY_NAME = 'Management Tester';

async function seedManagementAccount(): Promise<void> {
  if (!isFirebaseEnabled()) {
    console.error('[SeedManagementAccount] Firebase Admin is not enabled. Check FIREBASE_SERVICE_ACCOUNT_JSON in backend .env.');
    process.exitCode = 1;
    return;
  }

  const auth = getFirebaseAuth();
  if (!auth) {
    console.error('[SeedManagementAccount] Firebase Auth client is unavailable.');
    process.exitCode = 1;
    return;
  }

  const normalizedEmail = EMAIL.trim().toLowerCase();

  try {
    let userRecord;

    try {
      userRecord = await auth.getUserByEmail(normalizedEmail);
      await auth.updateUser(userRecord.uid, {
        email: normalizedEmail,
        password: PASSWORD,
        displayName: DISPLAY_NAME,
        emailVerified: true,
      });
      console.log(`[SeedManagementAccount] Updated existing Firebase Auth user: ${normalizedEmail}`);
    } catch (error) {
      const code = (error as { code?: string } | undefined)?.code;
      if (code !== 'auth/user-not-found') {
        throw error;
      }

      userRecord = await auth.createUser({
        email: normalizedEmail,
        password: PASSWORD,
        displayName: DISPLAY_NAME,
        emailVerified: true,
      });
      console.log(`[SeedManagementAccount] Created Firebase Auth user: ${normalizedEmail}`);
    }

    await auth.setCustomUserClaims(userRecord.uid, {
      managementAccess: true,
      accountType: 'management_tester',
    });

    console.log('[SeedManagementAccount] Custom claims set: managementAccess=true, accountType=management_tester');
    console.log('[SeedManagementAccount] Login can be used from Hotel, Hotel Staff, Fire, Medical, and Police channels.');
  } catch (error) {
    console.error('[SeedManagementAccount] Failed to seed management account:', error);
    process.exitCode = 1;
  }
}

seedManagementAccount().catch((error: unknown) => {
  console.error('[SeedManagementAccount] Unexpected failure:', error);
  process.exitCode = 1;
});
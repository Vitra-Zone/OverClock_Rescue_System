import { getMessaging, isFirebaseEnabled } from './firebaseAdmin';

const localTokens = new Set<string>();

export async function registerStaffNotificationToken(token: string) {
  if (!token) return;
  localTokens.add(token);
}

export async function sendStaffIncidentAlert(title: string, body: string, incidentId: string) {
  if (!isFirebaseEnabled()) {
    console.log('[Notifications] Firebase messaging unavailable. Skipping push notification.');
    return;
  }

  const messaging = getMessaging();
  if (!messaging) return;

  const tokens = Array.from(localTokens);
  if (!tokens.length) {
    console.log('[Notifications] No staff device tokens registered yet.');
    return;
  }

  try {
    await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: { incidentId },
    });
    console.log(`[Notifications] Push sent for incident ${incidentId} to ${tokens.length} device(s).`);
  } catch (error) {
    console.warn('[Notifications] Failed to send push notification.', error);
  }
}

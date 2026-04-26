import { getIncidentById, updateIncidentStatus, addTimelineEntry } from './incidentStore';

const timers = new Map<string, NodeJS.Timeout>();

function clearEscalationTimer(incidentId: string) {
  const existing = timers.get(incidentId);
  if (existing) {
    clearTimeout(existing);
    timers.delete(incidentId);
  }
}

export function clearEscalationForIncident(incidentId: string) {
  clearEscalationTimer(incidentId);
}

export function scheduleEscalation(incidentId: string, delayMs = 60_000) {
  clearEscalationTimer(incidentId);

  const timer = setTimeout(async () => {
    try {
      const incident = await getIncidentById(incidentId);
      if (!incident) return;

      const verificationOnly = incident.recommendedAction === 'verify_guest_intent';
      if (verificationOnly) {
        console.log(`[Escalation] Skipped escalation for ${incidentId} (awaiting guest intent verification).`);
        return;
      }

      const shouldEscalate = (incident.status === 'open' || incident.status === 'assigned') && !incident.humanApproved;
      if (!shouldEscalate) return;

      await updateIncidentStatus(
        incidentId,
        'assigned',
        'system',
        'Auto-escalated: no staff acknowledgment within 60 seconds.'
      );
      await addTimelineEntry(incidentId, {
        actor: 'system',
        message: 'Escalation triggered automatically. Supervisor notified for urgent attention.',
      });

      console.log(`[Escalation] Incident ${incidentId} escalated.`);
    } catch (error) {
      console.warn(`[Escalation] Failed to escalate incident ${incidentId}`, error);
    } finally {
      timers.delete(incidentId);
    }
  }, delayMs);

  timers.set(incidentId, timer);
}

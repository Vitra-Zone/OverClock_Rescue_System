import {
  Incident,
  IncidentStatus,
  TimelineEntry,
  AITriageResult,
  CreateIncidentRequest,
  ResponseSector,
} from '../types/incident';
import { v4 as uuidv4 } from 'uuid';
import { getFirestore, isFirebaseEnabled } from './firebaseAdmin';

const COLLECTION = 'incidents';

const memoryStore = new Map<string, Incident>();

function hasFireSignal(message: string): boolean {
  const lower = message.toLowerCase();
  return ['fire', 'smoke', 'burn', 'flame', 'hot', 'smell', 'burning', 'alarm', 'electrical', 'short circuit', 'spark', 'gas leak']
    .some((keyword) => lower.includes(keyword));
}

function buildFireWorkflowSteps(fallbackMode: AITriageResult['fallbackMode'], confidence: number): string[] {
  const steps = [
    'Guest input captured and normalized',
    'Incident classified as fire with critical severity',
    'Dispatch target resolved to fire_safety_officer',
    'Recommended action: activate fire alarm and evacuate',
  ];

  if (fallbackMode !== 'none') {
    steps.push(`Fallback channel prepared: ${fallbackMode}`);
  }

  steps.push(confidence >= 75 ? 'High-confidence triage ready for hotel-side review' : 'Low-confidence triage flagged for guest verification');
  return steps;
}

function normalizeStoredTriage(incident: Incident): AITriageResult | undefined {
  const triage = incident.aiTriage;
  if (!triage) return triage;
  if (!hasFireSignal(incident.message) || triage.incidentType === 'fire') return triage;

  const confidence = Math.max(triage.confidence ?? 0, 92);
  return {
    ...triage,
    incidentType: 'fire',
    severity: 'critical',
    assignedTo: 'fire_safety_officer',
    nextAction: 'activate_fire_alarm_and_evacuate',
    summary: `Critical-severity fire incident reported at ${incident.location}. "${incident.message.slice(0, 80)}${incident.message.length > 80 ? '...' : ''}"`,
    followUpQuestion: 'Can you see open flames or is it just smoke?',
    workflowStage: 'dispatch',
    workflowSteps: buildFireWorkflowSteps(triage.fallbackMode, confidence),
    confidence,
    analytics: {
      ...triage.analytics,
      keywordHits: Math.max(triage.analytics.keywordHits, 1),
      emergencySignals: triage.analytics.emergencySignals + 1,
    },
  };
}

function normalizeIncident(incident: Incident): Incident {
  const dispatchedSectors = incident.dispatchedSectors ?? [];
  const verifiedByHotel = incident.verifiedByHotel ?? false;
  const hasHotelDispatch = dispatchedSectors.length > 0;
  const invalidAssignedState = incident.status === 'assigned' && !verifiedByHotel && !hasHotelDispatch;
  const normalizedAiTriage = normalizeStoredTriage(incident);
  const normalizedIncidentType = normalizedAiTriage?.incidentType ?? incident.incidentType;
  const normalizedSeverity = normalizedAiTriage?.severity ?? incident.severity;
  const normalizedAssignedTo = normalizedAiTriage?.assignedTo ?? incident.assignedTo;

  return {
    ...incident,
    status: invalidAssignedState ? 'open' : incident.status,
    verifiedByHotel: verifiedByHotel || hasHotelDispatch,
    dispatchedSectors,
    incidentType: normalizedIncidentType,
    severity: normalizedSeverity,
    assignedTo: normalizedAssignedTo,
    aiSummary: normalizedAiTriage?.summary ?? incident.aiSummary,
    recommendedAction: normalizedAiTriage?.nextAction ?? incident.recommendedAction,
    aiTriage: normalizedAiTriage,
    acceptedSectors: incident.acceptedSectors ?? [],
    resolvedSectors: incident.resolvedSectors ?? [],
  };
}

async function saveIncident(incident: Incident): Promise<void> {
  if (isFirebaseEnabled()) {
    const db = getFirestore();
    if (db) {
      await db.collection(COLLECTION).doc(incident.id).set(incident);
    }
    return;
  }

  memoryStore.set(incident.id, incident);
}

async function ensureSeedData() {
  // Intentionally no-op: incidents should come from real submissions only.
}

function sortByCreatedDesc(incidents: Incident[]) {
  return incidents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getAllIncidents(): Promise<Incident[]> {
  await ensureSeedData();

  if (isFirebaseEnabled()) {
    const db = getFirestore();
    if (!db) return [];
    const snapshot = await db.collection(COLLECTION).orderBy('createdAt', 'desc').get();
    return snapshot.docs.map((doc) => normalizeIncident(doc.data() as Incident));
  }

  return sortByCreatedDesc(Array.from(memoryStore.values()).map(normalizeIncident));
}

export async function getIncidentById(id: string): Promise<Incident | undefined> {
  await ensureSeedData();

  if (isFirebaseEnabled()) {
    const db = getFirestore();
    if (!db) return undefined;
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return undefined;
    return normalizeIncident(doc.data() as Incident);
  }

  const incident = memoryStore.get(id);
  return incident ? normalizeIncident(incident) : undefined;
}

export async function createIncident(req: CreateIncidentRequest): Promise<Incident> {
  await ensureSeedData();

  const id = `inc-${uuidv4().split('-')[0]}`;
  const createdAt = new Date().toISOString();

  const incident: Incident = {
    id,
    createdAt,
    updatedAt: createdAt,
    source: req.source ?? 'web',
    guestName: req.guestName,
    roomNumber: req.roomNumber,
    location: req.location,
    ...(req.coordinates ? { coordinates: req.coordinates } : {}),
    incidentScope: req.incidentScope ?? 'in_hotel',
    hotelContext: req.hotelContext,
    incidentType: 'unknown',
    severity: 'medium',
    connectivityMode: req.connectivityMode,
    status: 'open',
    message: req.message,
    assignedTo: 'unassigned',
    fallbackUsed: req.connectivityMode === 'sms_fallback' ? 'sms' : req.connectivityMode === 'voice_fallback' ? 'voice' : 'none',
    responseTimeline: [
      {
        timestamp: createdAt,
        actor: 'guest',
        message: `SOS triggered via ${req.source ?? 'web'}: "${req.message}"`,
      },
    ],
    verifiedByHotel: false,
    dispatchedSectors: [],
    acceptedSectors: [],
    resolvedSectors: [],
    escalated: false,
    escalationDueAt: new Date(Date.now() + 60_000).toISOString(),
  };

  await saveIncident(incident);

  console.log(`[IncidentStore] Created incident ${id}`);
  return incident;
}

export async function updateIncidentStatus(
  id: string,
  status: IncidentStatus,
  actor: string,
  note?: string
): Promise<Incident | undefined> {
  const incident = await getIncidentById(id);
  if (!incident) return undefined;

  const updatedAt = new Date().toISOString();
  const roleActor = actor === 'hotel_staff' || actor === 'fire_staff' || actor === 'medical_staff' || actor === 'police_staff'
    ? actor
    : actor === 'ai'
    ? 'ai'
    : actor === 'system'
    ? 'system'
    : 'hotel_staff';
  const timelineEntry: TimelineEntry = {
    timestamp: updatedAt,
    actor: roleActor,
    message: note ?? `Status updated to ${status}`,
  };

  const updatedIncident: Incident = {
    ...incident,
    status,
    updatedAt,
    responseTimeline: [...incident.responseTimeline, timelineEntry],
    escalated: status === 'in_progress' || status === 'resolved' || status === 'closed' ? incident.escalated : incident.escalated,
  };

  await saveIncident(updatedIncident);

  return updatedIncident;
}

export async function addTimelineEntry(
  id: string,
  entry: Omit<TimelineEntry, 'timestamp'>
): Promise<Incident | undefined> {
  const incident = await getIncidentById(id);
  if (!incident) return undefined;

  const timestamp = new Date().toISOString();
  const updatedIncident: Incident = {
    ...incident,
    updatedAt: timestamp,
    responseTimeline: [...incident.responseTimeline, { ...entry, timestamp }],
  };

  await saveIncident(updatedIncident);

  return updatedIncident;
}

export async function applyAITriage(id: string, triage: AITriageResult): Promise<Incident | undefined> {
  const incident = await getIncidentById(id);
  if (!incident) return undefined;

  const requiresGuestVerification = triage.nextAction === 'verify_guest_intent';
  const updatedAt = new Date().toISOString();
  const updatedIncident: Incident = {
    ...incident,
    aiTriage: triage,
    incidentType: triage.incidentType,
    severity: triage.severity,
    assignedTo: triage.assignedTo,
    aiSummary: triage.summary,
    recommendedAction: triage.nextAction,
    fallbackUsed: triage.fallbackMode,
    status: 'open',
    updatedAt,
    responseTimeline: [
      ...incident.responseTimeline,
      {
        timestamp: updatedAt,
        actor: 'ai',
        message: requiresGuestVerification
          ? 'AI triage flagged possible non-emergency/test input. Waiting for guest confirmation before dispatch.'
          : `AI Triage complete: ${triage.incidentType} / ${triage.severity}. Awaiting hotel verification and dispatch.`,
      },
    ],
  };

  await saveIncident(updatedIncident);

  return updatedIncident;
}

export async function approveAITriage(id: string): Promise<Incident | undefined> {
  const incident = await getIncidentById(id);
  if (!incident) return undefined;

  const updatedAt = new Date().toISOString();
  const updatedIncident: Incident = {
    ...incident,
    humanApproved: true,
    status: incident.status === 'closed' ? 'closed' : 'open',
    updatedAt,
    responseTimeline: [
      ...incident.responseTimeline,
      {
        timestamp: updatedAt,
        actor: 'hotel_staff',
        message: 'Hotel approved AI triage. Ready for manual sector dispatch.',
      },
    ],
  };

  await saveIncident(updatedIncident);

  return updatedIncident;
}

function uniqueSectors(sectors: ResponseSector[]): ResponseSector[] {
  return Array.from(new Set(sectors));
}

function sectorActorForTimeline(sector: Exclude<ResponseSector, 'hotel'>): TimelineEntry['actor'] {
  if (sector === 'hotel_staff') return 'hotel_staff';
  return `${sector}_staff` as TimelineEntry['actor'];
}

export async function hotelVerifyAndDispatch(
  id: string,
  sectors: ResponseSector[],
  note?: string
): Promise<Incident | undefined> {
  const incident = await getIncidentById(id);
  if (!incident) return undefined;

  const cleanSectors = uniqueSectors(sectors.filter((s) => s !== 'hotel'));
  const updatedAt = new Date().toISOString();
  const updatedIncident: Incident = {
    ...incident,
    humanApproved: true,
    verifiedByHotel: true,
    dispatchedSectors: cleanSectors,
    acceptedSectors: incident.acceptedSectors?.filter((s) => cleanSectors.includes(s)) ?? [],
    resolvedSectors: incident.resolvedSectors?.filter((s) => cleanSectors.includes(s)) ?? [],
    status: cleanSectors.length > 0 ? 'assigned' : 'open',
    updatedAt,
    responseTimeline: [
      ...incident.responseTimeline,
      {
        timestamp: updatedAt,
        actor: 'hotel_staff',
        message: note ?? `Hotel verified incident and dispatched: ${cleanSectors.join(', ') || 'no sectors selected'}.`,
      },
    ],
  };

  await saveIncident(updatedIncident);
  return updatedIncident;
}

export async function sectorAcceptIncident(
  id: string,
  sector: Exclude<ResponseSector, 'hotel'>,
  note?: string
): Promise<Incident | undefined> {
  const incident = await getIncidentById(id);
  if (!incident) return undefined;

  const dispatched = incident.dispatchedSectors ?? [];
  if (!dispatched.includes(sector)) return undefined;

  const accepted = uniqueSectors([...(incident.acceptedSectors ?? []), sector]);
  const allAccepted = dispatched.length > 0 && dispatched.every((s) => accepted.includes(s));
  const sectorActor = sectorActorForTimeline(sector);
  const updatedAt = new Date().toISOString();
  const updatedIncident: Incident = {
    ...incident,
    acceptedSectors: accepted,
    status: incident.status === 'closed' ? 'closed' : allAccepted ? 'in_progress' : 'assigned',
    updatedAt,
    responseTimeline: [
      ...incident.responseTimeline,
      {
        timestamp: updatedAt,
        actor: sectorActor,
        message: note ?? allAccepted
          ? `${sector.toUpperCase()} sector accepted this incident. All dispatched sectors accepted, moved to in progress.`
          : `${sector.toUpperCase()} sector accepted this incident. Waiting for remaining sectors to accept.`,
      },
    ],
  };

  await saveIncident(updatedIncident);
  return updatedIncident;
}

export async function sectorResolveIncident(
  id: string,
  sector: Exclude<ResponseSector, 'hotel'>,
  note?: string
): Promise<Incident | undefined> {
  const incident = await getIncidentById(id);
  if (!incident) return undefined;

  const dispatched = incident.dispatchedSectors ?? [];
  if (!dispatched.includes(sector)) return undefined;

  const resolvedSectors = uniqueSectors([...(incident.resolvedSectors ?? []), sector]);
  const allResolved = dispatched.length > 0 && dispatched.every((s) => resolvedSectors.includes(s));
  const sectorActor = sectorActorForTimeline(sector);
  const updatedAt = new Date().toISOString();
  const updatedIncident: Incident = {
    ...incident,
    resolvedSectors,
    status: allResolved ? 'resolved' : 'in_progress',
    updatedAt,
    responseTimeline: [
      ...incident.responseTimeline,
      {
        timestamp: updatedAt,
        actor: sectorActor,
        message: note ?? `${sector.toUpperCase()} sector marked response resolved.`,
      },
    ],
  };

  await saveIncident(updatedIncident);
  return updatedIncident;
}

export async function hotelCloseIncident(
  id: string,
  note?: string
): Promise<Incident | undefined> {
  const incident = await getIncidentById(id);
  if (!incident) return undefined;

  const dispatched = incident.dispatchedSectors ?? [];
  const resolved = incident.resolvedSectors ?? [];
  const allResolved = dispatched.length > 0 && dispatched.every((s) => resolved.includes(s));
  if (!allResolved || incident.status !== 'resolved') return undefined;

  const updatedAt = new Date().toISOString();
  const updatedIncident: Incident = {
    ...incident,
    status: 'closed',
    updatedAt,
    responseTimeline: [
      ...incident.responseTimeline,
      {
        timestamp: updatedAt,
        actor: 'hotel_staff',
        message: note ?? 'Hotel closed the incident after all dispatched sectors resolved.',
      },
    ],
  };

  await saveIncident(updatedIncident);

  return updatedIncident;
}

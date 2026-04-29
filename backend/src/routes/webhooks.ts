import { Router, Request, Response } from 'express';
import { createIncident, addTimelineEntry } from '../services/incidentStore';
import { triageIncident } from '../services/aiService';
import { applyAITriage } from '../services/incidentStore';
import { scheduleEscalation } from '../services/escalationService';
import { sendStaffIncidentAlert } from '../services/notificationService';
import type { Coordinates, HotelContext } from '../types/incident';

const router = Router();

const DEFAULT_HOTEL_CONTEXT: HotelContext = {
  name: 'OverClock Tower',
  address: 'Assam, Guwahati',
  coordinates: {
    lat: 26.1445,
    lng: 91.7362,
  },
};

type SmsFields = Record<string, string>;

function clean(value: string | undefined, fallback = '') {
  return (value ?? fallback).replace(/\s+/g, ' ').replace(/[|]/g, '/').trim();
}

function parseCompactSms(body: string): SmsFields | null {
  const normalized = body.trim();
  if (!normalized.toUpperCase().startsWith('OCSOS')) return null;

  const fields: SmsFields = {};
  for (const chunk of normalized.split('|').slice(1)) {
    const separatorIndex = chunk.indexOf('=');
    if (separatorIndex <= 0) continue;
    const key = chunk.slice(0, separatorIndex).trim().toLowerCase();
    const value = chunk.slice(separatorIndex + 1).trim();
    if (key) fields[key] = value;
  }

  return fields;
}

function parseCoordinates(raw: string | undefined): Coordinates | undefined {
  if (!raw) return undefined;
  const [latRaw, lngRaw] = raw.split(',').map((part) => part.trim());
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  return { lat, lng };
}

function buildFallbackIncidentMessage(type: string, details: string, location: string) {
  const label = clean(type, 'Emergency');
  const note = clean(details, 'No additional details provided.');
  return `${label} at ${location}. ${note}`;
}

// POST /api/webhooks/twilio/sms
router.post('/twilio/sms', async (req: Request, res: Response) => {
  const body = String(req.body?.Body ?? req.body?.body ?? '').trim();
  const from = clean(String(req.body?.From ?? req.body?.from ?? ''), 'unknown sender');
  const parsed = body ? parseCompactSms(body) : null;

  const guestName = clean(parsed?.n, from !== 'unknown sender' ? from : 'SMS Guest');
  const roomNumber = clean(parsed?.r, 'Unknown');
  const hotelName = clean(parsed?.h, DEFAULT_HOTEL_CONTEXT.name);
  const hotelAddress = clean(parsed?.a, DEFAULT_HOTEL_CONTEXT.address);
  const incidentScope = parsed?.s === 'o' ? 'outside' : 'in_hotel';
  const location = incidentScope === 'outside'
    ? clean(parsed?.loc, hotelAddress)
    : clean(parsed?.loc, `Room ${roomNumber}`);
  const emergencyType = clean(parsed?.t, 'General');
  const details = clean(parsed?.d, body || 'No details provided.');
  const coordinates = parseCoordinates(parsed?.c);

  const incident = await createIncident({
    guestName,
    roomNumber,
    location,
    coordinates,
    incidentScope,
    hotelContext: {
      name: hotelName,
      address: hotelAddress,
      coordinates: coordinates ?? DEFAULT_HOTEL_CONTEXT.coordinates,
    },
    message: buildFallbackIncidentMessage(emergencyType, details, location),
    connectivityMode: 'sms_fallback',
    source: 'sms',
  });

  const triage = await triageIncident(incident.message, incident.location);
  await applyAITriage(incident.id, triage);
  await addTimelineEntry(incident.id, {
    actor: 'system',
    message: `Inbound SMS received from ${from}${body ? `: ${body}` : ''}`,
  });

  scheduleEscalation(incident.id, 60_000);
  await sendStaffIncidentAlert(
    'New SMS SOS Incident',
    `${triage.incidentType.toUpperCase()} incident at ${incident.location} from ${guestName}`,
    incident.id
  );

  console.log(`[Webhooks] Twilio SMS captured for ${incident.id} from ${from}`);

  res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Your SOS has been received. Hotel staff are being notified now.</Message>
</Response>`);
});

export default router;
import { Router, Response } from 'express';
import { getAllIncidents, getIncidentById, addTimelineEntry } from '../services/incidentStore';
import { sendStaffIncidentAlert } from '../services/notificationService';
import { generateTouristGuidanceReply } from '../services/aiService';
import {
  bindTouristHotel,
  getTouristProfileByUid,
  listTouristsByHotelBinding,
  registerTouristProfile,
  updateTouristLocation,
  updateTouristProfile,
} from '../services/touristStore';
import { requireFirebaseAuth, requireStaffAuth, AuthenticatedRequest, StaffRequest } from '../middleware/auth';
import type {
  ContactRequest,
  RegisterTouristRequest,
  TouristAPIResponse,
  TouristChatRequest,
  UpdateTouristProfileRequest,
} from '../types/tourist';

const router = Router();

router.get('/hotel-linked', requireStaffAuth, async (req: StaffRequest, res: Response) => {
  const hotelName = String(req.query.hotelName ?? '').trim();
  const hotelLocation = String(req.query.hotelLocation ?? '').trim();
  const roomNumber = String(req.query.roomNumber ?? '').trim();

  const profiles = await listTouristsByHotelBinding({
    hotelName: hotelName || undefined,
    hotelLocation: hotelLocation || undefined,
    roomNumber: roomNumber || undefined,
  });

  const data = profiles.map((profile) => ({
    uid: profile.uid,
    email: profile.email,
    touristFirstName: profile.touristFirstName,
    touristLastName: profile.touristLastName,
    phoneNumber: profile.phoneNumber,
    digitalId: profile.digitalId,
    currentLocation: profile.currentLocation ?? '',
    coordinates: profile.coordinates,
    hotelBinding: profile.hotelBinding,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  }));

  return res.json({ success: true, data, timestamp: new Date().toISOString() });
});

router.get('/me/incidents', requireFirebaseAuth, async (_req: AuthenticatedRequest, res: Response) => {
  const incidents = await getAllIncidents();
  return res.json({ success: true, data: incidents, timestamp: new Date().toISOString() });
});

router.get('/me', requireFirebaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  const profile = await getTouristProfileByUid(req.authUserId!);
  if (!profile) {
    return res.status(404).json({ success: false, error: 'Tourist profile not found', timestamp: new Date().toISOString() });
  }

  const response: TouristAPIResponse = { success: true, data: profile, timestamp: new Date().toISOString() };
  return res.json(response);
});

router.post('/register', requireFirebaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  const body = req.body as RegisterTouristRequest;
  const required = ['touristFirstName', 'touristLastName', 'email', 'phoneNumber', 'aadhaarNumber', 'homeState', 'homeDistrict', 'pinCode'] as const;
  const payload = body as unknown as Record<string, unknown>;
  const missing = required.filter((key) => !String(payload[key] ?? '').trim());
  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      error: `Missing required fields: ${missing.join(', ')}`,
      timestamp: new Date().toISOString(),
    });
  }

  const existing = await getTouristProfileByUid(req.authUserId!);
  if (existing) {
    const updated = await updateTouristProfile(req.authUserId!, body);
    return res.json({ success: true, data: updated, timestamp: new Date().toISOString() });
  }

  const profile = await registerTouristProfile(req.authUserId!, body);
  return res.status(201).json({ success: true, data: profile, timestamp: new Date().toISOString() });
});

router.patch('/me', requireFirebaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  const body = req.body as UpdateTouristProfileRequest;
  const profile = await updateTouristProfile(req.authUserId!, body);
  if (!profile) {
    return res.status(404).json({ success: false, error: 'Tourist profile not found', timestamp: new Date().toISOString() });
  }

  return res.json({ success: true, data: profile, timestamp: new Date().toISOString() });
});

router.post('/me/location', requireFirebaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { coordinates, currentLocation } = req.body as { coordinates?: { lat: number; lng: number; accuracy?: number }; currentLocation?: string };
  if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
    return res.status(400).json({ success: false, error: 'Missing coordinates', timestamp: new Date().toISOString() });
  }

  const profile = await updateTouristLocation(req.authUserId!, coordinates, currentLocation ?? 'Current location updated');
  if (!profile) {
    return res.status(404).json({ success: false, error: 'Tourist profile not found', timestamp: new Date().toISOString() });
  }

  return res.json({ success: true, data: profile, timestamp: new Date().toISOString() });
});

router.post('/me/hotel-binding', requireFirebaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  const body = req.body as {
    hotelName?: string;
    hotelLocation?: string;
    roomNumber?: string;
    nightsOfStay?: number;
    stayStartDate?: string;
    stayEndDate?: string;
    hotelPhoneNumber?: string;
    qrPayload?: string;
  };
  if (!body.hotelName || !body.hotelLocation || !body.roomNumber || typeof body.nightsOfStay !== 'number') {
    return res.status(400).json({ success: false, error: 'Missing hotel binding fields', timestamp: new Date().toISOString() });
  }

  const profile = await bindTouristHotel(req.authUserId!, {
    hotelName: body.hotelName,
    hotelLocation: body.hotelLocation,
    roomNumber: body.roomNumber,
    nightsOfStay: body.nightsOfStay,
    stayStartDate: body.stayStartDate,
    stayEndDate: body.stayEndDate,
    hotelPhoneNumber: body.hotelPhoneNumber,
    qrPayload: body.qrPayload,
  });

  if (!profile) {
    return res.status(404).json({ success: false, error: 'Tourist profile not found', timestamp: new Date().toISOString() });
  }

  return res.json({ success: true, data: profile, timestamp: new Date().toISOString() });
});

router.post('/me/chat', requireFirebaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  const body = req.body as TouristChatRequest;
  if (!body.message?.trim()) {
    return res.status(400).json({ success: false, error: 'Missing chat message', timestamp: new Date().toISOString() });
  }

  const profile = await getTouristProfileByUid(req.authUserId!);
  const response = await generateTouristGuidanceReply(body.message, profile, body.incidentContext);
  return res.json({ success: true, data: response, timestamp: new Date().toISOString() });
});

router.post('/me/contact', requireFirebaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  const body = req.body as ContactRequest;
  if (!body.incidentId || !body.mode) {
    return res.status(400).json({ success: false, error: 'Missing incidentId or mode', timestamp: new Date().toISOString() });
  }

  const incident = await getIncidentById(body.incidentId);
  if (!incident) {
    return res.status(404).json({ success: false, error: 'Incident not found', timestamp: new Date().toISOString() });
  }

  const profile = await getTouristProfileByUid(req.authUserId!);
  await addTimelineEntry(body.incidentId, {
    actor: 'system',
    message: body.mode === 'video'
      ? `Tourist requested video support${profile?.digitalId ? ` via ${profile.digitalId}` : ''}. Management notified.`
      : `Tourist requested voice contact${body.contactNumber ? ` to ${body.contactNumber}` : ''}.`,
  });

  await sendStaffIncidentAlert(
    body.mode === 'video' ? 'Tourist requested video support' : 'Tourist requested phone contact',
    `${profile?.touristFirstName ?? 'A tourist'} requested ${body.mode === 'video' ? 'video support' : 'voice contact'} for incident ${incident.id}.`,
    incident.id
  );

  return res.json({
    success: true,
    data: {
      notified: true,
      mode: body.mode,
      incidentId: incident.id,
      contactNumber: body.contactNumber ?? profile?.hotelBinding?.hotelPhoneNumber ?? '',
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
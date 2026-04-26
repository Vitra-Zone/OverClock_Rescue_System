import { Router, Request, Response } from 'express';
import {
  getAllIncidents,
  getIncidentById,
  createIncident,
  updateIncidentStatus,
  addTimelineEntry,
  approveAITriage,
  hotelVerifyAndDispatch,
  sectorAcceptIncident,
  sectorResolveIncident,
  hotelCloseIncident,
} from '../services/incidentStore';
import {
  APIResponse,
  CreateIncidentRequest,
  UpdateStatusRequest,
  HotelVerifyDispatchRequest,
  SectorActionRequest,
} from '../types/incident';
import { requireStaffAuth } from '../middleware/auth';
import { scheduleEscalation, clearEscalationForIncident } from '../services/escalationService';
import { sendStaffIncidentAlert } from '../services/notificationService';

const router = Router();

// GET /api/incidents
router.get('/', requireStaffAuth, async (_req: Request, res: Response) => {
  const incidents = await getAllIncidents();
  const response: APIResponse<typeof incidents> = {
    success: true,
    data: incidents,
    timestamp: new Date().toISOString(),
  };
  console.log(`[Incidents] GET /api/incidents — ${incidents.length} incidents`);
  res.json(response);
});

// GET /api/incidents/:id
router.get('/:id', requireStaffAuth, async (req: Request, res: Response) => {
  const incident = await getIncidentById(req.params.id);
  if (!incident) {
    const response: APIResponse = { success: false, error: 'Incident not found', timestamp: new Date().toISOString() };
    return res.status(404).json(response);
  }
  console.log(`[Incidents] GET /api/incidents/${req.params.id}`);
  res.json({ success: true, data: incident, timestamp: new Date().toISOString() });
});

// POST /api/incidents
router.post('/', async (req: Request, res: Response) => {
  const body = req.body as CreateIncidentRequest;
  if (!body.guestName || !body.roomNumber || !body.message || !body.location) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: guestName, roomNumber, message, location',
      timestamp: new Date().toISOString(),
    });
  }
  const incident = await createIncident(body);
  scheduleEscalation(incident.id, 60_000);
  await sendStaffIncidentAlert(
    'New SOS Incident',
    `${incident.incidentType.toUpperCase()} incident at ${incident.location}`,
    incident.id
  );
  console.log(`[Incidents] POST /api/incidents — Created ${incident.id}`);
  res.status(201).json({ success: true, data: incident, timestamp: new Date().toISOString() });
});

// PATCH /api/incidents/:id/status
router.patch('/:id/status', requireStaffAuth, async (req: Request, res: Response) => {
  const body = req.body as UpdateStatusRequest;
  if (!body.status) {
    return res.status(400).json({ success: false, error: 'Missing status field', timestamp: new Date().toISOString() });
  }
  const incident = await updateIncidentStatus(req.params.id, body.status, body.actor ?? 'staff', body.note);
  if (!incident) {
    return res.status(404).json({ success: false, error: 'Incident not found', timestamp: new Date().toISOString() });
  }
  if (['in_progress', 'resolved', 'closed'].includes(body.status)) {
    clearEscalationForIncident(req.params.id);
  }
  console.log(`[Incidents] PATCH /${req.params.id}/status — ${body.status}`);
  res.json({ success: true, data: incident, timestamp: new Date().toISOString() });
});

// POST /api/incidents/:id/timeline
router.post('/:id/timeline', requireStaffAuth, async (req: Request, res: Response) => {
  const { actor, message } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, error: 'Missing message', timestamp: new Date().toISOString() });
  }
  const incident = await addTimelineEntry(req.params.id, { actor: actor ?? 'staff', message });
  if (!incident) {
    return res.status(404).json({ success: false, error: 'Incident not found', timestamp: new Date().toISOString() });
  }
  res.json({ success: true, data: incident, timestamp: new Date().toISOString() });
});

// POST /api/incidents/:id/approve
router.post('/:id/approve', requireStaffAuth, async (req: Request, res: Response) => {
  const incident = await approveAITriage(req.params.id);
  if (!incident) {
    return res.status(404).json({ success: false, error: 'Incident not found', timestamp: new Date().toISOString() });
  }
  clearEscalationForIncident(req.params.id);
  console.log(`[Incidents] POST /${req.params.id}/approve — Staff approved AI triage`);
  res.json({ success: true, data: incident, timestamp: new Date().toISOString() });
});

// POST /api/incidents/:id/hotel-verify-dispatch
router.post('/:id/hotel-verify-dispatch', requireStaffAuth, async (req: Request, res: Response) => {
  const body = req.body as HotelVerifyDispatchRequest;
  if (!Array.isArray(body.sectors)) {
    return res.status(400).json({ success: false, error: 'Missing sectors array', timestamp: new Date().toISOString() });
  }

  const incident = await hotelVerifyAndDispatch(req.params.id, body.sectors, body.note);
  if (!incident) {
    return res.status(404).json({ success: false, error: 'Incident not found', timestamp: new Date().toISOString() });
  }

  console.log(`[Incidents] POST /${req.params.id}/hotel-verify-dispatch`);
  res.json({ success: true, data: incident, timestamp: new Date().toISOString() });
});

// POST /api/incidents/:id/sector-accept
router.post('/:id/sector-accept', requireStaffAuth, async (req: Request, res: Response) => {
  const body = req.body as SectorActionRequest;
  if (!body.sector) {
    return res.status(400).json({ success: false, error: 'Missing sector field', timestamp: new Date().toISOString() });
  }

  const incident = await sectorAcceptIncident(req.params.id, body.sector, body.note);
  if (!incident) {
    return res.status(400).json({ success: false, error: 'Incident not found or sector not dispatched', timestamp: new Date().toISOString() });
  }

  console.log(`[Incidents] POST /${req.params.id}/sector-accept — ${body.sector}`);
  res.json({ success: true, data: incident, timestamp: new Date().toISOString() });
});

// POST /api/incidents/:id/sector-resolve
router.post('/:id/sector-resolve', requireStaffAuth, async (req: Request, res: Response) => {
  const body = req.body as SectorActionRequest;
  if (!body.sector) {
    return res.status(400).json({ success: false, error: 'Missing sector field', timestamp: new Date().toISOString() });
  }

  const incident = await sectorResolveIncident(req.params.id, body.sector, body.note);
  if (!incident) {
    return res.status(400).json({ success: false, error: 'Incident not found or sector not dispatched', timestamp: new Date().toISOString() });
  }

  console.log(`[Incidents] POST /${req.params.id}/sector-resolve — ${body.sector}`);
  res.json({ success: true, data: incident, timestamp: new Date().toISOString() });
});

// POST /api/incidents/:id/hotel-close
router.post('/:id/hotel-close', requireStaffAuth, async (req: Request, res: Response) => {
  const { note } = req.body as { note?: string };
  const incident = await hotelCloseIncident(req.params.id, note);
  if (!incident) {
    return res.status(400).json({ success: false, error: 'Incident cannot be closed yet', timestamp: new Date().toISOString() });
  }

  console.log(`[Incidents] POST /${req.params.id}/hotel-close`);
  res.json({ success: true, data: incident, timestamp: new Date().toISOString() });
});

export default router;

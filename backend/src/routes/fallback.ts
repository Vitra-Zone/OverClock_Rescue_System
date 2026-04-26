import { Router, Request, Response } from 'express';
import { getIncidentById, addTimelineEntry } from '../services/incidentStore';

const router = Router();

// Delivery processing delay helper
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// POST /api/fallback/sms
router.post('/sms', async (req: Request, res: Response) => {
  const { incidentId, recipientInfo } = req.body;
  
  if (!incidentId) {
    return res.status(400).json({ success: false, error: 'Missing incidentId', timestamp: new Date().toISOString() });
  }

  const incident = await getIncidentById(incidentId);
  if (!incident) {
    return res.status(404).json({ success: false, error: 'Incident not found', timestamp: new Date().toISOString() });
  }

  // Queue SMS dispatch
  await delay(300);

  const smsContent = `[Hackdays ALERT] Incident ${incidentId.toUpperCase()} — ${incident.incidentType?.toUpperCase() ?? 'EMERGENCY'} at ${incident.location}. Guest: ${incident.guestName}. "${incident.message.slice(0, 100)}". Staff please respond.`;
  
  const recipient = recipientInfo ?? '+91-XXXX-XXXXXX (Hotel Emergency Line)';
  
  await addTimelineEntry(incidentId, {
    actor: 'system',
    message: `SMS fallback dispatched to ${recipient}.`,
  });

  console.log(`[Fallback] SMS queued for ${incidentId} → ${recipient}`);
  console.log(`[Fallback] SMS content: ${smsContent}`);

  res.json({
    success: true,
    data: {
      mode: 'sms',
      status: 'queued_sent',
      recipient,
      smsContent,
      processedAt: new Date().toISOString(),
      note: 'This route is wired for the local fallback workflow. Connect a provider such as Twilio for live delivery.',
    },
    timestamp: new Date().toISOString(),
  });
});

// POST /api/fallback/voice
router.post('/voice', async (req: Request, res: Response) => {
  const { incidentId, recipientInfo } = req.body;
  
  if (!incidentId) {
    return res.status(400).json({ success: false, error: 'Missing incidentId', timestamp: new Date().toISOString() });
  }

  const incident = await getIncidentById(incidentId);
  if (!incident) {
    return res.status(404).json({ success: false, error: 'Incident not found', timestamp: new Date().toISOString() });
  }

  await delay(500);

  const callScript = `Automated emergency call from Hackdays. An incident has been reported at ${incident.location}. Incident type: ${incident.incidentType ?? 'UNKNOWN'}. Severity: ${incident.severity ?? 'UNKNOWN'}. Guest name: ${incident.guestName}. Please respond immediately.`;

  const recipient = recipientInfo ?? 'Hotel Emergency Hotline (+91-XXXX-XXXXXX)';

  await addTimelineEntry(incidentId, {
    actor: 'system',
    message: `Voice call fallback initiated to ${recipient}.`,
  });

  console.log(`[Fallback] VOICE call queued for ${incidentId} → ${recipient}`);

  res.json({
    success: true,
    data: {
      mode: 'voice',
      status: 'queued_calling',
      recipient,
      callScript,
      estimatedDuration: '45 seconds',
      processedAt: new Date().toISOString(),
      note: 'This route is wired for the local fallback workflow. Connect a voice provider such as Twilio Voice for live delivery.',
    },
    timestamp: new Date().toISOString(),
  });
});

// POST /api/fallback/video
router.post('/video', async (req: Request, res: Response) => {
  const { incidentId } = req.body;
  
  if (!incidentId) {
    return res.status(400).json({ success: false, error: 'Missing incidentId', timestamp: new Date().toISOString() });
  }

  const incident = await getIncidentById(incidentId);
  if (!incident) {
    return res.status(404).json({ success: false, error: 'Incident not found', timestamp: new Date().toISOString() });
  }

  await delay(200);

  const roomId = `hackdays-${incidentId}-${Date.now()}`;
  
  await addTimelineEntry(incidentId, {
    actor: 'system',
    message: `Live video/help session initiated. Room: ${roomId}`,
  });

  console.log(`[Fallback] VIDEO session queued for ${incidentId} — room: ${roomId}`);

  res.json({
    success: true,
    data: {
      mode: 'video',
      status: 'queued_connecting',
      roomId,
      meetUrl: `https://meet.hackdays.local/${roomId}`,
      agentName: 'Hackdays Emergency Coordinator',
      estimatedWait: '< 30 seconds',
      processedAt: new Date().toISOString(),
      note: 'This route is wired for the local fallback workflow. Connect WebRTC or Google Meet for live video delivery.',
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;

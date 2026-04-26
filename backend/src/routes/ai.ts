import { Router, Request, Response } from 'express';
import {
  triageIncident,
  orchestrateAgent,
  generateAnalytics,
  makeOperationalDecision,
  logIncident,
  logAgentDecision,
} from '../services/aiService';
import { getIncidentById, applyAITriage, addTimelineEntry } from '../services/incidentStore';
import { requireStaffAuth } from '../middleware/auth';

const router = Router();

// POST /api/ai/triage
router.post('/triage', async (req: Request, res: Response) => {
  const { incidentId, message, location } = req.body;
  
  if (!message || !location) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: message, location',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    console.log(`[AI] Running triage for incident ${incidentId ?? 'ad-hoc'}...`);
    const triage = await triageIncident(message, location);
    
    // If incidentId provided, apply triage to the stored incident
    let updatedIncident = null;
    if (incidentId) {
      updatedIncident = await applyAITriage(incidentId, triage);
    }

    console.log(`[AI] Triage complete: ${triage.incidentType} / ${triage.severity}`);
    res.json({
      success: true,
      data: { triage, incident: updatedIncident },
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown AI error';
    console.error('[AI] Triage error:', msg);
    res.status(500).json({ success: false, error: `AI triage failed: ${msg}`, timestamp: new Date().toISOString() });
  }
});

// POST /api/ai/orchestrate
router.post('/orchestrate', requireStaffAuth, async (req: Request, res: Response) => {
  const { incidentId } = req.body;
  
  if (!incidentId) {
    return res.status(400).json({
      success: false,
      error: 'Missing incidentId',
      timestamp: new Date().toISOString(),
    });
  }

  const incident = await getIncidentById(incidentId);
  if (!incident) {
    return res.status(404).json({ success: false, error: 'Incident not found', timestamp: new Date().toISOString() });
  }

  try {
    const summary = incident.aiSummary ?? incident.message;
    const decision = await orchestrateAgent(summary, incident.status, incident.humanApproved ?? false);
    const updatedIncident = await addTimelineEntry(incidentId, {
      actor: 'ai',
      message: `Agent decision: ${decision.action} (${decision.urgency}) - ${decision.reasoning}`,
    });
    
    console.log(`[AI] Orchestration for ${incidentId}: ${decision.action}`);
    res.json({
      success: true,
      data: { decision, incident: updatedIncident ?? incident },
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: `Orchestration failed: ${msg}`, timestamp: new Date().toISOString() });
  }
});

// ─── Real Agent: Analytics & Operational Decisions ───────────────────────────

// POST /api/ai/analytics
// Generate comprehensive analytics on incident handling and system performance
router.post('/analytics', requireStaffAuth, async (_req: Request, res: Response) => {
  try {
    console.log('[AI Agent] Generating analytics report...');
    const analytics = await generateAnalytics();
    
    console.log(`[AI Agent] Analytics: ${analytics.totalIncidents} incidents, ${analytics.criticalCount} critical, efficiency: ${analytics.efficiency_score}/100`);
    res.json({
      success: true,
      data: {
        analytics,
        timestamp: new Date().toISOString(),
        source: 'real_agent_analytics',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: `Analytics generation failed: ${msg}`,
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /api/ai/operational-decision
// AI Agent makes real backend decisions based on analytics
router.post('/operational-decision', requireStaffAuth, async (req: Request, res: Response) => {
  const { context } = req.body;

  if (!context) {
    return res.status(400).json({
      success: false,
      error: 'Missing context for operational decision',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    console.log('[AI Agent] Processing operational decision request...');
    const analytics = await generateAnalytics();
    const decision = await makeOperationalDecision(analytics, context);
    await logAgentDecision(decision);

    console.log(`[AI Agent] Decision: ${decision.type} - ${decision.decision}`);
    console.log(`[AI Agent] Requires Approval: ${decision.requiresApproval}, Auto Execute: ${decision.autoExecute}`);

    res.json({
      success: true,
      data: {
        decision,
        analytics: {
          efficiency: analytics.efficiency_score,
          criticalIncidents: analytics.criticalCount,
          staffUtilization: analytics.staffUtilization,
        },
        timestamp: new Date().toISOString(),
        source: 'real_agent_operational',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: `Operational decision failed: ${msg}`,
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /api/ai/log-incident
// Log incident for analytics tracking
router.post('/log-incident', requireStaffAuth, async (req: Request, res: Response) => {
  const { id, type, severity, location, responseTime, assignedStaff, status } = req.body;

  if (!id || !type || !severity || !location) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields for incident logging',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    await logIncident({
      id,
      type,
      severity,
      location,
      responseTime: responseTime ?? 0,
      assignedStaff: assignedStaff ?? 'unassigned',
      status: status ?? 'pending',
    });

    console.log(`[AI Agent] Logged incident: ${id} (${severity} ${type})`);
    res.json({
      success: true,
      data: { message: 'Incident logged for analytics' },
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: `Failed to log incident: ${msg}`,
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /api/ai/agent-health
// Real agent health check and operational status
router.post('/agent-health', requireStaffAuth, async (_req: Request, res: Response) => {
  try {
    const analytics = await generateAnalytics();
    const isHealthy = analytics.efficiency_score > 60 && analytics.resolutionRate > 70;

    res.json({
      success: true,
      data: {
        status: isHealthy ? 'healthy' : 'degraded',
        efficiency: analytics.efficiency_score,
        lastIncidents: analytics.totalIncidents,
        criticalCount: analytics.criticalCount,
        avgResponseTime: analytics.averageResponseTime,
        staffUtilization: analytics.staffUtilization,
        resolutionRate: analytics.resolutionRate,
        riskPatterns: analytics.riskPatterns,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: `Agent health check failed: ${msg}`,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;

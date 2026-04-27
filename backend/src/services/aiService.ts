import { AITriageResult, IncidentType, Severity, AssignedRole, FallbackMode, Incident } from '../types/incident';
import type { TouristProfile } from '../types/tourist';
import { getFirestore, isFirebaseEnabled } from './firebaseAdmin';
import { getAllIncidents } from './incidentStore';

const geminiApiKey = process.env.GEMINI_API_KEY?.trim() ?? '';
const geminiModel = process.env.GEMINI_MODEL?.trim() ?? 'gemini-2.0-flash';
const geminiEnabled = Boolean(geminiApiKey);

// ─── Local rule-based triage engine (no external AI dependency) ──────────────
console.log(geminiEnabled
  ? `[AIService] Gemini mode enabled (${geminiModel}) with local fallback.`
  : '[AIService] Running in local rule-based triage mode.');

// Keywords for rule-based classification
const INCIDENT_KEYWORDS: Record<IncidentType, string[]> = {
  medical: ['chest', 'pain', 'breathe', 'breathing', 'heart', 'faint', 'unconscious', 'blood', 'hurt', 'injury', 'injured', 'sick', 'medical', 'health', 'emergency', 'fell', 'fall', 'seizure', 'allergic'],
  fire: ['fire', 'smoke', 'burn', 'flame', 'hot', 'smell', 'burning', 'alarm', 'electrical', 'short circuit', 'spark', 'gas leak'],
  security: ['threat', 'security threat', 'suspicious', 'unsafe', 'robbery', 'theft', 'stolen', 'violence', 'attack', 'dangerous', 'intruder', 'weapon'],
  earthquake: ['earthquake', 'shaking', 'tremor', 'quake', 'rumbling'],
  flood: ['flood', 'water', 'leak', 'pipe', 'overflow', 'submerged'],
  likely_fake: ['test', 'testing', 'prank', 'joke', 'fake', 'just kidding'],
  general: ['help', 'assist', 'issue', 'problem', 'stuck'],
  unknown: [],
};

const SEVERITY_KEYWORDS: Record<Severity, string[]> = {
  critical: ['cannot breathe', 'unconscious', 'fire', 'weapon', 'gun', 'knife', 'explosion', 'chest pain', 'not breathing', 'critical', 'severe'],
  high: ['pain', 'blood', 'hurt', 'smoke', 'threat', 'attack', 'injured', 'high', 'urgent'],
  medium: ['suspicious', 'unsafe', 'discomfort', 'concerned', 'worried', 'issue'],
  low: ['minor', 'small', 'slight', 'question', 'inquiry'],
};

const EMERGENCY_SIGNAL_KEYWORDS = [
  'help',
  'emergency',
  'pain',
  'blood',
  'fire',
  'smoke',
  'threat',
  'attack',
  'unconscious',
  'injury',
  'injured',
  'breathe',
  'breathing',
  'robbery',
  'earthquake',
  'flood',
  'stuck',
  'unsafe',
  'danger',
];

const NON_EMERGENCY_HINTS = [
  'test',
  'testing',
  'just testing',
  'just kidding',
  'kidding',
  'prank',
  'fun',
  'timepass',
  'lol',
  'hehe',
  'haha',
];

function countKeywordHits(message: string, keywords: string[]): number {
  const lower = message.toLowerCase();
  return keywords.filter((keyword) => lower.includes(keyword)).length;
}

function isLikelyNonEmergency(message: string): boolean {
  const lower = message.toLowerCase().trim();
  const tokens = lower.split(/\s+/).filter(Boolean);
  const hasEmergencySignal = EMERGENCY_SIGNAL_KEYWORDS.some((kw) => lower.includes(kw));
  const hasNonEmergencyHint = NON_EMERGENCY_HINTS.some((kw) => lower.includes(kw));
  const hasLongRepeatedChars = /(.)\1{5,}/.test(lower.replace(/\s+/g, ''));
  const shortAndVague = lower.length < 18 && tokens.length <= 3;

  if (hasEmergencySignal) return false;
  return hasNonEmergencyHint || hasLongRepeatedChars || shortAndVague;
}

function classifyIncident(message: string): IncidentType {
  const lower = message.toLowerCase();
  for (const [type, keywords] of Object.entries(INCIDENT_KEYWORDS) as [IncidentType, string[]][]) {
    if (type === 'unknown') continue;
    if (keywords.some((kw) => lower.includes(kw))) return type;
  }
  return 'general';
}

function scoreSeverity(message: string, type: IncidentType): Severity {
  const lower = message.toLowerCase();
  if (type === 'fire') return 'critical';
  for (const [level, keywords] of Object.entries(SEVERITY_KEYWORDS) as [Severity, string[]][]) {
    if (keywords.some((kw) => lower.includes(kw))) return level;
  }
  return 'medium';
}

function assignRole(type: IncidentType): AssignedRole {
  switch (type) {
    case 'medical':     return 'nearest_medical_staff';
    case 'fire':        return 'fire_safety_officer';
    case 'security':    return 'security_team';
    case 'earthquake':  return 'emergency_services';
    case 'flood':       return 'general_staff';
    case 'likely_fake': return 'front_desk';
    default:            return 'front_desk';
  }
}

function recommendNextAction(type: IncidentType, severity: Severity): string {
  if (type === 'likely_fake') return 'verify_guest_intent';
  if (type === 'fire') return 'activate_fire_alarm_and_evacuate';
  if (type === 'medical' && (severity === 'critical' || severity === 'high')) return 'dispatch_staff_and_call_helpline';
  if (type === 'security') return 'dispatch_security_and_monitor';
  if (type === 'earthquake') return 'initiate_evacuation_protocol';
  return 'dispatch_nearest_staff';
}

function recommendFallback(message: string): FallbackMode {
  const lower = message.toLowerCase();
  if (lower.includes('no internet') || lower.includes('offline')) return 'sms';
  return 'none';
}

function generateFollowUp(type: IncidentType): string {
  switch (type) {
    case 'medical':     return 'Is the guest conscious and able to speak?';
    case 'fire':        return 'Can you see open flames or is it just smoke?';
    case 'security':    return 'Are you in immediate danger? Can you lock the door?';
    case 'earthquake':  return 'Are you injured? Is the structure stable?';
    case 'flood':       return 'How deep is the water? Are cables or wires exposed?';
    case 'likely_fake': return 'Confirm now: Is this an actual emergency requiring dispatch?';
    default:            return 'Can you describe the situation in more detail?';
  }
}

function generateSummary(type: IncidentType, severity: Severity, location: string, message: string): string {
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return `${cap(severity)}-severity ${type} incident reported at ${location}. "${message.slice(0, 80)}${message.length > 80 ? '...' : ''}"`;
}

function buildWorkflowSteps(
  incidentType: IncidentType,
  severity: Severity,
  assignedTo: AssignedRole,
  nextAction: string,
  fallbackMode: FallbackMode,
  confidence: number
): string[] {
  const steps = [
    'Guest input captured and normalized',
    `Incident classified as ${incidentType} with ${severity} severity`,
    `Dispatch target resolved to ${assignedTo}`,
    `Recommended action: ${nextAction.replace(/_/g, ' ')}`,
  ];

  if (fallbackMode !== 'none') {
    steps.push(`Fallback channel prepared: ${fallbackMode}`);
  }

  steps.push(confidence >= 75 ? 'High-confidence triage ready for hotel-side review' : 'Low-confidence triage flagged for guest verification');
  return steps;
}

function buildWorkflowStage(incidentType: IncidentType, nextAction: string): 'intake' | 'analysis' | 'verification' | 'dispatch' | 'monitoring' {
  if (nextAction === 'verify_guest_intent') return 'verification';
  if (incidentType === 'general') return 'analysis';
  if (nextAction.includes('dispatch')) return 'dispatch';
  return 'monitoring';
}

function buildConfidence(message: string, incidentType: IncidentType, severity: Severity): number {
  const keywordRichness = Math.min(20, countKeywordHits(message, [...INCIDENT_KEYWORDS[incidentType], ...SEVERITY_KEYWORDS[severity]]));
  const lengthScore = Math.min(15, Math.floor(message.length / 20));
  const emergencyBoost = isLikelyNonEmergency(message) ? -25 : 20;
  const base = 45 + keywordRichness * 2 + lengthScore + emergencyBoost;
  return Math.max(10, Math.min(98, base));
}

function buildAnalyticsSnapshot(message: string, incidentType: IncidentType, severity: Severity, fallbackMode: FallbackMode) {
  const emergencySignals = countKeywordHits(message, EMERGENCY_SIGNAL_KEYWORDS);
  const nonEmergencySignals = countKeywordHits(message, NON_EMERGENCY_HINTS);
  const keywordHits = countKeywordHits(message, [
    ...INCIDENT_KEYWORDS[incidentType],
    ...SEVERITY_KEYWORDS[severity],
  ]);

  return {
    messageLength: message.trim().length,
    keywordHits,
    emergencySignals,
    nonEmergencySignals: fallbackMode === 'none' ? nonEmergencySignals : nonEmergencySignals + 1,
  };
}

function normalizeIncidentType(value: string | undefined): IncidentType {
  const v = (value ?? '').toLowerCase().trim();
  if (v === 'medical' || v === 'fire' || v === 'security' || v === 'earthquake' || v === 'flood' || v === 'likely_fake' || v === 'general' || v === 'unknown') {
    return v;
  }
  if (v === 'health') return 'medical';
  if (v === 'electrical') return 'fire';
  if (v === 'security threat') return 'security';
  return 'general';
}

function normalizeSeverity(value: string | undefined): Severity {
  const v = (value ?? '').toLowerCase().trim();
  if (v === 'critical' || v === 'high' || v === 'medium' || v === 'low') {
    return v;
  }
  return 'medium';
}

function normalizeAssignedRole(value: string | undefined, incidentType: IncidentType): AssignedRole {
  const v = (value ?? '').trim() as AssignedRole;
  const allowed: AssignedRole[] = [
    'nearest_medical_staff',
    'security_team',
    'front_desk',
    'fire_safety_officer',
    'general_staff',
    'emergency_services',
    'unassigned',
  ];
  if (allowed.includes(v)) return v;
  return assignRole(incidentType);
}

function normalizeFallbackMode(value: string | undefined): FallbackMode {
  const v = (value ?? '').toLowerCase().trim();
  if (v === 'none' || v === 'sms' || v === 'voice' || v === 'video') {
    return v;
  }
  return 'none';
}

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith('```')) return trimmed;
  return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

function tryParseJsonObject(text: string): Record<string, unknown> | null {
  const cleaned = stripCodeFence(text);
  try {
    const parsed = JSON.parse(cleaned) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Ignore parse errors and try extracting JSON object boundaries.
  }

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) return null;

  try {
    const sliced = cleaned.slice(start, end + 1);
    const parsed = JSON.parse(sliced) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }

  return null;
}

async function callGemini(prompt: string): Promise<Record<string, unknown> | null> {
  if (!geminiEnabled) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${geminiApiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text:
              'You are an emergency triage/orchestration assistant for hospitality incidents. ' +
              'Return STRICT JSON only with no markdown and no extra text.',
          }],
        },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          topP: 0.9,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json() as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    return tryParseJsonObject(text);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Deterministic triage ─────────────────────────────────────────────────────
function ruleBasedTriage(message: string, location: string): AITriageResult {
  if (isLikelyNonEmergency(message)) {
    const incidentType: IncidentType = 'likely_fake';
    const severity: Severity = 'low';
    const assignedTo: AssignedRole = 'front_desk';
    const nextAction = 'verify_guest_intent';
    const fallbackMode: FallbackMode = 'none';
    const confidence = buildConfidence(message, incidentType, severity);
    return {
      incidentType,
      severity,
      assignedTo,
      nextAction,
      fallbackMode,
      summary:
        `Possible non-emergency/test message detected at ${location}. ` +
        'Hold urgent dispatch and verify with guest first.',
      followUpQuestion:
        'Please confirm: is this a real emergency right now? If yes, describe immediate danger in one sentence.',
      workflowStage: 'verification',
      workflowSteps: buildWorkflowSteps(incidentType, severity, assignedTo, nextAction, fallbackMode, confidence),
      confidence,
      analytics: buildAnalyticsSnapshot(message, incidentType, severity, fallbackMode),
    };
  }

  const incidentType = classifyIncident(message);
  const severity = scoreSeverity(message, incidentType);
  const assignedTo = assignRole(incidentType);
  const nextAction = recommendNextAction(incidentType, severity);
  const fallbackMode = recommendFallback(message);
  const summary = generateSummary(incidentType, severity, location, message);
  const followUpQuestion = generateFollowUp(incidentType);
  const confidence = buildConfidence(message, incidentType, severity);
  const analytics = buildAnalyticsSnapshot(message, incidentType, severity, fallbackMode);

  return {
    incidentType,
    severity,
    assignedTo,
    nextAction,
    fallbackMode,
    summary,
    followUpQuestion,
    workflowStage: buildWorkflowStage(incidentType, nextAction),
    workflowSteps: buildWorkflowSteps(incidentType, severity, assignedTo, nextAction, fallbackMode, confidence),
    confidence,
    analytics,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function triageIncident(message: string, location: string): Promise<AITriageResult> {
  const fallback = ruleBasedTriage(message, location);
  if (!geminiEnabled) return fallback;

  const prompt = [
    'Return JSON with keys: incidentType, severity, assignedTo, nextAction, fallbackMode, summary, followUpQuestion.',
    'Allowed incidentType: medical, fire, security, earthquake, flood, likely_fake, general, unknown.',
    'Allowed severity: low, medium, high, critical.',
    'Allowed assignedTo: nearest_medical_staff, security_team, front_desk, fire_safety_officer, general_staff, emergency_services, unassigned.',
    'Allowed fallbackMode: none, sms, voice, video.',
    `Guest message: ${message}`,
    `Location: ${location}`,
  ].join('\n');

  const ai = await callGemini(prompt);
  if (!ai) return fallback;

  const incidentType = normalizeIncidentType(typeof ai.incidentType === 'string' ? ai.incidentType : undefined);
  const severity = normalizeSeverity(typeof ai.severity === 'string' ? ai.severity : undefined);
  const assignedTo = normalizeAssignedRole(typeof ai.assignedTo === 'string' ? ai.assignedTo : undefined, incidentType);
  const fallbackMode = normalizeFallbackMode(typeof ai.fallbackMode === 'string' ? ai.fallbackMode : undefined);
  const summary = typeof ai.summary === 'string' && ai.summary.trim()
    ? ai.summary.trim()
    : fallback.summary;
  const followUpQuestion = typeof ai.followUpQuestion === 'string' && ai.followUpQuestion.trim()
    ? ai.followUpQuestion.trim()
    : fallback.followUpQuestion;
  const nextAction = typeof ai.nextAction === 'string' && ai.nextAction.trim()
    ? ai.nextAction.trim().toLowerCase().replace(/\s+/g, '_')
    : fallback.nextAction;
  const confidence = typeof ai.confidence === 'number' && Number.isFinite(ai.confidence)
    ? Math.max(0, Math.min(100, ai.confidence))
    : fallback.confidence;
  const workflowStage = typeof ai.workflowStage === 'string'
    ? buildWorkflowStage(incidentType, nextAction)
    : fallback.workflowStage;
  const workflowSteps = Array.isArray(ai.workflowSteps) && ai.workflowSteps.every((item) => typeof item === 'string')
    ? ai.workflowSteps.map((item) => item.trim()).filter(Boolean)
    : fallback.workflowSteps;
  const analytics = typeof ai.analytics === 'object' && ai.analytics
    ? {
        messageLength: typeof (ai.analytics as Record<string, unknown>).messageLength === 'number'
          ? Number((ai.analytics as Record<string, unknown>).messageLength)
          : fallback.analytics.messageLength,
        keywordHits: typeof (ai.analytics as Record<string, unknown>).keywordHits === 'number'
          ? Number((ai.analytics as Record<string, unknown>).keywordHits)
          : fallback.analytics.keywordHits,
        emergencySignals: typeof (ai.analytics as Record<string, unknown>).emergencySignals === 'number'
          ? Number((ai.analytics as Record<string, unknown>).emergencySignals)
          : fallback.analytics.emergencySignals,
        nonEmergencySignals: typeof (ai.analytics as Record<string, unknown>).nonEmergencySignals === 'number'
          ? Number((ai.analytics as Record<string, unknown>).nonEmergencySignals)
          : fallback.analytics.nonEmergencySignals,
      }
    : fallback.analytics;

  return {
    incidentType,
    severity,
    assignedTo,
    nextAction,
    fallbackMode,
    summary,
    followUpQuestion,
    workflowStage,
    workflowSteps,
    confidence,
    analytics,
  };
}

// ─── Agent manager orchestration ─────────────────────────────────────────────
export interface AgentDecision {
  action: string;
  reasoning: string;
  urgency: 'immediate' | 'high' | 'standard';
  shouldEscalate: boolean;
  draftMessage: string;
  recommendClose: boolean;
}

export async function orchestrateAgent(
  incidentSummary: string,
  currentStatus: string,
  humanApproved: boolean
): Promise<AgentDecision> {
  const fallback = ruleBasedOrchestrate(incidentSummary, currentStatus, humanApproved);
  if (!geminiEnabled) return fallback;

  const prompt = [
    'Return JSON with keys: action, reasoning, urgency, shouldEscalate, draftMessage, recommendClose.',
    'Allowed urgency: immediate, high, standard.',
    'Use realistic but concise operations language for hotel response teams.',
    `Incident summary: ${incidentSummary}`,
    `Current status: ${currentStatus}`,
    `Human approved: ${humanApproved}`,
  ].join('\n');

  const ai = await callGemini(prompt);
  if (!ai) return fallback;

  const urgencyRaw = typeof ai.urgency === 'string' ? ai.urgency.toLowerCase().trim() : '';
  const urgency: AgentDecision['urgency'] =
    urgencyRaw === 'immediate' || urgencyRaw === 'high' || urgencyRaw === 'standard'
      ? urgencyRaw
      : fallback.urgency;

  const action = typeof ai.action === 'string' && ai.action.trim()
    ? ai.action.trim().toLowerCase().replace(/\s+/g, '_')
    : fallback.action;
  const reasoning = typeof ai.reasoning === 'string' && ai.reasoning.trim()
    ? ai.reasoning.trim()
    : fallback.reasoning;
  const draftMessage = typeof ai.draftMessage === 'string' && ai.draftMessage.trim()
    ? ai.draftMessage.trim()
    : fallback.draftMessage;

  const shouldEscalate = typeof ai.shouldEscalate === 'boolean'
    ? ai.shouldEscalate
    : fallback.shouldEscalate;
  const recommendClose = typeof ai.recommendClose === 'boolean'
    ? ai.recommendClose
    : fallback.recommendClose;

  return {
    action,
    reasoning,
    urgency,
    shouldEscalate,
    draftMessage,
    recommendClose,
  };
}

export interface TouristGuidanceReply {
  reply: string;
  actionItems: string[];
  mode: 'gemini' | 'rule_based';
}

function buildTouristGuidanceFallback(
  message: string,
  profile?: TouristProfile | null,
  incidentContext?: { incidentType?: string; severity?: string; location?: string; status?: string }
): TouristGuidanceReply {
  const lower = message.toLowerCase();
  const urgent = lower.includes('fire') || lower.includes('blood') || lower.includes('unconscious') || lower.includes('danger');
  const title = profile?.touristFirstName ? `${profile.touristFirstName}, ` : '';
  const incidentBits = incidentContext?.incidentType ? ` for a ${incidentContext.incidentType} incident` : '';

  return {
    reply: urgent
      ? `${title}move to safety immediately${incidentBits}. Stay calm, alert hotel staff, and keep your phone ready.`
      : `${title}here is the safest next step${incidentBits}: keep calm, follow the hotel guidance, and share one clear detail at a time.`,
    actionItems: urgent
      ? ['Move away from danger', 'Call hotel staff or emergency services', 'Share your exact location']
      : ['State the problem in one line', 'Keep the app open for updates', 'Use SOS if the situation changes'],
    mode: 'rule_based',
  };
}

export async function generateTouristGuidanceReply(
  message: string,
  profile?: TouristProfile | null,
  incidentContext?: { incidentType?: string; severity?: string; location?: string; status?: string }
): Promise<TouristGuidanceReply> {
  const fallback = buildTouristGuidanceFallback(message, profile, incidentContext);

  if (!geminiEnabled) {
    return fallback;
  }

  const prompt = [
    'You are a calm, concise tourist emergency assistant for a hotel rescue system.',
    'Return STRICT JSON with keys: reply, actionItems.',
    'Reply should be short, practical, and reassuring.',
    'Action items should be an array of 2 to 4 short imperative sentences.',
    `Tourist profile: ${JSON.stringify(profile ?? null)}`,
    `Incident context: ${JSON.stringify(incidentContext ?? null)}`,
    `Tourist message: ${message}`,
  ].join('\n');

  const ai = await callGemini(prompt);
  if (!ai) return fallback;

  const reply = typeof ai.reply === 'string' && ai.reply.trim() ? ai.reply.trim() : fallback.reply;
  const actionItems = Array.isArray(ai.actionItems) && ai.actionItems.every((item) => typeof item === 'string')
    ? ai.actionItems.map((item) => item.trim()).filter(Boolean).slice(0, 4)
    : fallback.actionItems;

  return {
    reply,
    actionItems,
    mode: 'gemini',
  };
}

function ruleBasedOrchestrate(
  incidentSummary: string,
  currentStatus: string,
  humanApproved: boolean
): AgentDecision {
  const lower = incidentSummary.toLowerCase();
  
  // Real agent decision logic with operational optimization
  const isResolved = currentStatus === 'resolved' || currentStatus === 'closed';
  const isCritical = lower.includes('critical') || lower.includes('fire') || lower.includes('unconscious');
  const isInProgress = currentStatus === 'in_progress';

  if (isResolved) {
    return {
      action: 'mark_for_closure',
      reasoning: 'Incident has been resolved. Recommend closing after log review.',
      urgency: 'standard',
      shouldEscalate: false,
      draftMessage: 'Incident resolved. Please confirm closure and ensure guest follow-up.',
      recommendClose: true,
    };
  }

  if (isCritical && !humanApproved) {
    return {
      action: 'request_human_approval',
      reasoning: 'Critical incident detected. Human approval required before escalation.',
      urgency: 'immediate',
      shouldEscalate: true,
      draftMessage: 'URGENT: Critical incident requires immediate staff attention and approval.',
      recommendClose: false,
    };
  }

  if (isInProgress && humanApproved) {
    return {
      action: 'monitor_and_update',
      reasoning: 'Staff is engaged. Monitoring for status updates.',
      urgency: 'standard',
      shouldEscalate: false,
      draftMessage: 'Incident in progress. Staff on site. Monitor for updates every 5 minutes.',
      recommendClose: false,
    };
  }

  return {
    action: 'dispatch_and_notify',
    reasoning: 'Assigned staff not yet confirmed on site. Re-notify and track ETA.',
    urgency: 'high',
    shouldEscalate: false,
    draftMessage: 'Staff dispatched. Awaiting confirmation of arrival at incident location.',
    recommendClose: false,
  };
}

// ─── Real Backend Agent: Analytics, Resource Management, Operational Decisions ──

export interface AIAgentAnalytics {
  totalIncidents: number;
  criticalCount: number;
  averageResponseTime: number;
  staffUtilization: number;
  topIncidentTypes: Array<{ type: string; count: number }>;
  peakHours: Array<{ hour: number; count: number }>;
  resolutionRate: number;
  recommendedActions: string[];
  staffAllocationOptimization: Record<string, number>;
  riskPatterns: string[];
  efficiency_score: number;
}

export interface RealAgentDecision {
  decisionId: string;
  timestamp: string;
  type: 'resource_allocation' | 'priority_adjustment' | 'staff_scheduling' | 'escalation' | 'prevention' | 'optimization';
  decision: string;
  reasoning: string;
  expectedImpact: string;
  metrics: Record<string, number | string>;
  autoExecute: boolean;
  requiresApproval: boolean;
}

const ANALYTICS_COLLECTION = 'incident_metrics';
const DECISION_COLLECTION = 'ai_decisions';

function getIncidentResponseTime(incident: Incident): number {
  const createdAt = new Date(incident.createdAt).getTime();
  const updatedAt = new Date(incident.updatedAt).getTime();
  if (!Number.isFinite(createdAt) || !Number.isFinite(updatedAt) || updatedAt <= createdAt) return 0;
  return Math.round((updatedAt - createdAt) / 1000);
}

export async function logIncident(incident: {
  id: string;
  type: string;
  severity: string;
  location: string;
  responseTime: number;
  assignedStaff: string;
  status: string;
}): Promise<void> {
  if (!isFirebaseEnabled()) return;
  const db = getFirestore();
  if (!db) return;
  await db.collection(ANALYTICS_COLLECTION).doc(incident.id).set({
    ...incident,
    timestamp: Date.now(),
  }, { merge: true });
}

export async function logAgentDecision(decision: RealAgentDecision): Promise<void> {
  if (!isFirebaseEnabled()) return;
  const db = getFirestore();
  if (!db) return;
  await db.collection(DECISION_COLLECTION).doc(decision.decisionId).set({
    ...decision,
    recordedAt: Date.now(),
  }, { merge: true });
}

export async function generateAnalytics(): Promise<AIAgentAnalytics> {
  const last24Hours = Date.now() - 24 * 60 * 60 * 1000;
  const incidents = await getAllIncidents();
  const recentIncidents = incidents.filter((incident) => {
    const ts = new Date(incident.updatedAt || incident.createdAt).getTime();
    return Number.isFinite(ts) && ts > last24Hours;
  });

  const analyticsRows = recentIncidents.map((incident) => ({
    id: incident.id,
    type: incident.incidentType,
    severity: incident.severity,
    location: incident.location,
    timestamp: new Date(incident.updatedAt || incident.createdAt).getTime(),
    responseTime: getIncidentResponseTime(incident),
    assignedStaff: incident.assignedTo,
    status: incident.status,
  }));

  const criticalCount = analyticsRows.filter((i) => i.severity === 'critical').length;
  const totalIncidents = analyticsRows.length;

  const avgResponseTime = totalIncidents > 0
    ? Math.round(
        analyticsRows.reduce((sum, i) => sum + i.responseTime, 0) / totalIncidents
      )
    : 0;

  // Count incident types
  const typeMap: Record<string, number> = {};
  analyticsRows.forEach((i) => {
    typeMap[i.type] = (typeMap[i.type] ?? 0) + 1;
  });
  const topIncidentTypes = Object.entries(typeMap)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Peak hours analysis
  const hourMap: Record<number, number> = {};
  analyticsRows.forEach((i) => {
    const hour = new Date(i.timestamp).getHours();
    hourMap[hour] = (hourMap[hour] ?? 0) + 1;
  });
  const peakHours = Object.entries(hourMap)
    .map(([hour, count]) => ({ hour: parseInt(hour, 10), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Staff allocation optimization
  const staffMap: Record<string, number> = {};
  analyticsRows.forEach((i) => {
    staffMap[i.assignedStaff] = (staffMap[i.assignedStaff] ?? 0) + 1;
  });
  const staffUtilization = Object.keys(staffMap).length > 0
    ? Math.round((totalIncidents / Object.keys(staffMap).length) * 100) / 100
    : 0;

  // Resolution rate
  const resolvedCount = analyticsRows.filter((i) => i.status === 'resolved' || i.status === 'closed').length;
  const resolutionRate = totalIncidents > 0 ? Math.round((resolvedCount / totalIncidents) * 100) : 0;

  // Risk patterns
  const riskPatterns: string[] = [];
  if (criticalCount > 3) riskPatterns.push('High critical incident frequency detected');
  if (avgResponseTime > 600) riskPatterns.push('Response times exceeding acceptable threshold');
  if (topIncidentTypes[0]?.count > totalIncidents * 0.4) {
    riskPatterns.push(`${topIncidentTypes[0]?.type} incidents dominating incident queue`);
  }

  // Recommended actions
  const recommendedActions: string[] = [];
  if (staffUtilization > 1.5) recommendedActions.push('Increase staff allocation for peak hours');
  if (resolutionRate < 80) recommendedActions.push('Review escalation protocol and training');
  if (peakHours[0] && peakHours[0].count > totalIncidents * 0.3) {
    recommendedActions.push(`Pre-schedule additional staff during peak hours (${peakHours[0].hour}:00 - ${peakHours[0].hour + 1}:00)`);
  }
  recommendedActions.push('Implement predictive staffing based on incident patterns');

  // Efficiency score (0-100)
  let efficiencyScore = 100;
  if (avgResponseTime > 300) efficiencyScore -= 15;
  if (resolutionRate < 90) efficiencyScore -= 20;
  if (criticalCount > 5) efficiencyScore -= 10;
  efficiencyScore = Math.max(0, efficiencyScore);

  return {
    totalIncidents,
    criticalCount,
    averageResponseTime: avgResponseTime,
    staffUtilization,
    topIncidentTypes,
    peakHours,
    resolutionRate,
    recommendedActions,
    staffAllocationOptimization: staffMap,
    riskPatterns,
    efficiency_score: efficiencyScore,
  };
}

export async function makeOperationalDecision(
  analyticsData: AIAgentAnalytics,
  context: string
): Promise<RealAgentDecision> {
  const decisionId = `decision-${Date.now()}`;
  const timestamp = new Date().toISOString();

  if (!geminiEnabled) {
    // Fallback: rule-based operational decision
    const decision = ruleBasedOperationalDecision(analyticsData, context, decisionId, timestamp);
    await logAgentDecision(decision);
    return decision;
  }

  const prompt = [
    'You are a real hotel operations manager using AI to optimize emergency response.',
    'Return JSON with keys: type, decision, reasoning, expectedImpact, metrics, autoExecute, requiresApproval.',
    'Allowed type: resource_allocation, priority_adjustment, staff_scheduling, escalation, prevention, optimization.',
    `Analytics data: ${JSON.stringify(analyticsData)}`,
    `Context: ${context}`,
    'Make strategic operational decisions to improve efficiency, reduce response time, and optimize staff allocation.',
    'Provide concrete, actionable decisions that a real human manager would make.',
  ].join('\n');

  const ai = await callGemini(prompt);
  if (!ai) {
    const decision = ruleBasedOperationalDecision(analyticsData, context, decisionId, timestamp);
    await logAgentDecision(decision);
    return decision;
  }

  const decision: RealAgentDecision = {
    decisionId,
    timestamp,
    type: normalizeDecisionType(typeof ai.type === 'string' ? ai.type : 'optimization'),
    decision: typeof ai.decision === 'string' ? ai.decision.trim() : 'Review and optimize operations',
    reasoning: typeof ai.reasoning === 'string' ? ai.reasoning.trim() : 'Based on current analytics',
    expectedImpact: typeof ai.expectedImpact === 'string' ? ai.expectedImpact.trim() : 'Improved operational efficiency',
    metrics: typeof ai.metrics === 'object' && ai.metrics ? (ai.metrics as Record<string, number | string>) : {},
    autoExecute: typeof ai.autoExecute === 'boolean' ? ai.autoExecute : false,
    requiresApproval: typeof ai.requiresApproval === 'boolean' ? ai.requiresApproval : true,
  };

  await logAgentDecision(decision);
  return decision;
}

function normalizeDecisionType(
  value: string
): 'resource_allocation' | 'priority_adjustment' | 'staff_scheduling' | 'escalation' | 'prevention' | 'optimization' {
  const valid = ['resource_allocation', 'priority_adjustment', 'staff_scheduling', 'escalation', 'prevention', 'optimization'];
  return valid.includes(value.toLowerCase()) 
    ? (value.toLowerCase() as 'resource_allocation' | 'priority_adjustment' | 'staff_scheduling' | 'escalation' | 'prevention' | 'optimization')
    : 'optimization';
}

function ruleBasedOperationalDecision(
  analytics: AIAgentAnalytics,
  context: string,
  decisionId: string,
  timestamp: string
): RealAgentDecision {
  const context_lower = context.toLowerCase();

  // Real operational decisions based on analytics
  if (analytics.criticalCount > 5) {
    return {
      decisionId,
      timestamp,
      type: 'escalation',
      decision: 'Activate emergency protocol and call all available staff on-site',
      reasoning: `High critical incident volume (${analytics.criticalCount}) detected in last 24 hours. System is under strain.`,
      expectedImpact: 'Reduced response time by 30-40%, improved incident resolution rate',
      metrics: { currentCriticalCount: analytics.criticalCount, threshold: 5 },
      autoExecute: false,
      requiresApproval: true,
    };
  }

  if (analytics.staffUtilization > 2 && analytics.averageResponseTime > 600) {
    return {
      decisionId,
      timestamp,
      type: 'resource_allocation',
      decision: 'Increase staff allocation by 40% for next 8 hours based on incident volume',
      reasoning: `Staff utilization at ${analytics.staffUtilization}x capacity with ${analytics.averageResponseTime}s avg response time.`,
      expectedImpact: 'Response time reduced by 50%, improved staff workload distribution',
      metrics: { currentUtilization: analytics.staffUtilization, averageResponseTime: analytics.averageResponseTime },
      autoExecute: true,
      requiresApproval: false,
    };
  }

  if (analytics.peakHours.length > 0) {
    const peak = analytics.peakHours[0];
    return {
      decisionId,
      timestamp,
      type: 'staff_scheduling',
      decision: `Pre-schedule additional staff during ${peak.hour}:00-${peak.hour + 1}:00 (peak hour with ${peak.count} incidents)`,
      reasoning: `Pattern analysis shows peak incident activity at hour ${peak.hour}. Proactive staffing optimization recommended.`,
      expectedImpact: 'Better distributed workload, faster response during peak times, reduced staff burnout',
      metrics: { peakHour: peak.hour, incidentsInPeak: peak.count },
      autoExecute: true,
      requiresApproval: false,
    };
  }

  if (analytics.resolutionRate < 80) {
    return {
      decisionId,
      timestamp,
      type: 'prevention',
      decision: 'Implement enhanced staff training on incident resolution protocols',
      reasoning: `Low resolution rate (${analytics.resolutionRate}%) suggests process inefficiency or staff skill gaps.`,
      expectedImpact: 'Improved incident resolution by 15-25%, reduced escalation rate',
      metrics: { currentResolutionRate: analytics.resolutionRate, targetRate: 90 },
      autoExecute: false,
      requiresApproval: true,
    };
  }

  return {
    decisionId,
    timestamp,
    type: 'optimization',
    decision: 'Continue monitoring current operations. Maintain existing staff allocation and protocols.',
    reasoning: 'All metrics within acceptable range. System operating efficiently.',
    expectedImpact: 'Sustained operational efficiency and incident response performance',
    metrics: { efficiencyScore: analytics.efficiency_score },
    autoExecute: true,
    requiresApproval: false,
  };
}

import axios from 'axios';
import type {
  Incident,
  APIResponse,
  CreateIncidentRequest,
  IncidentStatus,
  AITriageResult,
  FallbackMode,
  ResponseSector,
} from '../types/incident';
import type {
  TouristProfile,
  TouristChatResponse,
  TouristChatMessage,
  ContactRequest,
  RegisterTouristRequest,
  UpdateTouristProfileRequest,
} from '../types/tourist';

const backendUrl = import.meta.env.VITE_BACKEND_URL?.trim() ?? '';
const apiBaseUrl = backendUrl ? `${backendUrl.replace(/\/$/, '')}/api` : '/api';
const healthUrl = backendUrl ? `${backendUrl.replace(/\/$/, '')}/health` : '/health';

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

let staffAuthToken: string | null = null;
let touristAuthToken: string | null = null;

export function setStaffAuthToken(token: string | null) {
  staffAuthToken = token;
}

export function setTouristAuthToken(token: string | null) {
  touristAuthToken = token;
}

export function clearStaffAuthToken() {
  staffAuthToken = null;
}

export function clearTouristAuthToken() {
  touristAuthToken = null;
}

api.interceptors.request.use((config) => {
  const requestPath = String(config.url ?? '');
  const useTouristToken = requestPath.startsWith('/tourists/me');
  const useStaffToken = requestPath.startsWith('/incidents') || requestPath.startsWith('/ai') || requestPath.startsWith('/fallback') || requestPath.startsWith('/notifications') || requestPath.startsWith('/tourists/hotel-linked');
  const token = useTouristToken ? touristAuthToken : useStaffToken ? staffAuthToken : staffAuthToken ?? touristAuthToken;

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Incidents ─────────────────────────────────────────────────────────────────
export async function fetchIncidents(): Promise<Incident[]> {
  const res = await api.get<APIResponse<Incident[]>>('/incidents');
  return res.data.data ?? [];
}

export async function fetchTouristIncidents(): Promise<Incident[]> {
  const res = await api.get<APIResponse<Incident[]>>('/tourists/me/incidents');
  return res.data.data ?? [];
}

export async function fetchIncident(id: string): Promise<Incident> {
  const res = await api.get<APIResponse<Incident>>(`/incidents/${id}`);
  return res.data.data!;
}

export async function createIncident(req: CreateIncidentRequest): Promise<Incident> {
  const res = await api.post<APIResponse<Incident>>('/incidents', req);
  return res.data.data!;
}

export async function updateIncidentStatus(
  id: string,
  status: IncidentStatus,
  actor = 'staff',
  note?: string
): Promise<Incident> {
  const res = await api.patch<APIResponse<Incident>>(`/incidents/${id}/status`, { status, actor, note });
  return res.data.data!;
}

export async function approveAITriage(id: string): Promise<Incident> {
  const res = await api.post<APIResponse<Incident>>(`/incidents/${id}/approve`);
  return res.data.data!;
}

export async function hotelVerifyAndDispatchIncident(
  id: string,
  sectors: Exclude<ResponseSector, 'hotel'>[],
  note?: string
): Promise<Incident> {
  const res = await api.post<APIResponse<Incident>>(`/incidents/${id}/hotel-verify-dispatch`, { sectors, note });
  return res.data.data!;
}

export async function sectorAcceptIncident(
  id: string,
  sector: Exclude<ResponseSector, 'hotel'>,
  note?: string
): Promise<Incident> {
  const res = await api.post<APIResponse<Incident>>(`/incidents/${id}/sector-accept`, { sector, note });
  return res.data.data!;
}

export async function sectorResolveIncident(
  id: string,
  sector: Exclude<ResponseSector, 'hotel'>,
  note?: string
): Promise<Incident> {
  const res = await api.post<APIResponse<Incident>>(`/incidents/${id}/sector-resolve`, { sector, note });
  return res.data.data!;
}

export async function hotelCloseIncident(id: string, note?: string): Promise<Incident> {
  const res = await api.post<APIResponse<Incident>>(`/incidents/${id}/hotel-close`, { note });
  return res.data.data!;
}

export async function addTimelineEntry(id: string, message: string, actor = 'staff'): Promise<Incident> {
  const res = await api.post<APIResponse<Incident>>(`/incidents/${id}/timeline`, { message, actor });
  return res.data.data!;
}

// ─── AI ────────────────────────────────────────────────────────────────────────
export async function runAITriage(
  incidentId: string,
  message: string,
  location: string
): Promise<{ triage: AITriageResult; incident: Incident | null }> {
  const res = await api.post('/ai/triage', { incidentId, message, location });
  return res.data.data;
}

export async function orchestrateAgent(incidentId: string) {
  const res = await api.post('/ai/orchestrate', { incidentId });
  return res.data.data;
}

// ─── Fallback ─────────────────────────────────────────────────────────────────
export async function triggerFallback(
  incidentId: string,
  mode: FallbackMode,
  recipientInfo?: string
) {
  const res = await api.post(`/fallback/${mode}`, { incidentId, recipientInfo });
  return res.data.data;
}

export async function registerNotificationToken(token: string) {
  const res = await api.post('/notifications/register-token', { token });
  return res.data.data;
}

// ─── Tourist ─────────────────────────────────────────────────────────────────
export async function fetchTouristProfile(): Promise<TouristProfile | null> {
  try {
    const res = await api.get<APIResponse<TouristProfile>>('/tourists/me');
    return res.data.data ?? null;
  } catch {
    return null;
  }
}

export async function registerTouristProfile(req: RegisterTouristRequest): Promise<TouristProfile> {
  const res = await api.post<APIResponse<TouristProfile>>('/tourists/register', req);
  return res.data.data!;
}

export async function updateTouristProfile(req: UpdateTouristProfileRequest): Promise<TouristProfile> {
  const res = await api.patch<APIResponse<TouristProfile>>('/tourists/me', req);
  return res.data.data!;
}

export async function updateTouristLocation(coords: { lat: number; lng: number; accuracy?: number }, currentLocation: string) {
  const res = await api.post<APIResponse<TouristProfile>>('/tourists/me/location', {
    coordinates: coords,
    currentLocation,
  });
  return res.data.data!;
}

export async function bindTouristHotel(req: {
  hotelName: string;
  hotelLocation: string;
  roomNumber: string;
  nightsOfStay: number;
  stayStartDate?: string;
  stayEndDate?: string;
  hotelPhoneNumber?: string;
  qrPayload?: string;
}): Promise<TouristProfile> {
  const res = await api.post<APIResponse<TouristProfile>>('/tourists/me/hotel-binding', req);
  return res.data.data!;
}

export async function fetchHotelLinkedTourists(req: {
  hotelName: string;
  hotelLocation?: string;
  roomNumber?: string;
}): Promise<TouristProfile[]> {
  const query = new URLSearchParams();
  query.set('hotelName', req.hotelName);
  if (req.hotelLocation) query.set('hotelLocation', req.hotelLocation);
  if (req.roomNumber) query.set('roomNumber', req.roomNumber);

  const res = await api.get<APIResponse<TouristProfile[]>>(`/tourists/hotel-linked?${query.toString()}`);
  return res.data.data ?? [];
}

export async function askTouristAssistant(
  message: string,
  incidentContext?: Record<string, unknown>,
  history?: TouristChatMessage[]
): Promise<TouristChatResponse> {
  const res = await api.post<APIResponse<TouristChatResponse>>('/tourists/me/chat', { message, incidentContext, history });
  return res.data.data!;
}

export async function notifyTouristContact(req: ContactRequest) {
  const res = await api.post<APIResponse<{ notified: boolean; mode: 'voice' | 'video'; contactNumber?: string }>>(
    '/tourists/me/contact',
    req
  );
  return res.data.data!;
}

// ─── Health ────────────────────────────────────────────────────────────────────
export async function checkHealth() {
  try {
    const res = await axios.get(healthUrl, { timeout: 3000 });
    return { online: true, data: res.data };
  } catch {
    return { online: false, data: null };
  }
}

export async function checkBackendHealth() {
  try {
    const res = await axios.get(healthUrl, { timeout: 3000 });
    return { online: true, data: res.data };
  } catch {
    return { online: false, data: null };
  }
}

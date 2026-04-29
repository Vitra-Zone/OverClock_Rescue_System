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
  ContactRequest,
  RegisterTouristRequest,
  UpdateTouristProfileRequest,
} from '../types/tourist';

export interface APIClientConfig {
  baseUrl?: string;
}

export class APIClient {
  private baseUrl: string;
  private api: ReturnType<typeof axios.create>;
  private staffAuthToken: string | null = null;
  private touristAuthToken: string | null = null;

  constructor(config?: APIClientConfig) {
    this.baseUrl = config?.baseUrl || '/api';
    this.api = axios.create({
      baseURL: this.baseUrl,
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    this.api.interceptors.request.use((axiosConfig) => {
      const requestPath = String(axiosConfig.url ?? '');
      const useTouristToken = requestPath.startsWith('/tourists/me');
      const useStaffToken = requestPath.startsWith('/incidents') || requestPath.startsWith('/ai') || requestPath.startsWith('/fallback') || requestPath.startsWith('/notifications') || requestPath.startsWith('/tourists/hotel-linked');
      const token = useTouristToken ? this.touristAuthToken : useStaffToken ? this.staffAuthToken : this.staffAuthToken ?? this.touristAuthToken;

      if (token) {
        axiosConfig.headers = axiosConfig.headers ?? {};
        axiosConfig.headers.Authorization = `Bearer ${token}`;
      }
      return axiosConfig;
    });
  }

  setStaffAuthToken(token: string | null) {
    this.staffAuthToken = token;
  }

  setTouristAuthToken(token: string | null) {
    this.touristAuthToken = token;
  }

  clearStaffAuthToken() {
    this.staffAuthToken = null;
  }

  clearTouristAuthToken() {
    this.touristAuthToken = null;
  }

  // ─── Incidents ─────────────────────────────────────────────────────────────────
  async fetchIncidents(): Promise<Incident[]> {
    const res = await this.api.get<APIResponse<Incident[]>>('/incidents');
    return res.data.data ?? [];
  }

  async fetchTouristIncidents(): Promise<Incident[]> {
    const res = await this.api.get<APIResponse<Incident[]>>('/tourists/me/incidents');
    return res.data.data ?? [];
  }

  async fetchIncident(id: string): Promise<Incident> {
    const res = await this.api.get<APIResponse<Incident>>(`/incidents/${id}`);
    return res.data.data!;
  }

  async createIncident(req: CreateIncidentRequest): Promise<Incident> {
    const res = await this.api.post<APIResponse<Incident>>('/incidents', req);
    return res.data.data!;
  }

  async updateIncidentStatus(
    id: string,
    status: IncidentStatus,
    actor = 'staff',
    note?: string
  ): Promise<Incident> {
    const res = await this.api.patch<APIResponse<Incident>>(`/incidents/${id}/status`, { status, actor, note });
    return res.data.data!;
  }

  async approveAITriage(id: string): Promise<Incident> {
    const res = await this.api.post<APIResponse<Incident>>(`/incidents/${id}/approve`);
    return res.data.data!;
  }

  async hotelVerifyAndDispatchIncident(
    id: string,
    sectors: Exclude<ResponseSector, 'hotel'>[],
    note?: string
  ): Promise<Incident> {
    const res = await this.api.post<APIResponse<Incident>>(`/incidents/${id}/hotel-verify-dispatch`, { sectors, note });
    return res.data.data!;
  }

  async sectorAcceptIncident(
    id: string,
    sector: Exclude<ResponseSector, 'hotel'>,
    note?: string
  ): Promise<Incident> {
    const res = await this.api.post<APIResponse<Incident>>(`/incidents/${id}/sector-accept`, { sector, note });
    return res.data.data!;
  }

  async sectorResolveIncident(
    id: string,
    sector: Exclude<ResponseSector, 'hotel'>,
    note?: string
  ): Promise<Incident> {
    const res = await this.api.post<APIResponse<Incident>>(`/incidents/${id}/sector-resolve`, { sector, note });
    return res.data.data!;
  }

  async hotelCloseIncident(id: string, note?: string): Promise<Incident> {
    const res = await this.api.post<APIResponse<Incident>>(`/incidents/${id}/hotel-close`, { note });
    return res.data.data!;
  }

  async addTimelineEntry(id: string, message: string, actor = 'staff'): Promise<Incident> {
    const res = await this.api.post<APIResponse<Incident>>(`/incidents/${id}/timeline`, { message, actor });
    return res.data.data!;
  }

  // ─── AI ────────────────────────────────────────────────────────────────────────
  async runAITriage(
    incidentId: string,
    message: string,
    location: string
  ): Promise<{ triage: AITriageResult; incident: Incident | null }> {
    const res = await this.api.post('/ai/triage', { incidentId, message, location });
    return res.data.data;
  }

  async orchestrateAgent(incidentId: string) {
    const res = await this.api.post('/ai/orchestrate', { incidentId });
    return res.data.data;
  }

  // ─── Fallback ─────────────────────────────────────────────────────────────────
  async triggerFallback(
    incidentId: string,
    mode: FallbackMode,
    recipientInfo?: string
  ) {
    const res = await this.api.post(`/fallback/${mode}`, { incidentId, recipientInfo });
    return res.data.data;
  }

  async registerNotificationToken(token: string) {
    const res = await this.api.post('/notifications/register-token', { token });
    return res.data.data;
  }

  // ─── Tourist ─────────────────────────────────────────────────────────────────
  async fetchTouristProfile(): Promise<TouristProfile | null> {
    try {
      const res = await this.api.get<APIResponse<TouristProfile>>('/tourists/me');
      return res.data.data ?? null;
    } catch {
      return null;
    }
  }

  async registerTouristProfile(req: RegisterTouristRequest): Promise<TouristProfile> {
    const res = await this.api.post<APIResponse<TouristProfile>>('/tourists/register', req);
    return res.data.data!;
  }

  async updateTouristProfile(req: UpdateTouristProfileRequest): Promise<TouristProfile> {
    const res = await this.api.patch<APIResponse<TouristProfile>>('/tourists/me', req);
    return res.data.data!;
  }

  async updateTouristLocation(coords: { lat: number; lng: number; accuracy?: number }, currentLocation: string) {
    const res = await this.api.post<APIResponse<TouristProfile>>('/tourists/me/location', {
      coordinates: coords,
      currentLocation,
    });
    return res.data.data!;
  }

  async bindTouristHotel(req: {
    hotelName: string;
    hotelLocation: string;
    roomNumber: string;
    nightsOfStay: number;
    stayStartDate?: string;
    stayEndDate?: string;
    hotelPhoneNumber?: string;
    qrPayload?: string;
  }): Promise<TouristProfile> {
    const res = await this.api.post<APIResponse<TouristProfile>>('/tourists/me/hotel-binding', req);
    return res.data.data!;
  }

  async fetchHotelLinkedTourists(req: {
    hotelName: string;
    hotelLocation?: string;
    roomNumber?: string;
  }): Promise<TouristProfile[]> {
    const query = new URLSearchParams();
    query.set('hotelName', req.hotelName);
    if (req.hotelLocation) query.set('hotelLocation', req.hotelLocation);
    if (req.roomNumber) query.set('roomNumber', req.roomNumber);

    const res = await this.api.get<APIResponse<TouristProfile[]>>(`/tourists/hotel-linked?${query.toString()}`);
    return res.data.data ?? [];
  }

  async askTouristAssistant(message: string, incidentContext?: Record<string, unknown>): Promise<TouristChatResponse> {
    const res = await this.api.post<APIResponse<TouristChatResponse>>('/tourists/me/chat', { message, incidentContext });
    return res.data.data!;
  }

  async notifyTouristContact(req: ContactRequest) {
    const res = await this.api.post<APIResponse<{ notified: boolean; mode: 'voice' | 'video'; contactNumber?: string }>>(
      '/tourists/me/contact',
      req
    );
    return res.data.data!;
  }

  // ─── Health ────────────────────────────────────────────────────────────────────
  async checkHealth() {
    try {
      const healthUrl = this.baseUrl.replace('/api', '/health');
      const res = await axios.get(healthUrl, { timeout: 3000 });
      return { online: true, data: res.data };
    } catch {
      return { online: false, data: null };
    }
  }

  async checkBackendHealth() {
    try {
      const healthUrl = this.baseUrl.replace('/api', '/health');
      const res = await axios.get(healthUrl, { timeout: 3000 });
      return { online: true, data: res.data };
    } catch {
      return { online: false, data: null };
    }
  }
}

// Default singleton instance for backward compatibility
let defaultInstance: APIClient | null = null;

export function getAPIClient(config?: APIClientConfig): APIClient {
  if (!defaultInstance) {
    defaultInstance = new APIClient(config);
  }
  return defaultInstance;
}

export function setStaffAuthToken(token: string | null) {
  getAPIClient().setStaffAuthToken(token);
}

export function setTouristAuthToken(token: string | null) {
  getAPIClient().setTouristAuthToken(token);
}

export function clearStaffAuthToken() {
  getAPIClient().clearStaffAuthToken();
}

export function clearTouristAuthToken() {
  getAPIClient().clearTouristAuthToken();
}

export async function fetchIncidents(): Promise<Incident[]> {
  return getAPIClient().fetchIncidents();
}

export async function fetchTouristIncidents(): Promise<Incident[]> {
  return getAPIClient().fetchTouristIncidents();
}

export async function fetchIncident(id: string): Promise<Incident> {
  return getAPIClient().fetchIncident(id);
}

export async function createIncident(req: CreateIncidentRequest): Promise<Incident> {
  return getAPIClient().createIncident(req);
}

export async function updateIncidentStatus(
  id: string,
  status: IncidentStatus,
  actor = 'staff',
  note?: string
): Promise<Incident> {
  return getAPIClient().updateIncidentStatus(id, status, actor, note);
}

export async function approveAITriage(id: string): Promise<Incident> {
  return getAPIClient().approveAITriage(id);
}

export async function hotelVerifyAndDispatchIncident(
  id: string,
  sectors: Exclude<ResponseSector, 'hotel'>[],
  note?: string
): Promise<Incident> {
  return getAPIClient().hotelVerifyAndDispatchIncident(id, sectors, note);
}

export async function sectorAcceptIncident(
  id: string,
  sector: Exclude<ResponseSector, 'hotel'>,
  note?: string
): Promise<Incident> {
  return getAPIClient().sectorAcceptIncident(id, sector, note);
}

export async function sectorResolveIncident(
  id: string,
  sector: Exclude<ResponseSector, 'hotel'>,
  note?: string
): Promise<Incident> {
  return getAPIClient().sectorResolveIncident(id, sector, note);
}

export async function hotelCloseIncident(id: string, note?: string): Promise<Incident> {
  return getAPIClient().hotelCloseIncident(id, note);
}

export async function addTimelineEntry(id: string, message: string, actor = 'staff'): Promise<Incident> {
  return getAPIClient().addTimelineEntry(id, message, actor);
}

export async function runAITriage(
  incidentId: string,
  message: string,
  location: string
): Promise<{ triage: AITriageResult; incident: Incident | null }> {
  return getAPIClient().runAITriage(incidentId, message, location);
}

export async function orchestrateAgent(incidentId: string) {
  return getAPIClient().orchestrateAgent(incidentId);
}

export async function triggerFallback(
  incidentId: string,
  mode: FallbackMode,
  recipientInfo?: string
) {
  return getAPIClient().triggerFallback(incidentId, mode, recipientInfo);
}

export async function registerNotificationToken(token: string) {
  return getAPIClient().registerNotificationToken(token);
}

export async function fetchTouristProfile(): Promise<TouristProfile | null> {
  return getAPIClient().fetchTouristProfile();
}

export async function registerTouristProfile(req: RegisterTouristRequest): Promise<TouristProfile> {
  return getAPIClient().registerTouristProfile(req);
}

export async function updateTouristProfile(req: UpdateTouristProfileRequest): Promise<TouristProfile> {
  return getAPIClient().updateTouristProfile(req);
}

export async function updateTouristLocation(coords: { lat: number; lng: number; accuracy?: number }, currentLocation: string) {
  return getAPIClient().updateTouristLocation(coords, currentLocation);
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
  return getAPIClient().bindTouristHotel(req);
}

export async function fetchHotelLinkedTourists(req: {
  hotelName: string;
  hotelLocation?: string;
  roomNumber?: string;
}): Promise<TouristProfile[]> {
  return getAPIClient().fetchHotelLinkedTourists(req);
}

export async function askTouristAssistant(message: string, incidentContext?: Record<string, unknown>): Promise<TouristChatResponse> {
  return getAPIClient().askTouristAssistant(message, incidentContext);
}

export async function notifyTouristContact(req: ContactRequest) {
  return getAPIClient().notifyTouristContact(req);
}

export async function checkHealth() {
  return getAPIClient().checkHealth();
}

export async function checkBackendHealth() {
  return getAPIClient().checkBackendHealth();
}

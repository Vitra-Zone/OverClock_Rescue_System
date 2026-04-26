export type IncidentType =
  | 'medical'
  | 'fire'
  | 'security'
  | 'earthquake'
  | 'flood'
  | 'likely_fake'
  | 'general'
  | 'unknown';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type IncidentStatus =
  | 'open'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'closed';

export type ConnectivityMode =
  | 'online'
  | 'offline'
  | 'sms_fallback'
  | 'voice_fallback';

export type FallbackMode = 'none' | 'sms' | 'voice' | 'video';

export type AssignedRole =
  | 'nearest_medical_staff'
  | 'security_team'
  | 'front_desk'
  | 'fire_safety_officer'
  | 'general_staff'
  | 'emergency_services'
  | 'unassigned';

export type ResponseSector = 'hotel' | 'hotel_staff' | 'fire' | 'medical' | 'police';

export interface TimelineEntry {
  timestamp: string;
  actor: 'guest' | 'ai' | 'staff' | 'system' | 'hotel_staff' | 'fire_staff' | 'medical_staff' | 'police_staff';
  message: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface HotelContext {
  name: string;
  address: string;
  coordinates?: Coordinates;
}

export interface Incident {
  id: string;
  createdAt: string;
  updatedAt: string;
  source: 'web' | 'sms' | 'voice' | 'staff';
  guestName: string;
  guestAlias?: string;
  roomNumber: string;
  location: string;
  coordinates?: Coordinates;
  incidentScope?: 'in_hotel' | 'outside';
  hotelContext?: HotelContext;
  incidentType: IncidentType;
  severity: Severity;
  connectivityMode: ConnectivityMode;
  status: IncidentStatus;
  message: string;
  aiSummary?: string;
  recommendedAction?: string;
  assignedTo: AssignedRole;
  responseTimeline: TimelineEntry[];
  fallbackUsed: FallbackMode;
  aiTriage?: AITriageResult;
  humanApproved?: boolean;
  verifiedByHotel?: boolean;
  dispatchedSectors?: ResponseSector[];
  acceptedSectors?: ResponseSector[];
  resolvedSectors?: ResponseSector[];
  escalated?: boolean;
  escalationDueAt?: string;
}

export interface AITriageResult {
  incidentType: IncidentType;
  severity: Severity;
  assignedTo: AssignedRole;
  nextAction: string;
  fallbackMode: FallbackMode;
  summary: string;
  followUpQuestion: string;
  workflowStage: 'intake' | 'analysis' | 'verification' | 'dispatch' | 'monitoring';
  workflowSteps: string[];
  confidence: number;
  analytics: {
    messageLength: number;
    keywordHits: number;
    emergencySignals: number;
    nonEmergencySignals: number;
  };
}

export interface CreateIncidentRequest {
  guestName: string;
  roomNumber: string;
  location: string;
  coordinates?: Coordinates;
  incidentScope?: 'in_hotel' | 'outside';
  hotelContext?: HotelContext;
  message: string;
  connectivityMode: ConnectivityMode;
  source?: 'web' | 'sms' | 'voice' | 'staff';
}

export interface UpdateStatusRequest {
  status: IncidentStatus;
  actor?: string;
  note?: string;
}

export interface HotelVerifyDispatchRequest {
  sectors: ResponseSector[];
  note?: string;
}

export interface SectorActionRequest {
  sector: Exclude<ResponseSector, 'hotel'>;
  note?: string;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

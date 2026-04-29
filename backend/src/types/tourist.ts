import type { Coordinates, APIResponse } from './incident';

export interface TouristHotelBinding {
  hotelName: string;
  hotelLocation: string;
  roomNumber: string;
  nightsOfStay: number;
  stayStartDate?: string;
  stayEndDate?: string;
  hotelPhoneNumber?: string;
  qrPayload?: string;
  sharedAt?: string;
}

export interface TouristProfile {
  uid: string;
  email: string;
  touristFirstName: string;
  touristLastName: string;
  phoneNumber: string;
  aadhaarNumber: string;
  homeState: string;
  homeDistrict: string;
  pinCode: string;
  serialNumber: number;
  digitalId: string;
  currentLocation?: string;
  coordinates?: Coordinates;
  lastLocationUpdatedAt?: string;
  hotelBinding?: TouristHotelBinding;
  activeIncidentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterTouristRequest {
  touristFirstName: string;
  touristLastName: string;
  email: string;
  phoneNumber: string;
  aadhaarNumber: string;
  homeState: string;
  homeDistrict: string;
  pinCode: string;
}

export interface UpdateTouristProfileRequest {
  email?: string;
  touristFirstName?: string;
  touristLastName?: string;
  phoneNumber?: string;
  aadhaarNumber?: string;
  homeState?: string;
  homeDistrict?: string;
  pinCode?: string;
  currentLocation?: string;
  coordinates?: Coordinates;
  hotelBinding?: TouristHotelBinding | null;
}

export interface TouristChatRequest {
  message: string;
  incidentContext?: {
    incidentId?: string;
    incidentType?: string;
    severity?: string;
    location?: string;
    status?: string;
  };
}

export interface TouristChatResponse {
  reply: string;
  actionItems: string[];
  mode: 'gemini' | 'rule_based';
}

export interface ContactRequest {
  incidentId: string;
  mode: 'voice' | 'video';
  contactNumber?: string;
  note?: string;
}

export type TouristAPIResponse<T = unknown> = APIResponse<T>;
import type { Coordinates, IncidentType } from '../types/incident';

type StationType = 'police' | 'fire' | 'medical';

interface Station {
  id: string;
  name: string;
  type: StationType;
  address: string;
  coordinates: Coordinates;
}

export interface NearestStationResult {
  station: Station;
  distanceKm: number;
  label: string;
}

const STATIONS: Station[] = [
  {
    id: 'police-connaught',
    name: 'Connaught Place Police Station',
    type: 'police',
    address: 'Connaught Place, New Delhi',
    coordinates: { lat: 28.6315, lng: 77.2167 },
  },
  {
    id: 'police-khan',
    name: 'Khan Market Police Station',
    type: 'police',
    address: 'Khan Market, New Delhi',
    coordinates: { lat: 28.6002, lng: 77.2272 },
  },
  {
    id: 'fire-barakhamba',
    name: 'Barakhamba Fire Station',
    type: 'fire',
    address: 'Barakhamba Road, New Delhi',
    coordinates: { lat: 28.6286, lng: 77.2244 },
  },
  {
    id: 'fire-minto',
    name: 'Minto Road Fire Station',
    type: 'fire',
    address: 'Minto Road, New Delhi',
    coordinates: { lat: 28.631, lng: 77.2346 },
  },
  {
    id: 'medical-rml',
    name: 'RML Hospital Emergency',
    type: 'medical',
    address: 'Baba Kharak Singh Marg, New Delhi',
    coordinates: { lat: 28.6259, lng: 77.2082 },
  },
  {
    id: 'medical-lnjp',
    name: 'LNJP Emergency Block',
    type: 'medical',
    address: 'Jawaharlal Nehru Marg, New Delhi',
    coordinates: { lat: 28.6421, lng: 77.2387 },
  },
];

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineKm(a: Coordinates, b: Coordinates): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

function getStationTypeForIncident(incidentType: IncidentType): StationType {
  if (incidentType === 'medical') return 'medical';
  if (incidentType === 'fire' || incidentType === 'earthquake' || incidentType === 'flood') return 'fire';
  return 'police';
}

function getStationLabel(type: StationType): string {
  if (type === 'medical') return 'Nearest Medical Station';
  if (type === 'fire') return 'Nearest Fire Station';
  return 'Nearest Police Station';
}

export function findNearestHelpingStation(reference: Coordinates, incidentType: IncidentType): NearestStationResult | null {
  const stationType = getStationTypeForIncident(incidentType);
  const candidateStations = STATIONS.filter((station) => station.type === stationType);
  if (candidateStations.length === 0) return null;

  let nearest = candidateStations[0];
  let nearestDistance = haversineKm(reference, nearest.coordinates);

  for (const station of candidateStations.slice(1)) {
    const distance = haversineKm(reference, station.coordinates);
    if (distance < nearestDistance) {
      nearest = station;
      nearestDistance = distance;
    }
  }

  return {
    station: nearest,
    distanceKm: Number(nearestDistance.toFixed(1)),
    label: getStationLabel(stationType),
  };
}

export function stationMapsLink(station: Station): string {
  return `https://www.google.com/maps?q=${station.coordinates.lat},${station.coordinates.lng}`;
}

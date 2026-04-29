import { useEffect, useState } from 'react';
import type { Coordinates, Incident } from '@overclock/shared/types';
import { fetchTouristIncidents } from '@overclock/shared/api';
import { useTouristAuth } from '../auth/TouristAuthContext';
import { TouristIncidentMap } from '../components/TouristIncidentMap';

const DEFAULT_COORDS: Coordinates = { lat: 28.6139, lng: 77.209 };

export function LocationMapPage() {
  const { profile } = useTouristAuth();
  const [center, setCenter] = useState<Coordinates>(profile?.coordinates ?? DEFAULT_COORDS);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    if (profile?.coordinates) {
      setCenter(profile.coordinates);
    }
  }, [profile?.coordinates]);

  useEffect(() => {
    void fetchTouristIncidents().then(setIncidents).catch(() => setIncidents([]));
  }, []);

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <h1 className="text-2xl font-bold text-white">Location Map</h1>
        <TouristIncidentMap center={center} incidents={incidents} title="Tourist map" />
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, RefreshCw } from 'lucide-react';
import type { Coordinates, Incident } from '../types/incident';
import { fetchTouristIncidents, updateTouristLocation } from '../api/client';
import { useTouristAuth } from '../auth/TouristAuthContext';
import { TouristIncidentMap } from '../components/TouristIncidentMap';
import { calculateDistanceKm } from '../utils/geo';

const DEFAULT_COORDS: Coordinates = { lat: 28.6139, lng: 77.209 };

export function TouristIncidentsPage() {
  const { profile, loading, refreshProfile } = useTouristAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [center, setCenter] = useState<Coordinates>(profile?.coordinates ?? DEFAULT_COORDS);
  const [busy, setBusy] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recenterToken, setRecenterToken] = useState(0);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const incidentsLoadedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!profile?.coordinates) return;
    setCenter(profile.coordinates);
  }, [profile]);

  useEffect(() => {
    if (loading || !profile?.uid) return;
    if (incidentsLoadedRef.current === profile.uid) return;
    incidentsLoadedRef.current = profile.uid;

    const load = async () => {
      setBusy(true);
      try {
        const data = await fetchTouristIncidents();
        setIncidents(data);
      } catch {
        setIncidents([]);
      } finally {
        setBusy(false);
      }
    };

    void load();
  }, [loading, profile?.uid]);

  const refreshPosition = async () => {
    if (!navigator.geolocation) return;

    setRefreshing(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const coords: Coordinates = {
        lat: Number(position.coords.latitude.toFixed(6)),
        lng: Number(position.coords.longitude.toFixed(6)),
        accuracy: Math.round(position.coords.accuracy),
      };

      setCenter(coords);
      setRecenterToken((value) => value + 1);
      try {
        await updateTouristLocation(coords, `Lat ${coords.lat}, Lng ${coords.lng}`);
        await refreshProfile();
      } catch {
        // Keep the local pin moving even if the write fails.
      } finally {
        setRefreshing(false);
      }
    }, () => {
      setRefreshing(false);
    }, { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 });
  };

  useEffect(() => {
    if (loading || !profile) return;
    void refreshPosition();
  }, [loading, profile]);

  const selectedDistance = useMemo(() => {
    if (!selectedIncident?.coordinates) return null;
    return calculateDistanceKm(center, selectedIncident.coordinates);
  }, [center, selectedIncident]);

  return (
    <div className="min-h-screen bg-[#0b1020] text-white flex flex-col">
      <div className="px-3 pt-3 sm:px-4 sm:pt-4">
        <div className="flex">
          <button onClick={() => void refreshPosition()} disabled={refreshing} className="w-full sm:w-auto rounded-2xl border border-white/10 bg-[#10182e]/85 px-3 py-2 backdrop-blur text-sm inline-flex items-center justify-center gap-2 text-slate-100">
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> {refreshing ? 'Refreshing' : 'Refresh position'}
          </button>
        </div>
      </div>

      {busy ? (
        <div className="flex-1 flex items-center justify-center text-slate-200">Loading incidents...</div>
      ) : (
        <div className="relative flex-1 min-h-[calc(100vh-5rem)]">
          <TouristIncidentMap
            center={center}
            incidents={incidents}
            title="Incidents Around You"
            selectedIncidentId={selectedIncident?.id}
            onSelectIncident={setSelectedIncident}
            recenterToken={recenterToken}
          />

          <div className="absolute bottom-4 left-4 right-4 z-[700] rounded-3xl border border-white/10 bg-[#10182e]/88 p-4 backdrop-blur">
            {selectedIncident ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-orange-300 font-semibold">
                  <MapPin size={16} /> {selectedIncident.incidentType.toUpperCase()}
                </div>
                <p className="text-sm text-slate-200">{selectedIncident.location}</p>
                <p className="text-xs text-slate-400">{selectedDistance !== null ? `${selectedDistance.toFixed(1)} km away` : 'Location unavailable'}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-300">Tap any incident pin to see details here.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

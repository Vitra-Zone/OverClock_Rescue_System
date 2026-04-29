import { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { Coordinates, Incident } from '@overclock/shared/types';
import { fetchTouristIncidents, updateTouristLocation } from '@overclock/shared/api';
import { calculateDistanceKm } from '@overclock/shared/utils';
import { useTouristAuth } from '../auth/TouristAuthContext';
import { TouristIncidentMap } from '../components/TouristIncidentMap';

const DEFAULT_COORDS: Coordinates = { lat: 28.6139, lng: 77.209 };

export function TouristIncidentsPage() {
  const { profile, loading, refreshProfile } = useTouristAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [center, setCenter] = useState<Coordinates>(profile?.coordinates ?? DEFAULT_COORDS);
  const [busy, setBusy] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [recenterToken, setRecenterToken] = useState(0);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setBusy(true);
      try {
        const data = await fetchTouristIncidents();
        if (!mounted) return;
        setIncidents(data ?? []);
      } catch (err) {
        if (!mounted) return;
        console.error('[TouristIncidentsPage] Failed to load incidents', err);
        setIncidents([]);
      } finally {
        if (mounted) setBusy(false);
      }
    };

    if (!loading) {
      void load();
    }

    return () => {
      mounted = false;
    };
  }, [loading]);

  useEffect(() => {
    if (profile?.coordinates) setCenter(profile.coordinates);
  }, [profile?.coordinates]);

  const refreshPosition = async () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported by this browser');
      return;
    }

    setGeoError(null);
    setRefreshing(true);
    const timeoutId = window.setTimeout(() => {
      setRefreshing(false);
      setGeoError('Geolocation request timed out');
    }, 15000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords: Coordinates = {
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
          accuracy: Math.round(position.coords.accuracy),
        };

        setCenter(coords);
        setRecenterToken((value) => value + 1);
        try {
          if (profile?.uid) {
            await updateTouristLocation(coords, `Lat ${coords.lat}, Lng ${coords.lng}`);
            await refreshProfile();
          }
          setGeoError(null);
        } catch (err) {
          console.warn('[TouristIncidentsPage] Failed to update location', err);
        } finally {
          clearTimeout(timeoutId);
          setRefreshing(false);
        }
      },
      () => {
        setGeoError('Unable to get current position (permission denied or unavailable)');
        clearTimeout(timeoutId);
        setRefreshing(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  };

  const selectedDistance = useMemo(() => {
    if (!selectedIncident?.coordinates) return null;
    return calculateDistanceKm(center, selectedIncident.coordinates);
  }, [center, selectedIncident]);

  return (
    <div className="min-h-screen bg-[#0b1020] text-white flex flex-col">
      <div className="px-3 pt-3 sm:px-4 sm:pt-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => void refreshPosition()}
            disabled={refreshing}
            className="rounded-2xl border border-white/10 bg-[#10182e]/85 px-3 py-2 backdrop-blur text-sm inline-flex items-center gap-2 text-slate-100"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing' : 'Refresh position'}
          </button>
          <div className="text-sm text-slate-300">{geoError ?? ''}</div>
        </div>
      </div>

      {busy ? (
        <div className="flex-1 flex items-center justify-center text-slate-200">Loading incidents...</div>
      ) : (
        <div className="relative flex-1 min-h-[calc(100vh-5rem)] grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="col-span-2">
            <TouristIncidentMap
              center={center}
              incidents={incidents}
              title="Incidents Around You"
              selectedIncidentId={selectedIncident?.id}
              onSelectIncident={setSelectedIncident}
              recenterToken={recenterToken}
            />
          </div>

          <aside className="col-span-1 p-4 space-y-3">
            <div className="rounded-xl border border-white/6 bg-[#0f1724]/60 p-3">
              <div className="text-sm text-slate-300 font-semibold">Nearby incidents</div>
              <div className="mt-2 max-h-[60vh] overflow-y-auto">
                {incidents.length === 0 ? (
                  <div className="text-sm text-slate-400">No incidents found.</div>
                ) : (
                  incidents.map((incident) => (
                    <button
                      key={incident.id}
                      onClick={() => {
                        setSelectedIncident(incident);
                        if (incident.coordinates) {
                          setCenter(incident.coordinates);
                          setRecenterToken((value) => value + 1);
                        }
                      }}
                      className={`w-full text-left p-2 rounded-md hover:bg-white/5 ${
                        selectedIncident?.id === incident.id ? 'ring-2 ring-orange-400' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">{incident.incidentType.toUpperCase()}</div>
                        <div className="text-xs text-slate-400">
                          {incident.coordinates ? `${calculateDistanceKm(center, incident.coordinates).toFixed(1)} km` : '—'}
                        </div>
                      </div>
                      <div className="text-xs text-slate-300">{incident.location}</div>
                    </button>
                  ))
                )}
              </div>
              {selectedIncident && (
                <div className="mt-3 text-xs text-slate-400">
                  Selected distance: {selectedDistance ? `${selectedDistance.toFixed(2)} km` : 'Unknown'}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

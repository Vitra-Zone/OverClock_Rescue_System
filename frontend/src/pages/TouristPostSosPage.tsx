import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, WifiOff, ShieldAlert, RotateCcw, AlertTriangle } from 'lucide-react';
import { fetchTouristIncidents } from '../api/client';
import { useTouristAuth } from '../auth/TouristAuthContext';
import type { Incident } from '../types/incident';
import { TouristIncidentMap } from '../components/TouristIncidentMap';
import { TimelinePanel } from '../components/TimelinePanel';
import { TouristChatBox } from '../components/TouristChatBox';

const LAST_INCIDENT_KEY = 'hackdays_tourist_last_incident';
const LAST_INCIDENT_SNAPSHOT_KEY = 'hackdays_tourist_last_incident_snapshot';

function storeIncidentId(incident: Incident) {
  try {
    window.localStorage.setItem(LAST_INCIDENT_KEY, JSON.stringify({ incidentId: incident.id }));
  } catch {
    // ignore quota errors
  }
}

function storeIncidentSnapshot(incident: Incident) {
  try {
    window.localStorage.setItem(LAST_INCIDENT_SNAPSHOT_KEY, JSON.stringify(incident));
    storeIncidentId(incident);
  } catch {
    // ignore
  }
}

function readIncidentSnapshot(): Incident | null {
  try {
    const raw = window.localStorage.getItem(LAST_INCIDENT_SNAPSHOT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Incident;
  } catch {
    return null;
  }
}

export function TouristPostSosPage() {
  const navigate = useNavigate();
  const { incidentId } = useParams();
  const { profile } = useTouristAuth();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const candidateId = incidentId ?? (() => {
          try {
            const raw = window.sessionStorage.getItem(LAST_INCIDENT_KEY);
            return raw ? (JSON.parse(raw) as { incidentId?: string }).incidentId ?? '' : '';
          } catch {
            return '';
          }
        })();

        if (!candidateId) {
          setIncident(readIncidentSnapshot());
          return;
        }

        const cachedIncident = readIncidentSnapshot();
        if (cachedIncident?.id === candidateId) {
          setIncident(cachedIncident);
          return;
        }

        const incidents = await fetchTouristIncidents();
        const nextIncident = incidents.find((entry) => entry.id === candidateId) ?? null;
        if (!nextIncident) {
          setIncident(cachedIncident?.id === candidateId ? cachedIncident : null);
          return;
        }
        setIncident(nextIncident);
        storeIncidentSnapshot(nextIncident);
      } catch (error) {
        console.error('[TouristPostSosPage] Failed to load incident', error);
        setIncident(readIncidentSnapshot());
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [incidentId]);

  // Clear local storage when the incident is closed by hotel management
  useEffect(() => {
    try {
      if (incident && incident.status === 'closed') {
        window.localStorage.removeItem(LAST_INCIDENT_KEY);
        window.localStorage.removeItem(LAST_INCIDENT_SNAPSHOT_KEY);
      }
    } catch {
      // ignore
    }
  }, [incident]);

  const incidentContext = useMemo(() => ({
    incidentId: incident?.id,
    incidentType: incident?.aiTriage?.incidentType ?? incident?.incidentType,
    severity: incident?.aiTriage?.severity ?? incident?.severity,
    location: incident?.location,
    status: incident?.status,
    message: incident?.message,
    roomNumber: incident?.roomNumber,
    incidentScope: incident?.incidentScope,
    hotelName: incident?.hotelContext?.name,
    hotelAddress: incident?.hotelContext?.address,
    recommendedAction: incident?.recommendedAction,
    aiSummary: incident?.aiSummary,
  }), [incident]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-crisis-text">Loading incident...</div>;
  }

  if (!incident) {
    return (
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-2xl mx-auto card p-8 text-center space-y-4">
          <ShieldAlert size={40} className="text-crisis-primary mx-auto" />
          <h1 className="text-3xl font-black text-crisis-text">No SOS found</h1>
          <p className="text-crisis-text-dim">Submit a new SOS from your tourist dashboard to see the follow-up page here.</p>
          <button onClick={() => navigate('/tourist')} className="btn-primary">Back to tourist home</button>
        </div>
      </div>
    );
  }

  const callNumber = profile?.hotelBinding?.hotelPhoneNumber ?? '+911120000000';

  return (
    <>
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="card p-6 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-crisis-muted mb-1">Post-SOS</p>
                <h1 className="text-3xl sm:text-4xl font-black text-crisis-text">Incident {incident.id.toUpperCase()}</h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`chip-${incident.status}`}>{incident.status.replace('_', ' ')}</span>
                <span className={`chip-${incident.severity}`}>{incident.severity}</span>
              </div>
            </div>
            <p className="text-crisis-text-dim">This page stays linked to the current SOS until the incident is resolved or you start a new one.</p>
          </div>

          <section className="grid grid-cols-1 xl:grid-cols-[1.02fr_0.98fr] gap-6 items-start">
            <div className="space-y-6">
              <div className="card p-6 space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="rounded-2xl bg-crisis-bg/70 border border-crisis-border/60 p-4">
                    <p className="text-xs text-crisis-muted uppercase tracking-[0.2em] mb-1">Tourist</p>
                    <p className="text-crisis-text font-semibold">{profile ? `${profile.touristFirstName} ${profile.touristLastName}` : incident.guestName}</p>
                  </div>
                  <div className="rounded-2xl bg-crisis-bg/70 border border-crisis-border/60 p-4">
                    <p className="text-xs text-crisis-muted uppercase tracking-[0.2em] mb-1">Digital ID</p>
                    <p className="text-crisis-text font-semibold">{profile?.digitalId ?? 'N/A'}</p>
                  </div>
                  <div className="rounded-2xl bg-crisis-bg/70 border border-crisis-border/60 p-4">
                    <p className="text-xs text-crisis-muted uppercase tracking-[0.2em] mb-1">Hotel</p>
                    <p className="text-crisis-text font-semibold">{profile?.hotelBinding?.hotelName ?? 'Not bound'}</p>
                  </div>
                </div>
                <div className="rounded-3xl border border-crisis-border/60 bg-crisis-bg/60 p-5 space-y-2">
                  <p className="text-xs uppercase tracking-[0.25em] text-crisis-muted">Incident message</p>
                  <p className="text-crisis-text leading-relaxed">{incident.message}</p>
                  <p className="text-sm text-crisis-text-dim">Location: {incident.location}</p>
                </div>
              </div>

              <div className="card p-6 space-y-4">
                <div className="flex items-center gap-2 text-crisis-text font-semibold">
                  <ArrowRight size={18} className="text-crisis-primary" /> Online Guidance
                </div>
                <p className="text-crisis-text-dim text-sm">Open the live guidance page for real-time instructions and support.</p>
                <button
                  onClick={() => navigate('/live-guidance', { state: { incidentId: incident.id } })}
                  className="btn-primary w-full inline-flex items-center justify-center gap-2"
                >
                  Open live guidance
                </button>
              </div>

              {incident.coordinates && (
                <TouristIncidentMap center={incident.coordinates} incidents={[incident]} title="Incident map" />
              )}

              <div className="card p-6 space-y-3">
                <div className="flex items-center gap-2 text-crisis-text font-semibold">
                  <RotateCcw size={18} className="text-crisis-primary" /> Incident timeline
                </div>
                <TimelinePanel timeline={incident.responseTimeline} />
              </div>
            </div>

            <aside className="space-y-6">
              <TouristChatBox incidentContext={incidentContext} />

              <div className="card p-6 space-y-4">
                <div className="flex items-center gap-2 text-crisis-text font-semibold">
                  <WifiOff size={18} className="text-amber-400" /> Offline Guidance
                </div>
                <p className="text-crisis-text-dim text-sm">If the network drops, follow the offline guide and keep your SOS page open.</p>
                <button onClick={() => navigate('/offline', { state: { emergencyType: incident.incidentType } })} className="btn-secondary w-full">
                  Open offline guide
                </button>
              </div>

              <div className="card p-6 space-y-3">
                <div className="flex items-center gap-2 text-crisis-text font-semibold">
                  <ArrowLeft size={18} className="text-crisis-primary" /> Hotel details
                </div>
                <p className="text-crisis-text-dim text-sm">{profile?.hotelBinding?.hotelLocation ?? incident.hotelContext?.address ?? 'Hotel location unavailable'}</p>
                <p className="text-crisis-text-dim text-sm">Room number: <span className="text-crisis-text font-semibold">{profile?.hotelBinding?.roomNumber ?? incident.roomNumber}</span></p>
                <p className="text-crisis-text-dim text-sm">Emergency line: <span className="text-crisis-text font-semibold">{callNumber}</span></p>
              </div>
            </aside>
          </section>
        </div>
      </div>

      {/* Floating New SOS Button */}
      <button
        onClick={() => {
          window.sessionStorage.removeItem(LAST_INCIDENT_KEY);
          window.sessionStorage.removeItem(LAST_INCIDENT_SNAPSHOT_KEY);
          navigate('/sos');
        }}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-crisis-primary to-red-700 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center z-50 border-2 border-red-600/60"
        title="Create a new SOS request"
      >
        <AlertTriangle size={24} strokeWidth={2.5} />
      </button>
    </>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, PhoneCall, Video, WifiOff, ShieldAlert, RotateCcw } from 'lucide-react';
import { fetchTouristIncidents, notifyTouristContact, triggerFallback } from '@overclock/shared/api';
import { useTouristAuth } from '../auth/TouristAuthContext';
import type { Incident } from '@overclock/shared/types';
import { TouristIncidentMap } from '../components/TouristIncidentMap';
import { TimelinePanel } from '../components/TimelinePanel';
import { TouristChatBox } from '../components/TouristChatBox';

const LAST_INCIDENT_KEY = 'hackdays_tourist_last_incident';
const LAST_INCIDENT_SNAPSHOT_KEY = 'hackdays_tourist_last_incident_snapshot';

function storeIncidentId(incident: Incident) {
  window.sessionStorage.setItem(LAST_INCIDENT_KEY, JSON.stringify({ incidentId: incident.id }));
}

function storeIncidentSnapshot(incident: Incident) {
  window.sessionStorage.setItem(LAST_INCIDENT_SNAPSHOT_KEY, JSON.stringify(incident));
  storeIncidentId(incident);
}

function readIncidentSnapshot(): Incident | null {
  try {
    const raw = window.sessionStorage.getItem(LAST_INCIDENT_SNAPSHOT_KEY);
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
  const [videoBusy, setVideoBusy] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const candidateId =
          incidentId ??
          (() => {
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

  const incidentContext = useMemo(
    () => ({
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
    }),
    [incident]
  );

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-crisis-text">Loading incident...</div>;
  }

  if (!incident) {
    return (
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-2xl mx-auto card p-8 text-center space-y-4">
          <ShieldAlert size={40} className="text-crisis-primary mx-auto" />
          <h1 className="text-3xl font-black text-crisis-text">No SOS found</h1>
          <p className="text-crisis-text-dim">Submit a new SOS from your tourist dashboard to see follow-up here.</p>
          <button onClick={() => navigate('/tourist')} className="btn-primary">
            Back to tourist home
          </button>
        </div>
      </div>
    );
  }

  const callNumber = profile?.hotelBinding?.hotelPhoneNumber ?? '+911120000000';

  const handleVideoCall = async () => {
    setVideoBusy(true);
    try {
      await notifyTouristContact({ incidentId: incident.id, mode: 'video' });
      const video = await triggerFallback(incident.id, 'video');
      setVideoUrl(String(video.meetUrl ?? ''));
      if (video.meetUrl) {
        navigate('/live-guidance', { state: { incidentId: incident.id, liveVideoUrl: video.meetUrl } });
      }
    } finally {
      setVideoBusy(false);
    }
  };

  const handleVoiceCall = async () => {
    setVoiceBusy(true);
    try {
      await notifyTouristContact({ incidentId: incident.id, mode: 'voice', contactNumber: callNumber });
      window.location.href = `tel:${callNumber.replace(/\s+/g, '')}`;
    } finally {
      setVoiceBusy(false);
    }
  };

  return (
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button onClick={handleVoiceCall} disabled={voiceBusy} className="btn-secondary inline-flex items-center justify-center gap-2">
                  <PhoneCall size={16} /> {voiceBusy ? 'Calling...' : 'Voice call'}
                </button>
                <button onClick={handleVideoCall} disabled={videoBusy} className="btn-primary inline-flex items-center justify-center gap-2">
                  <Video size={16} /> {videoBusy ? 'Notifying...' : 'Video call'}
                </button>
              </div>
              {videoUrl && <p className="text-xs text-crisis-text-dim">Video link ready: {videoUrl}</p>}
            </div>

            {incident.coordinates && <TouristIncidentMap center={incident.coordinates} incidents={[incident]} title="Incident map" />}

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
                <WifiOff size={18} className="text-amber-400" /> Offline guidance
              </div>
              <p className="text-crisis-text-dim text-sm">If the network drops, follow the offline guide and keep your SOS page open.</p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => navigate('/offline', { state: { emergencyType: incident.incidentType } })} className="btn-secondary">
                  Open offline guide
                </button>
                <button onClick={() => navigate('/live-guidance', { state: { incidentId: incident.id, liveVideoUrl: videoUrl } })} className="btn-secondary">
                  Open live guidance
                </button>
                <button
                  onClick={() => {
                    window.sessionStorage.removeItem(LAST_INCIDENT_KEY);
                    window.sessionStorage.removeItem(LAST_INCIDENT_SNAPSHOT_KEY);
                    navigate('/sos');
                  }}
                  className="btn-primary"
                >
                  New SOS
                </button>
              </div>
            </div>

            <div className="card p-6 space-y-3">
              <div className="flex items-center gap-2 text-crisis-text font-semibold">
                <ArrowLeft size={18} className="text-crisis-primary" /> Hotel details
              </div>
              <p className="text-crisis-text-dim text-sm">{profile?.hotelBinding?.hotelLocation ?? incident.hotelContext?.address ?? 'Hotel location unavailable'}</p>
              <p className="text-crisis-text-dim text-sm">
                Room number: <span className="text-crisis-text font-semibold">{profile?.hotelBinding?.roomNumber ?? incident.roomNumber}</span>
              </p>
              <p className="text-crisis-text-dim text-sm">
                Emergency line: <span className="text-crisis-text font-semibold">{callNumber}</span>
              </p>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}

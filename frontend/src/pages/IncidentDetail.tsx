import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  User,
  Clock,
  Loader2,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Bot,
  Phone,
  Video,
  ShieldAlert,
  Hospital,
  Flame,
  Shield,
} from 'lucide-react';
import type { Incident, ResponseSector } from '../types/incident';
import {
  fetchIncident,
  runAITriage,
  hotelVerifyAndDispatchIncident,
  sectorAcceptIncident,
  sectorResolveIncident,
  hotelCloseIncident,
} from '../api/client';
import { AITriageSummary } from '../components/AITriageSummary';
import { TimelinePanel } from '../components/TimelinePanel';

type ManagementRole = 'hotel' | 'hotel_staff' | 'fire' | 'medical' | 'police';
const MANAGEMENT_ROLE_KEY = 'hackdays_management_role';

function parseRole(raw: string | null): ManagementRole {
  if (raw === 'fire' || raw === 'medical' || raw === 'police' || raw === 'hotel_staff') return raw;
  return 'hotel';
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

const SECTOR_OPTIONS: Exclude<ResponseSector, 'hotel'>[] = ['hotel_staff', 'fire', 'medical', 'police'];

function getSuggestedSectors(incidentType: Incident['incidentType']): Exclude<ResponseSector, 'hotel'>[] {
  if (incidentType === 'medical') return ['hotel_staff', 'medical'];
  if (incidentType === 'fire' || incidentType === 'earthquake' || incidentType === 'flood') return ['hotel_staff', 'fire'];
  if (incidentType === 'security') return ['police'];
  if (incidentType === 'likely_fake') return [];
  return ['hotel_staff'];
}

function iconForIncident(incidentType: Incident['incidentType']) {
  return {
    medical: '🏥',
    fire: '🔥',
    security: '🛡️',
    earthquake: '🌍',
    flood: '💧',
    likely_fake: '⚠️',
    general: 'ℹ️',
    unknown: '❓',
  }[incidentType] ?? '❓';
}

function sectorStatus(
  sector: Exclude<ResponseSector, 'hotel'>,
  dispatched: Exclude<ResponseSector, 'hotel'>[],
  accepted: Exclude<ResponseSector, 'hotel'>[],
  resolved: Exclude<ResponseSector, 'hotel'>[]
) {
  if (resolved.includes(sector)) return 'resolved';
  if (accepted.includes(sector)) return 'accepted';
  if (dispatched.includes(sector)) return 'dispatched';
  return 'pending';
}

function sectorStatusLabel(status: 'pending' | 'dispatched' | 'accepted' | 'resolved') {
  if (status === 'resolved') return 'Resolved by sector';
  if (status === 'accepted') return 'Accepted by sector';
  if (status === 'dispatched') return 'Dispatched by hotel';
  return 'Awaiting dispatch';
}

function sectorStatusTone(status: 'pending' | 'dispatched' | 'accepted' | 'resolved') {
  if (status === 'resolved') return 'text-emerald-300 border-emerald-700/40 bg-emerald-900/15';
  if (status === 'accepted') return 'text-blue-300 border-blue-700/40 bg-blue-900/15';
  if (status === 'dispatched') return 'text-amber-300 border-amber-700/40 bg-amber-900/15';
  return 'text-slate-300 border-crisis-border/50 bg-crisis-bg/30';
}

export function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const role = parseRole(window.sessionStorage.getItem(MANAGEMENT_ROLE_KEY));
  const isHotel = role === 'hotel';
  const currentSector = role === 'hotel' ? null : role;

  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [triageLoading, setTriageLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFullTimeline, setShowFullTimeline] = useState(false);
  const [dispatchSelection, setDispatchSelection] = useState<Record<Exclude<ResponseSector, 'hotel'>, boolean>>({
    hotel_staff: false,
    fire: false,
    medical: false,
    police: false,
  });

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await fetchIncident(id);
      setIncident(data);
      const suggestedSectors = getSuggestedSectors(data.incidentType);
      const nextSelection: Record<Exclude<ResponseSector, 'hotel'>, boolean> = {
        hotel_staff: false,
        fire: false,
        medical: false,
        police: false,
      };
      for (const sector of data.dispatchedSectors ?? []) {
        if (sector === 'hotel_staff' || sector === 'fire' || sector === 'medical' || sector === 'police') {
          nextSelection[sector] = true;
        }
      }
      if (!data.verifiedByHotel && suggestedSectors.length > 0 && (data.dispatchedSectors?.length ?? 0) === 0) {
        suggestedSectors.forEach((sector) => {
          nextSelection[sector] = true;
        });
      }
      setDispatchSelection(nextSelection);
      setError(null);
    } catch {
      setError('Failed to load incident.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRunTriage = async () => {
    if (!incident || !isHotel) return;
    setTriageLoading(true);
    try {
      const result = await runAITriage(incident.id, incident.message, incident.location);
      setIncident(result.incident ?? incident);
      setError(null);
    } catch {
      setError('Failed to run AI triage.');
    } finally {
      setTriageLoading(false);
    }
  };

  const handleHotelDispatch = async () => {
    if (!incident || !isHotel) return;
    const sectors = SECTOR_OPTIONS.filter((sector) => dispatchSelection[sector]);
    if (sectors.length === 0 && incident.incidentType !== 'likely_fake') {
      setError('Select at least one sector before dispatching.');
      return;
    }

    setActionLoading(true);
    try {
      const note = incident.incidentType === 'likely_fake'
        ? 'Hotel marked this incident as likely fake; holding dispatch pending guest verification.'
        : `Hotel verified and dispatched: ${sectors.join(', ')}`;
      const updated = await hotelVerifyAndDispatchIncident(incident.id, sectors, note);
      setIncident(updated);
      setError(null);
    } catch {
      setError('Failed to dispatch sectors from hotel.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSectorAccept = async () => {
    if (!incident || !currentSector) return;
    setActionLoading(true);
    try {
      const updated = await sectorAcceptIncident(incident.id, currentSector);
      setIncident(updated);
      setError(null);
    } catch {
      setError('Failed to accept incident.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSectorResolve = async () => {
    if (!incident || !currentSector) return;
    setActionLoading(true);
    try {
      const updated = await sectorResolveIncident(incident.id, currentSector);
      setIncident(updated);
      setError(null);
    } catch {
      setError('Failed to mark sector as resolved.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleHotelClose = async () => {
    if (!incident || !isHotel) return;
    setActionLoading(true);
    try {
      const updated = await hotelCloseIncident(incident.id);
      setIncident(updated);
      setError(null);
    } catch {
      setError('Cannot close yet. All dispatched sectors must resolve first.');
    } finally {
      setActionLoading(false);
    }
  };

  const timelineLatestFirst = useMemo(() => {
    const timeline = incident?.responseTimeline ?? [];
    return [...timeline].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [incident?.responseTimeline]);
  const timelineVisible = showFullTimeline ? timelineLatestFirst : timelineLatestFirst.slice(0, 4);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-crisis-primary" />
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle size={40} className="text-red-400 mb-4" />
        <p className="text-crisis-text font-semibold mb-2">{error ?? 'Incident not found'}</p>
        <button onClick={() => navigate('/dashboard')} className="btn-secondary mt-2">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const dispatched = (incident.dispatchedSectors ?? []).filter((sector): sector is Exclude<ResponseSector, 'hotel'> => sector !== 'hotel');
  const accepted = (incident.acceptedSectors ?? []).filter((sector): sector is Exclude<ResponseSector, 'hotel'> => sector !== 'hotel');
  const resolved = (incident.resolvedSectors ?? []).filter((sector): sector is Exclude<ResponseSector, 'hotel'> => sector !== 'hotel');
  const allResolved = dispatched.length > 0 && dispatched.every((sector) => resolved.includes(sector));
  const isSectorRole = currentSector !== null;
  const canCurrentRoleOperateSector = isSectorRole && currentSector ? dispatched.includes(currentSector) : false;
  const currentAccepted = currentSector ? accepted.includes(currentSector) : false;
  const currentResolved = currentSector ? resolved.includes(currentSector) : false;
  const canHotelDispatch = isHotel && !incident.verifiedByHotel && incident.status !== 'closed';
  const canHotelClose = isHotel && incident.status === 'resolved' && allResolved;
  const suggestedSectors = getSuggestedSectors(incident.incidentType);

  const communicationContacts = [
    {
      key: 'guest',
      label: `Guest (${incident.guestName})`,
      subtitle: `Room ${incident.roomNumber}`,
      phone: '+910000000001',
      icon: <User size={14} className="text-blue-300" />,
    },
    {
      key: 'police',
      label: 'Police Response Desk',
      subtitle: 'Security coordination line',
      phone: '+910000001122',
      icon: <Shield size={14} className="text-cyan-300" />,
    },
    {
      key: 'fire',
      label: 'Fire Response Desk',
      subtitle: 'Fire and evacuation command',
      phone: '+910000003344',
      icon: <Flame size={14} className="text-orange-300" />,
    },
    {
      key: 'medical',
      label: 'Medical Response Desk',
      subtitle: 'On-call emergency medical support',
      phone: '+910000005566',
      icon: <Hospital size={14} className="text-emerald-300" />,
    },
  ];

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate('/dashboard')} className="btn-ghost flex items-center gap-1 text-sm -ml-2">
            <ArrowLeft size={16} /> Dashboard
          </button>
          <button onClick={load} className="btn-ghost p-2 rounded-lg">
            <RefreshCw size={15} />
          </button>
        </div>

        <div className="card p-6 mb-5 border border-crisis-border/70 bg-gradient-to-br from-crisis-surface to-crisis-bg/70">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">{iconForIncident(incident.incidentType)}</span>
                <code className="text-crisis-muted text-xs font-mono">{incident.id.toUpperCase()}</code>
              </div>
              <h1 className="text-2xl font-black text-crisis-text mb-1 capitalize">
                {incident.incidentType.replace('_', ' ')} incident
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`chip-${incident.status}`}>{incident.status.replace('_', ' ')}</span>
                <span className={`chip-${incident.severity}`}>{incident.severity}</span>
                {incident.verifiedByHotel && (
                  <span className="chip bg-blue-900/40 text-blue-300 border border-blue-700/50">Hotel Verified</span>
                )}
                {incident.incidentType === 'likely_fake' && (
                  <span className="chip bg-amber-900/40 text-amber-300 border border-amber-700/50">Likely Fake / Prank</span>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-crisis-border/60 bg-crisis-bg/40 px-4 py-3 text-right min-w-[170px]">
              <p className="text-[10px] uppercase tracking-[0.2em] text-crisis-muted">Incident Channel</p>
              <p className="text-sm text-crisis-text font-semibold mt-1 capitalize">{incident.source} / {incident.connectivityMode.replace('_', ' ')}</p>
            </div>
          </div>

          <div className="divider" />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-crisis-muted text-xs flex items-center gap-1"><User size={10} /> Guest</p>
              <p className="text-crisis-text font-semibold">{incident.guestName}</p>
            </div>
            <div>
              <p className="text-crisis-muted text-xs flex items-center gap-1"><MapPin size={10} /> Room</p>
              <p className="text-crisis-text font-semibold">{incident.roomNumber}</p>
            </div>
            <div>
              <p className="text-crisis-muted text-xs flex items-center gap-1"><Clock size={10} /> Reported</p>
              <p className="text-crisis-text font-semibold">{timeAgo(incident.createdAt)}</p>
            </div>
            <div>
              <p className="text-crisis-muted text-xs flex items-center gap-1"><ShieldAlert size={10} /> Last update</p>
              <p className="text-crisis-text font-semibold">{timeAgo(incident.updatedAt)}</p>
            </div>
          </div>

          <div className="mt-4 bg-crisis-bg/60 rounded-xl p-4 border border-crisis-border/50">
            <p className="text-crisis-text-dim text-xs mb-1">Guest message</p>
            <p className="text-crisis-text">{incident.message}</p>
          </div>

          {incident.verifiedByHotel && dispatched.length > 0 && (
            <div className="mt-4 bg-crisis-bg/60 rounded-xl p-4 border border-crisis-border/50">
              <p className="text-crisis-text-dim text-xs mb-2">Dispatch progress</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                {dispatched.map((sector) => {
                const status = sectorStatus(sector, dispatched, accepted, resolved);
                return (
                  <div key={sector} className="rounded-lg border border-crisis-border/50 px-3 py-2 bg-crisis-bg/40">
                    <p className="text-crisis-text font-semibold capitalize">{sector.replace('_', ' ')}</p>
                    <p className={`text-xs ${
                      status === 'resolved'
                        ? 'text-emerald-400'
                        : status === 'accepted'
                        ? 'text-blue-300'
                        : status === 'dispatched'
                        ? 'text-amber-300'
                        : 'text-crisis-text-dim'
                    }`}>
                      {sectorStatusLabel(status)}
                    </p>
                  </div>
                );
                })}
              </div>
              <p className="text-crisis-text-dim text-xs mt-3">
                Dispatched {dispatched.length} • Accepted {accepted.length} • Resolved {resolved.length}
              </p>
            </div>
          )}

          {!isHotel && isSectorRole && !canCurrentRoleOperateSector && (
            <div className="mt-4 card p-4 border-amber-700/40 bg-amber-900/10 text-amber-300 text-sm">
              This incident is not dispatched to your sector yet.
            </div>
          )}

          {isHotel && canHotelDispatch && (
            <div className="mt-4 card p-4 bg-crisis-bg/60 border border-crisis-border/50 space-y-3">
              <p className="text-crisis-text font-semibold text-sm">Hotel dispatch control</p>
              <div className="rounded-lg border border-crisis-border/60 bg-crisis-bg/50 px-3 py-2 text-sm">
                <p className="text-crisis-text-dim text-xs uppercase tracking-[0.16em] mb-1">Dispatch recommendation</p>
                {incident.aiTriage ? (
                  <p className="text-crisis-text">
                    {incident.aiTriage.summary}
                    <span className="text-crisis-text-dim"> | Confidence {incident.aiTriage.confidence}%</span>
                  </p>
                ) : (
                  <p className="text-crisis-text-dim">Run AI triage to get a dispatch recommendation before verification.</p>
                )}
              </div>
              {incident.incidentType === 'likely_fake' && (
                <div className="rounded-lg border border-amber-700/40 bg-amber-900/15 px-3 py-2 text-amber-300 text-sm">
                  AI flagged this SOS as likely fake. Verify with guest before dispatching sectors.
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SECTOR_OPTIONS.map((sector) => {
                  const recommended = suggestedSectors.includes(sector);
                  const status = sectorStatus(sector, dispatched, accepted, resolved);
                  return (
                    <button
                      key={sector}
                      type="button"
                      onClick={() => setDispatchSelection((prev) => ({ ...prev, [sector]: !prev[sector] }))}
                      className={`text-left rounded-lg border px-3 py-2 transition ${dispatchSelection[sector] ? 'border-crisis-primary/60 bg-crisis-primary/10' : 'border-crisis-border/50 bg-crisis-bg/40'}`}
                    >
                      <p className="text-crisis-text font-semibold capitalize">{sector.replace('_', ' ')}</p>
                      <p className={`text-xs mt-1 rounded-md border px-2 py-1 inline-block ${sectorStatusTone(status)}`}>
                        {sectorStatusLabel(status)}
                      </p>
                      {recommended && <p className="text-[11px] text-crisis-primary mt-1">Recommended by triage</p>}
                    </button>
                  );
                })}
              </div>
              <button onClick={handleHotelDispatch} disabled={actionLoading} className="btn-primary py-2 px-4 text-sm">
                {actionLoading ? 'Saving...' : incident.incidentType === 'likely_fake' ? 'Mark Verified / Hold Dispatch' : 'Verify and Dispatch'}
              </button>
            </div>
          )}

          {isHotel && incident.verifiedByHotel && incident.status !== 'closed' && (
            <div className="mt-4 card p-4 bg-emerald-900/10 border border-emerald-700/40 text-emerald-300 text-sm">
              Verified by hotel. Awaiting dispatched sector progress.
            </div>
          )}

          {isHotel && canHotelClose && (
            <div className="mt-4 card p-4 bg-crisis-bg/60 border border-crisis-border/50 space-y-3">
              <p className="text-crisis-text font-semibold text-sm">All dispatched sectors resolved</p>
              <button onClick={handleHotelClose} disabled={actionLoading} className="btn-secondary py-2 px-4 text-sm">
                Close incident
              </button>
            </div>
          )}

          {isHotel && incident.status === 'closed' && (
            <div className="mt-4 card p-4 bg-emerald-900/10 border border-emerald-700/40 text-emerald-300 text-sm flex items-center gap-2">
              <CheckCircle size={16} /> Incident closed by hotel.
            </div>
          )}

          {!isHotel && isSectorRole && canCurrentRoleOperateSector && currentSector && (
            <div className="mt-4 card p-4 bg-crisis-bg/60 border border-crisis-border/50 space-y-3">
              <p className="text-crisis-text font-semibold text-sm capitalize">{currentSector.replace('_', ' ')} sector actions</p>
              <div className="flex flex-wrap gap-3">
                {!currentAccepted && !currentResolved && (
                  <button
                    onClick={handleSectorAccept}
                    disabled={actionLoading}
                    className="btn-primary py-2 px-4 text-sm"
                  >
                    Accept incident
                  </button>
                )}
                {currentAccepted && !currentResolved && (
                  <button
                    onClick={handleSectorResolve}
                    disabled={actionLoading}
                    className="btn-secondary py-2 px-4 text-sm"
                  >
                    Mark sector resolved
                  </button>
                )}
              </div>
              {currentResolved && (
                <div className="text-emerald-300 text-sm flex items-center gap-2">
                  <CheckCircle size={14} /> Verified completed by {currentSector}.
                </div>
              )}
            </div>
          )}
        </div>

        {isHotel && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="section-title flex items-center gap-2"><Bot size={16} className="text-crisis-primary" /> AI triage</p>
                <button
                  id="run-triage-btn"
                  onClick={handleRunTriage}
                  disabled={triageLoading}
                  className="btn-ghost text-xs flex items-center gap-1 py-1"
                >
                  {triageLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                  {incident.aiTriage ? 'Re-run' : 'Run triage'}
                </button>
              </div>

              {incident.aiTriage ? (
                <AITriageSummary triage={incident.aiTriage} loading={triageLoading} humanApproved={incident.humanApproved} />
              ) : (
                <div className="card p-6 text-center">
                  <Bot size={24} className="text-crisis-muted mx-auto mb-2" />
                  <p className="text-crisis-text-dim text-sm">No triage data yet.</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <p className="section-title flex items-center gap-2 text-sm">Response communication</p>
              <div className="card p-4 space-y-3">
                {communicationContacts.map((contact) => (
                  <div key={contact.key} className="rounded-xl border border-crisis-border/50 p-3 bg-crisis-bg/50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-crisis-text text-sm font-semibold flex items-center gap-2">
                          {contact.icon}
                          {contact.label}
                        </p>
                        <p className="text-crisis-text-dim text-xs">{contact.subtitle}</p>
                        <p className="text-crisis-text-dim text-xs mt-1">{contact.phone}</p>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={`tel:${contact.phone}`}
                          className="btn-ghost text-xs py-1.5 px-2 inline-flex items-center gap-1"
                        >
                          <Phone size={12} /> Voice
                        </a>
                        <a
                          href={`https://meet.jit.si/hackdays-${incident.id}-${contact.key}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-ghost text-xs py-1.5 px-2 inline-flex items-center gap-1"
                        >
                          <Video size={12} /> Video
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="card p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="section-title flex items-center gap-2"><Clock size={16} className="text-crisis-primary" /> Response timeline</p>
            {timelineLatestFirst.length > 4 && (
              <button
                type="button"
                className="btn-ghost text-xs py-1"
                onClick={() => setShowFullTimeline((prev) => !prev)}
              >
                {showFullTimeline ? 'Show latest 4' : `Expand all (${timelineLatestFirst.length})`}
              </button>
            )}
          </div>
          {timelineVisible.length === 0 ? (
            <p className="text-crisis-text-dim text-sm">No timeline entries yet.</p>
          ) : (
            <TimelinePanel timeline={timelineVisible} />
          )}
        </div>
      </div>
    </div>
  );
}

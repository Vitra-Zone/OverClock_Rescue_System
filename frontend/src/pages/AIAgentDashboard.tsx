import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Activity, ArrowLeft, Clock, CheckCircle2, ClipboardList, MapPin, RefreshCw, ShieldAlert, Users } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import type { Incident } from '../types/incident';
import { fetchIncident, runAITriage } from '../api/client';
import { useRealtimeIncidents } from '../hooks/useRealtimeIncidents';

function isActiveIncident(incident: Incident) {
  return incident.status !== 'resolved' && incident.status !== 'closed';
}

function getIncidentPriority(incident: Incident) {
  if (incident.severity === 'critical') return 'Critical';
  if (incident.severity === 'high') return 'High';
  if (incident.severity === 'medium') return 'Medium';
  return 'Low';
}

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatCard({ label, value, hint, tone }: { label: string; value: string; hint: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
        </div>
        <span className={`h-3 w-3 rounded-full ${tone}`} />
      </div>
      <p className="mt-3 text-xs text-gray-400">{hint}</p>
    </div>
  );
}

export function AIAgentDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { incidents: realtimeIncidents, loading: incidentsLoading, error: incidentsError } = useRealtimeIncidents();
  const activeIncidents = useMemo(
    () => realtimeIncidents.filter(isActiveIncident),
    [realtimeIncidents]
  );

  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [triageNote, setTriageNote] = useState<string>('');
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadIncidentDetails = async (incidentId: string) => {
    if (!incidentId) {
      setSelectedIncident(null);
      setTriageNote('');
      return;
    }

    setSelectedLoading(true);
    setDetailError(null);

    try {
      let incident = await fetchIncident(incidentId);

      if (!incident.aiTriage) {
        setTriageNote('Running AI triage from backend...');
        await runAITriage(incident.id, incident.message, incident.location);
        incident = await fetchIncident(incidentId);
        setTriageNote('AI triage completed and synced from Firestore.');
      } else {
        setTriageNote('Incident loaded from Firestore.');
      }

      setSelectedIncident(incident);
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : 'Unable to load incident details.');
    } finally {
      setSelectedLoading(false);
    }
  };

  const summary = useMemo(() => {
    const total = realtimeIncidents.length;
    const active = activeIncidents.length;
    const critical = activeIncidents.filter((incident) => incident.severity === 'critical').length;
    const triaged = realtimeIncidents.filter((incident) => Boolean(incident.aiTriage)).length;
    const coverage = total > 0 ? Math.round((triaged / total) * 100) : 0;

    return { total, active, critical, coverage };
  }, [activeIncidents, realtimeIncidents]);

  useEffect(() => {
    if (!selectedIncidentId && activeIncidents[0]?.id) {
      setSelectedIncidentId(activeIncidents[0].id);
    }
    if (selectedIncidentId && !realtimeIncidents.some((incident) => incident.id === selectedIncidentId) && activeIncidents[0]?.id) {
      setSelectedIncidentId(activeIncidents[0].id);
    }
  }, [activeIncidents, realtimeIncidents, selectedIncidentId]);

  useEffect(() => {
    const loadSelectedIncident = async () => {
      await loadIncidentDetails(selectedIncidentId);
    };

    void loadSelectedIncident();
  }, [selectedIncidentId]);

  const selected = selectedIncident ?? realtimeIncidents.find((incident) => incident.id === selectedIncidentId) ?? null;
  const workflowSteps = selected?.aiTriage?.workflowSteps ?? [];
  const timeline = selected?.responseTimeline ?? [];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.18),_transparent_28%),linear-gradient(180deg,#0b1220_0%,#0f172a_45%,#0b1220_100%)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-white/10 bg-black/25 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 transition hover:bg-white/10"
          >
            <ArrowLeft size={13} />
            Back
          </button>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-orange-200">
                <ShieldAlert size={13} />
                Emergency operations console
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">AI incident command</h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-300">
                Live incidents are synced from Firestore. The panel below focuses on triage, response state, and the latest timeline only.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                <Activity size={14} className={incidentsLoading ? 'text-amber-300' : 'text-emerald-300'} />
                {incidentsLoading ? 'Syncing live feed' : 'Live feed connected'}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                <Users size={14} className="text-orange-300" />
                {user?.email ?? 'Staff session active'}
              </div>
            </div>
          </div>
        </header>

        {incidentsError && (
          <div className="rounded-2xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-200">
            {incidentsError}
          </div>
        )}

        {detailError && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/30 p-4 text-sm text-amber-100">
            {detailError}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total incidents" value={`${summary.total}`} hint="All incidents currently in Firestore." tone="bg-sky-400" />
          <StatCard label="Active incidents" value={`${summary.active}`} hint="Open or in-progress cases requiring attention." tone="bg-orange-400" />
          <StatCard label="Critical cases" value={`${summary.critical}`} hint="Critical incidents among the active set." tone="bg-red-400" />
          <StatCard label="AI triage coverage" value={`${summary.coverage}%`} hint="Incidents with stored triage results." tone="bg-emerald-400" />
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-white/10 bg-black/25 p-4 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-5">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Realtime incidents</p>
                <h2 className="mt-1 text-lg font-semibold">Live queue</h2>
              </div>
              <div className="text-xs text-slate-400">
                {incidentsLoading ? 'Updating from Firestore...' : `${activeIncidents.length} active`}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {!incidentsLoading && activeIncidents.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">
                  No active incidents right now.
                </div>
              )}

              {activeIncidents.map((incident) => {
                const selectedClass = incident.id === selectedIncidentId ? 'border-orange-400/50 bg-orange-500/10' : 'border-white/10 bg-white/5 hover:border-orange-300/30';

                return (
                  <button
                    key={incident.id}
                    type="button"
                    onClick={() => setSelectedIncidentId(incident.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition-all ${selectedClass}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-white">{incident.id.toUpperCase()}</p>
                          <span className={`rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.2em] ${incident.severity === 'critical' ? 'bg-red-500/15 text-red-200' : incident.severity === 'high' ? 'bg-orange-500/15 text-orange-200' : 'bg-slate-500/15 text-slate-200'}`}>
                            {incident.severity}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-sm text-slate-300">{incident.location}</p>
                        <p className="mt-2 text-xs text-slate-500">{incident.incidentType} · {incident.status} · {formatTime(incident.updatedAt)}</p>
                      </div>
                      <div className="text-right text-xs text-slate-400">
                        <p>Priority</p>
                        <p className="mt-1 font-semibold text-white">{getIncidentPriority(incident)}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/25 p-4 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-5">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Selected incident</p>
                <h2 className="mt-1 text-lg font-semibold">Response details</h2>
              </div>
              <button
                type="button"
                onClick={() => void loadIncidentDetails(selectedIncidentId)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 transition hover:bg-white/10"
              >
                <RefreshCw size={13} className={selectedLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            {!selected ? (
              <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">
                Select an incident from the live queue to load backend triage and the latest response timeline.
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                      <MapPin size={13} className="text-orange-300" />
                      Incident location
                    </div>
                    <p className="mt-3 text-lg font-semibold text-white">{selected.location}</p>
                    <p className="mt-2 text-sm text-slate-300">{selected.message}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                      <ClipboardList size={13} className="text-emerald-300" />
                      Triage summary
                    </div>
                    <p className="mt-3 text-lg font-semibold text-white">
                      {selected.aiTriage?.summary ?? selected.aiSummary ?? 'Triage pending'}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      {selected.aiTriage?.nextAction ?? selected.recommendedAction ?? 'Awaiting next action from backend.'}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Status</p>
                    <p className="mt-2 text-base font-semibold text-white">{selected.status}</p>
                    <p className="mt-1 text-sm text-slate-400">Workflow stage: {selected.aiTriage?.workflowStage ?? 'intake'}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Assigned team</p>
                    <p className="mt-2 text-base font-semibold text-white">{selected.aiTriage?.assignedTo ?? selected.assignedTo}</p>
                    <p className="mt-1 text-sm text-slate-400">Confidence: {selected.aiTriage?.confidence ?? 0}%</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Channel</p>
                    <p className="mt-2 text-base font-semibold text-white">{selected.connectivityMode}</p>
                    <p className="mt-1 text-sm text-slate-400">Source: {selected.source}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Backend sync</p>
                      <p className="mt-1 text-sm text-slate-300">{triageNote || 'Live Firestore record loaded.'}</p>
                    </div>
                    {selectedLoading && <Activity className="h-5 w-5 animate-spin text-orange-300" />}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                      <ShieldAlert size={13} className="text-red-300" />
                      Workflow steps
                    </div>
                    <div className="mt-4 space-y-3">
                      {(workflowSteps.length > 0 ? workflowSteps : ['Awaiting triage from backend']).map((step, index) => (
                        <div key={`${step}-${index}`} className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
                          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-xs font-semibold text-orange-200">
                            {index + 1}
                          </div>
                          <p className="text-sm leading-6 text-slate-200">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                      <Clock size={13} className="text-sky-300" />
                      Timeline
                    </div>
                    <div className="mt-4 space-y-3">
                      {timeline.length > 0 ? timeline.slice(-5).map((entry) => (
                        <div key={`${entry.timestamp}-${entry.message}`} className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                            <span>{entry.actor}</span>
                            <span>{formatTime(entry.timestamp)}</span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-200">{entry.message}</p>
                        </div>
                      )) : (
                        <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-slate-400">
                          No timeline entries yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {selected.aiTriage?.analytics && (
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Message length</p>
                      <p className="mt-2 text-xl font-semibold text-white">{selected.aiTriage.analytics.messageLength}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Keyword hits</p>
                      <p className="mt-2 text-xl font-semibold text-white">{selected.aiTriage.analytics.keywordHits}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Emergency signals</p>
                      <p className="mt-2 text-xl font-semibold text-white">{selected.aiTriage.analytics.emergencySignals}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Non-emergency signals</p>
                      <p className="mt-2 text-xl font-semibold text-white">{selected.aiTriage.analytics.nonEmergencySignals}</p>
                    </div>
                  </div>
                )}

                {selectedLoading && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                    Loading backend record...
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
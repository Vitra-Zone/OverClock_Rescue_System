import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Bot, Sparkles, RefreshCw, Activity, AlertTriangle, ChevronRight, Loader2 } from 'lucide-react';
import { isAxiosError } from 'axios';
import type { ConnectivityMode, Incident } from '../types/incident';
import { fetchIncident, fetchIncidents, orchestrateAgent, runAITriage } from '../api/client';

interface Props {
  connectivity: ConnectivityMode;
}

const MANAGEMENT_ROLE_KEY = 'hackdays_management_role';

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err) && err.response?.status === 401) {
    return 'Unauthorized. Please sign in again to continue.';
  }
  return fallback;
}

function getActiveIncidents(incidents: Incident[]): Incident[] {
  return incidents.filter((item) => item.status !== 'resolved' && item.status !== 'closed');
}

export function AgentPage({ connectivity: _connectivity }: Props) {
  const role = window.sessionStorage.getItem(MANAGEMENT_ROLE_KEY);
  if (role && role !== 'hotel') {
    return <Navigate to="/staff" replace />;
  }

  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');
  const [liveIncidents, setLiveIncidents] = useState<Incident[]>([]);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeIncidentById = async (id: string) => {
    setAnalysisLoading(true);
    setError(null);
    try {
      const target = await fetchIncident(id);

      if (!target.aiTriage) {
        await runAITriage(target.id, target.message, target.location);
      }

      const output = await orchestrateAgent(target.id);
      const refreshed = await fetchIncident(target.id);

      setIncident(refreshed);
      setResult(output.decision as Record<string, unknown>);
      setSelectedIncidentId(id);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not analyze the selected incident.'));
    } finally {
      setAnalysisLoading(false);
    }
  };

  const loadLiveIncidents = async () => {
    setListLoading(true);
    setError(null);
    try {
      const list = await fetchIncidents();
      const activeList = getActiveIncidents(list);
      setLiveIncidents(activeList);
      if (activeList.length === 0) {
        setIncident(null);
        setSelectedIncidentId('');
        setError('No active incidents available right now.');
        return;
      }

      const fallbackId = activeList[0].id;
      const nextId = selectedIncidentId && activeList.some((item) => item.id === selectedIncidentId)
        ? selectedIncidentId
        : fallbackId;

      void analyzeIncidentById(nextId);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load incidents from backend.'));
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    void loadLiveIncidents();
  }, []);

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[0.92fr_1.08fr] gap-6 items-start">
        <aside className="space-y-4">
          <div className="card p-6 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-16 -right-12 w-56 h-56 rounded-full bg-crisis-primary/10 blur-3xl" />
            </div>
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crisis-primary/20 border border-crisis-primary/30 text-crisis-primary text-xs mb-4">
                <Bot size={14} /> AI Agent
              </div>
              <h1 className="text-3xl font-black text-crisis-text mb-3">Live Incidents</h1>
              <p className="text-crisis-text-dim text-sm mb-5">
                Click an incident to view AI decision and analytics on the right.
              </p>

              <div className="space-y-3 mb-4">
                <button onClick={loadLiveIncidents} disabled={listLoading || analysisLoading} className="btn-secondary w-full flex items-center justify-center gap-2">
                  <Activity size={16} /> Refresh Live Incidents
                </button>
              </div>

              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {listLoading && liveIncidents.length === 0 && (
                  <div className="card p-4 bg-crisis-bg/60 text-crisis-text-dim text-sm flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Loading incidents...
                  </div>
                )}

                {!listLoading && liveIncidents.length === 0 && (
                  <div className="card p-4 bg-crisis-bg/60 text-crisis-text-dim text-sm">
                    No active incidents available.
                  </div>
                )}

                {liveIncidents.map((item) => {
                  const isSelected = item.id === selectedIncidentId;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id !== selectedIncidentId) {
                          setResult(null);
                          void analyzeIncidentById(item.id);
                        }
                      }}
                      className={`w-full card p-4 text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-crisis-primary/60 bg-crisis-primary/10'
                          : 'bg-crisis-bg/60 hover:border-crisis-primary/40'
                      }`}
                    >
                      <div>
                        <p className="text-crisis-text font-semibold">{item.id.toUpperCase()}</p>
                        <p className="text-xs text-crisis-text-dim mt-1">{item.incidentType} • {item.status}</p>
                        <p className="text-xs text-crisis-muted mt-1 truncate">{item.location}</p>
                      </div>
                      <ChevronRight size={16} className={isSelected ? 'text-crisis-primary' : 'text-crisis-muted'} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        <section className="space-y-4">
          <div className="card p-6">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-crisis-muted mb-1">Selected incident analytics</p>
                <h2 className="text-2xl font-black text-crisis-text">{incident ? incident.id.toUpperCase() : 'No incident selected'}</h2>
              </div>
              {(analysisLoading || listLoading) && <RefreshCw size={16} className="animate-spin text-crisis-primary" />}
            </div>

            {incident ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card p-4 bg-crisis-bg/60">
                  <p className="text-xs uppercase tracking-[0.2em] text-crisis-muted mb-2">Incoming message</p>
                  <p className="text-crisis-text text-sm leading-relaxed">{incident.message}</p>
                  <p className="text-crisis-text-dim text-xs mt-3">Location: {incident.location}</p>
                </div>
                <div className="card p-4 bg-crisis-bg/60">
                  <p className="text-xs uppercase tracking-[0.2em] text-crisis-muted mb-2">AI analytics</p>
                  <p className="text-sm text-crisis-text-dim leading-relaxed mb-2">
                    Type: <span className="text-crisis-text">{incident.aiTriage?.incidentType ?? incident.incidentType}</span>
                  </p>
                  <p className="text-sm text-crisis-text-dim leading-relaxed mb-2">
                    Severity: <span className="text-crisis-text">{incident.aiTriage?.severity ?? incident.severity}</span>
                  </p>
                  <p className="text-sm text-crisis-text-dim leading-relaxed">
                    Assigned to: <span className="text-crisis-text">{incident.aiTriage?.assignedTo ?? incident.assignedTo}</span>
                  </p>
                </div>
                <div className="card p-4 bg-crisis-bg/60 md:col-span-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-crisis-muted mb-2">AI summary</p>
                  <p className="text-sm text-crisis-text-dim leading-relaxed">
                    {incident.aiTriage?.summary ?? incident.aiSummary ?? 'No AI summary available yet.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="card p-5 bg-crisis-bg/60 text-crisis-text-dim text-sm">
                Select an incident from the left panel to view AI decision and analytics.
              </div>
            )}

            {error && (
              <div className="mt-4 card p-4 border-red-700/40 bg-red-900/10 text-red-300 text-sm">
                <AlertTriangle size={16} className="inline mr-2" />
                {error}
              </div>
            )}
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bot size={18} className="text-crisis-primary" />
              <h3 className="text-xl font-bold text-crisis-text">Agent decision output</h3>
            </div>

            {result ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ['Action', String(result.action)],
                  ['Urgency', String(result.urgency)],
                  ['Reasoning', String(result.reasoning)],
                  ['Draft message', String(result.draftMessage)],
                  ['Escalate', String(result.shouldEscalate)],
                  ['Recommend close', String(result.recommendClose)],
                ].map(([label, value]) => (
                  <div key={label} className="card p-4 bg-crisis-bg/60">
                    <p className="text-xs uppercase tracking-[0.2em] text-crisis-muted mb-1">{label}</p>
                    <p className="text-crisis-text text-sm leading-relaxed">{value}</p>
                  </div>
                ))}
              </div>
            ) : analysisLoading ? (
              <div className="card p-6 bg-crisis-bg/60 text-crisis-text-dim text-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Running AI analysis...
              </div>
            ) : (
              <div className="card p-6 bg-crisis-bg/60 text-crisis-text-dim text-sm">
                Click any incident on the left to generate decision output here.
              </div>
            )}
          </div>
        </section>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { MessageSquare, Phone, Video, Loader2, CheckCircle } from 'lucide-react';
import type { FallbackMode, ConnectivityMode } from '../types/incident';
import { triggerFallback } from '../api/client';

interface Props {
  incidentId: string;
  connectivity: ConnectivityMode;
}

interface FallbackState {
  mode: FallbackMode | null;
  loading: boolean;
  result: Record<string, unknown> | null;
  error: string | null;
}

const FALLBACK_MODES: { mode: FallbackMode; icon: React.ReactNode; label: string; desc: string; color: string }[] = [
  {
    mode: 'sms',
    icon: <MessageSquare size={20} />,
    label: 'SMS Alert',
    desc: 'Send emergency SMS to hotel staff',
    color: 'text-amber-400 border-amber-700/40 bg-amber-900/20 hover:bg-amber-900/40',
  },
  {
    mode: 'voice',
    icon: <Phone size={20} />,
    label: 'Voice Call',
    desc: 'Trigger automated voice call to emergency line',
    color: 'text-purple-400 border-purple-700/40 bg-purple-900/20 hover:bg-purple-900/40',
  },
  {
    mode: 'video',
    icon: <Video size={20} />,
    label: 'Live Video',
    desc: 'Connect to video call with emergency coordinator',
    color: 'text-blue-400 border-blue-700/40 bg-blue-900/20 hover:bg-blue-900/40',
  },
];

export function FallbackFlow({ incidentId, connectivity }: Props) {
  const [state, setState] = useState<FallbackState>({
    mode: null, loading: false, result: null, error: null,
  });

  const trigger = async (mode: FallbackMode) => {
    setState({ mode, loading: true, result: null, error: null });
    try {
      const result = await triggerFallback(incidentId, mode);
      setState({ mode, loading: false, result: result as Record<string, unknown>, error: null });
    } catch (err: unknown) {
      setState({ mode, loading: false, result: null, error: 'Fallback delivery failed. Check backend.' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-crisis-text-dim text-sm">
        <span>Connectivity:</span>
        <span className="font-semibold text-crisis-text capitalize">{connectivity.replace('_', ' ')}</span>
      </div>

      <div className="grid gap-3">
        {FALLBACK_MODES.map(({ mode, icon, label, desc, color }) => (
          <button
            key={mode}
            id={`fallback-${mode}-btn`}
            onClick={() => trigger(mode)}
            disabled={state.loading}
            className={`flex items-center gap-4 border rounded-xl p-4 transition-all duration-200 
                        text-left w-full ${color}
                        ${state.loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="shrink-0">{icon}</div>
            <div className="flex-1">
              <p className="font-semibold">{label}</p>
              <p className="text-xs opacity-70">{desc}</p>
            </div>
            {state.loading && state.mode === mode && <Loader2 size={16} className="animate-spin shrink-0" />}
            {state.result && state.mode === mode && <CheckCircle size={16} className="text-emerald-400 shrink-0" />}
          </button>
        ))}
      </div>

      {/* Result display */}
      {state.result && (
        <div className="card p-4 space-y-2 animate-fade-in">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <CheckCircle size={15} />
            Fallback Ready: {state.mode?.toUpperCase()}
          </div>
          {state.mode === 'sms' && (
            <div className="space-y-1">
              <p className="text-crisis-text-dim text-xs">Recipient: <span className="text-crisis-text">{String(state.result.recipient)}</span></p>
              <div className="bg-crisis-bg/60 rounded-lg p-3 text-xs text-crisis-text font-mono leading-relaxed border border-crisis-border/50">
                {String(state.result.smsContent)}
              </div>
            </div>
          )}
          {state.mode === 'voice' && (
            <div className="space-y-1">
              <p className="text-crisis-text-dim text-xs">Calling: <span className="text-crisis-text">{String(state.result.recipient)}</span></p>
              <div className="bg-crisis-bg/60 rounded-lg p-3 text-xs text-crisis-text italic leading-relaxed border border-crisis-border/50">
                "{String(state.result.callScript)}"
              </div>
            </div>
          )}
          {state.mode === 'video' && (
            <div className="space-y-1">
              <p className="text-crisis-text-dim text-xs">Agent: <span className="text-crisis-text">{String(state.result.agentName)}</span></p>
              <p className="text-crisis-text-dim text-xs">Est. Wait: <span className="text-crisis-text">{String(state.result.estimatedWait)}</span></p>
              <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3 flex items-center justify-center gap-2">
                <Video size={24} className="text-blue-400" />
                <div>
                  <p className="text-blue-300 font-semibold text-sm">Connecting...</p>
                  <p className="text-blue-400/60 text-xs">{String(state.result.meetUrl)}</p>
                </div>
              </div>
            </div>
          )}
          <p className="text-crisis-muted text-xs italic">{String(state.result.note)}</p>
        </div>
      )}

      {state.error && (
        <div className="card p-3 border-red-700/50 bg-red-900/20">
          <p className="text-red-400 text-sm">{state.error}</p>
        </div>
      )}
    </div>
  );
}

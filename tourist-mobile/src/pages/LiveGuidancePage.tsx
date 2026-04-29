import { useLocation, useNavigate } from 'react-router-dom';

export function LiveGuidancePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { incidentId?: string; liveVideoUrl?: string } | undefined;

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-3xl font-black text-white">Live Guidance</h1>
        <p className="text-slate-400">Your live support session can be opened here from the SOS flow.</p>
        <div className="rounded-3xl border border-slate-700 bg-slate-900 p-5 space-y-3">
          <p className="text-sm text-slate-300">Incident ID: {state?.incidentId ?? 'Not available'}</p>
          <p className="text-sm text-slate-300 break-all">Video URL: {state?.liveVideoUrl ?? 'Not connected'}</p>
          <button onClick={() => navigate('/tourist')} className="btn-primary">Back to dashboard</button>
        </div>
      </div>
    </div>
  );
}

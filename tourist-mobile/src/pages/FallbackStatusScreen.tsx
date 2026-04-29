import { useNavigate } from 'react-router-dom';

export function FallbackStatusScreen(props: { connectivity?: string; onModeChange?: (mode: string) => void }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-700 bg-slate-900 p-6 space-y-4">
        <h1 className="text-3xl font-black text-white">Fallback Status</h1>
        <p className="text-slate-400">Current mode: {props.connectivity ?? 'offline'}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button onClick={() => props.onModeChange?.('sms_fallback')} className="btn-primary">Use SMS Fallback</button>
          <button onClick={() => navigate('/offline')} className="btn-secondary">Open offline guide</button>
        </div>
      </div>
    </div>
  );
}

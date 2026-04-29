import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, MapPin, MessageSquare, FileText, LogOut } from 'lucide-react';
import { useTouristAuth } from '../auth/TouristAuthContext';

export function TouristPortalPage() {
  const navigate = useNavigate();
  const { profile, logout, refreshProfile } = useTouristAuth();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const fullName = useMemo(() => profile ? `${profile.touristFirstName} ${profile.touristLastName}` : 'Tourist', [profile]);

  return (
    <div className="min-h-screen px-4 py-4 pb-24">
      <div className="mx-auto max-w-3xl space-y-4">
        <section className="rounded-3xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-2xl shadow-black/30">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Tourist dashboard</p>
              <h1 className="mt-2 text-3xl font-black text-white">{fullName}</h1>
              <p className="mt-1 text-sm text-slate-400">Your digital rescue card and emergency controls.</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300 inline-flex items-center gap-2">
              <BadgeCheck size={14} /> Registered tourist
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Digital ID</p>
              <p className="mt-1 font-semibold text-white">{profile?.digitalId ?? 'Loading...'}</p>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Hotel</p>
              <p className="mt-1 font-semibold text-white">{profile?.hotelBinding?.hotelName ?? 'Not linked'}</p>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Location</p>
              <p className="mt-1 font-semibold text-white">{profile?.currentLocation ?? 'Not updated'}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button onClick={() => navigate('/sos')} className="rounded-3xl bg-red-600 p-5 text-left text-white shadow-lg shadow-red-950/40 transition hover:bg-red-500">
            <div className="flex items-center gap-3">
              <MessageSquare size={18} />
              <div>
                <p className="text-lg font-bold">Emergency SOS</p>
                <p className="text-sm text-red-100/90">Start a new emergency report.</p>
              </div>
            </div>
          </button>

          <button onClick={() => navigate('/profile')} className="rounded-3xl border border-slate-700 bg-slate-900 p-5 text-left text-white transition hover:border-slate-500">
            <div className="flex items-center gap-3">
              <FileText size={18} />
              <div>
                <p className="text-lg font-bold">Profile</p>
                <p className="text-sm text-slate-400">Update your tourist details.</p>
              </div>
            </div>
          </button>

          <button onClick={() => navigate('/incidents')} className="rounded-3xl border border-slate-700 bg-slate-900 p-5 text-left text-white transition hover:border-slate-500">
            <div className="flex items-center gap-3">
              <MapPin size={18} />
              <div>
                <p className="text-lg font-bold">Incident history</p>
                <p className="text-sm text-slate-400">View previous SOS reports.</p>
              </div>
            </div>
          </button>

          <button onClick={() => navigate('/location')} className="rounded-3xl border border-slate-700 bg-slate-900 p-5 text-left text-white transition hover:border-slate-500">
            <div className="flex items-center gap-3">
              <MapPin size={18} />
              <div>
                <p className="text-lg font-bold">Live map</p>
                <p className="text-sm text-slate-400">See nearby incidents and your location.</p>
              </div>
            </div>
          </button>
        </section>

        <div className="rounded-3xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-300">
          If you are in danger, tap Emergency SOS first. The app will keep the tourist flow separate from the management portal.
        </div>

        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await logout();
              navigate('/login', { replace: true });
            } finally {
              setBusy(false);
            }
          }}
          className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 inline-flex items-center justify-center gap-2"
        >
          <LogOut size={16} /> {busy ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </div>
  );
}

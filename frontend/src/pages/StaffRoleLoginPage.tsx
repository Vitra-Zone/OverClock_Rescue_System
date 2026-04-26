import React, { useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Flame, HeartPulse, LogIn, ShieldCheck } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

type RoleKey = 'hotel' | 'hotel_staff' | 'fire' | 'medical' | 'police';
const MANAGEMENT_ROLE_KEY = 'hackdays_management_role';

const ROLE_META: Record<RoleKey, { title: string; subtitle: string; icon: React.ReactElement; badgeClass: string }> = {
  hotel: {
    title: 'Hotel Login',
    subtitle: 'For hotel front desk and management operations.',
    icon: <Building2 size={18} className="text-blue-300" />,
    badgeClass: 'bg-blue-900/35 border-blue-600/40 text-blue-200',
  },
  hotel_staff: {
    title: 'Hotel Staff Login',
    subtitle: 'For on-floor hotel response staff handling dispatched incidents.',
    icon: <Building2 size={18} className="text-indigo-300" />,
    badgeClass: 'bg-indigo-900/35 border-indigo-600/40 text-indigo-200',
  },
  fire: {
    title: 'Fire Unit Login',
    subtitle: 'For fire response, rescue, and evacuation command.',
    icon: <Flame size={18} className="text-orange-300" />,
    badgeClass: 'bg-orange-900/35 border-orange-600/40 text-orange-200',
  },
  medical: {
    title: 'Medical Unit Login',
    subtitle: 'For emergency medical response and triage support.',
    icon: <HeartPulse size={18} className="text-emerald-300" />,
    badgeClass: 'bg-emerald-900/35 border-emerald-600/40 text-emerald-200',
  },
  police: {
    title: 'Police Unit Login',
    subtitle: 'For security response and law enforcement coordination.',
    icon: <ShieldCheck size={18} className="text-cyan-300" />,
    badgeClass: 'bg-cyan-900/35 border-cyan-600/40 text-cyan-200',
  },
};

export function StaffRoleLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useParams<{ role: string }>();
  const { login, enabled, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const roleKey = useMemo(() => {
    if (role === 'hotel' || role === 'hotel_staff' || role === 'fire' || role === 'medical' || role === 'police') {
      return role;
    }
    return null;
  }, [role]);

  const roleMeta = roleKey ? ROLE_META[roleKey] : null;
  const from = (location.state as { from?: string } | undefined)?.from ?? '/staff';
  const activeRole = window.sessionStorage.getItem(MANAGEMENT_ROLE_KEY);

  if (enabled && user && activeRole) {
    return <Navigate to="/staff" replace />;
  }

  if (!roleMeta) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card max-w-md w-full p-6 text-center">
          <h1 className="text-xl font-bold text-crisis-text">Invalid Login Channel</h1>
          <p className="text-crisis-text-dim mt-2">Please choose one of the available management login options.</p>
          <button className="btn-primary mt-4" onClick={() => navigate('/staff-login')}>Back to Options</button>
        </div>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleKey) return;
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      window.sessionStorage.setItem(MANAGEMENT_ROLE_KEY, roleKey);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card max-w-md w-full p-6 text-center">
          <ShieldCheck className="mx-auto text-crisis-primary mb-3" />
          <h1 className="text-xl font-bold text-crisis-text">Staff Auth Disabled</h1>
          <p className="text-crisis-text-dim mt-2">Set Firebase web config env vars to enable real staff login.</p>
          <button className="btn-primary mt-4" onClick={() => navigate('/staff')}>Continue</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="card max-w-md w-full p-6 space-y-4 animate-fade-in">
        <button type="button" onClick={() => navigate('/staff-login')} className="btn-ghost inline-flex items-center gap-1 text-sm -ml-2 w-fit">
          <ArrowLeft size={16} /> All Channels
        </button>

        <div className="text-center">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium mb-3 ${roleMeta.badgeClass}`}>
            {roleMeta.icon}
            {roleMeta.title}
          </div>
          <h1 className="text-2xl font-bold text-crisis-text">Sign In</h1>
          <p className="text-crisis-text-dim text-sm mt-1">{roleMeta.subtitle}</p>
        </div>

        <div>
          <label className="form-label">Email</label>
          <input
            className="form-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@organization.com"
            required
          />
        </div>

        <div>
          <label className="form-label">Password</label>
          <input
            className="form-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <div className="text-red-400 text-sm">{error}</div>}

        <button className="btn-primary w-full flex items-center justify-center gap-2" type="submit" disabled={loading}>
          <LogIn size={16} /> {loading ? 'Signing in...' : `Sign in to ${roleMeta.title}`}
        </button>
      </form>
    </div>
  );
}

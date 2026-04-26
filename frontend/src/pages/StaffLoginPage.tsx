import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, Flame, HeartPulse, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const MANAGEMENT_ROLE_KEY = 'hackdays_management_role';

export function StaffLoginPage() {
  const navigate = useNavigate();
  const { user, loading, enabled } = useAuth();
  const role = window.sessionStorage.getItem(MANAGEMENT_ROLE_KEY);

  if (enabled && loading) {
    return <div className="min-h-screen flex items-center justify-center text-crisis-text">Checking staff access...</div>;
  }

  if (enabled && user && role) {
    return <Navigate to="/staff" replace />;
  }

  const loginRoles = [
    {
      key: 'hotel',
      title: 'Hotel',
      subtitle: 'Front desk and hotel operations',
      icon: <Building2 size={22} className="text-blue-300" />,
      iconShell: 'bg-blue-900/35 border-blue-600/40',
    },
    {
      key: 'hotel_staff',
      title: 'Hotel Staff',
      subtitle: 'In-house response team and floor operations',
      icon: <Users size={22} className="text-indigo-300" />,
      iconShell: 'bg-indigo-900/35 border-indigo-600/40',
    },
    {
      key: 'fire',
      title: 'Fire',
      subtitle: 'Fire response and evacuation command',
      icon: <Flame size={22} className="text-orange-300" />,
      iconShell: 'bg-orange-900/35 border-orange-600/40',
    },
    {
      key: 'medical',
      title: 'Medical',
      subtitle: 'Emergency medical response team',
      icon: <HeartPulse size={22} className="text-emerald-300" />,
      iconShell: 'bg-emerald-900/35 border-emerald-600/40',
    },
    {
      key: 'police',
      title: 'Police',
      subtitle: 'Security and law enforcement desk',
      icon: <ShieldCheck size={22} className="text-cyan-300" />,
      iconShell: 'bg-cyan-900/35 border-cyan-600/40',
    },
  ] as const;

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="card p-7 sm:p-8 lg:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-crisis-primary/15 border border-crisis-primary/30 text-crisis-primary text-xs font-medium mb-4">
              <ShieldCheck size={14} /> Management Access
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-crisis-text mb-2">Choose Login Channel</h1>
            <p className="text-crisis-text-dim text-sm sm:text-base max-w-2xl mx-auto">
              Select your response unit to continue to the appropriate login page.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loginRoles.map((role) => (
              <button
                key={role.key}
                onClick={() => navigate(`/staff-login/${role.key}`)}
                className="card hover:border-crisis-primary/40 transition-all duration-200 p-5 text-left group active:scale-[0.99]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${role.iconShell}`}>
                      {role.icon}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-crisis-text">{role.title}</p>
                      <p className="text-xs text-crisis-text-dim">{role.subtitle}</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-crisis-muted group-hover:text-crisis-primary transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

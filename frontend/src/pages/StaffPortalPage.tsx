import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, ArrowRight, Sparkles } from 'lucide-react';
import type { ConnectivityMode } from '../types/incident';

interface Props {
  connectivity?: ConnectivityMode;
}

type ManagementRole = 'hotel' | 'hotel_staff' | 'fire' | 'medical' | 'police';
const MANAGEMENT_ROLE_KEY = 'hackdays_management_role';

const ROLE_CONTENT: Record<ManagementRole, {
  roleLabel: string;
  dashboardTitle: string;
}> = {
  hotel: {
    roleLabel: 'Hotel',
    dashboardTitle: 'Hotel Incident Dashboard',
  },
  hotel_staff: {
    roleLabel: 'Hotel Staff',
    dashboardTitle: 'Hotel Staff Response Dashboard',
  },
  fire: {
    roleLabel: 'Fire',
    dashboardTitle: 'Fire Incident Dashboard',
  },
  medical: {
    roleLabel: 'Medical',
    dashboardTitle: 'Medical Incident Dashboard',
  },
  police: {
    roleLabel: 'Police',
    dashboardTitle: 'Police Incident Dashboard',
  },
};

function parseManagementRole(raw: string | null): ManagementRole {
  if (raw === 'fire' || raw === 'medical' || raw === 'police' || raw === 'hotel_staff') return raw;
  return 'hotel';
}

export function StaffPortalPage({ connectivity: _connectivity }: Props) {
  const navigate = useNavigate();
  const currentRole = useMemo(
    () => parseManagementRole(window.sessionStorage.getItem(MANAGEMENT_ROLE_KEY)),
    []
  );
  const roleContent = ROLE_CONTENT[currentRole];

  return (
    <div className="min-h-screen px-4 py-8 sm:py-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-2">
          <h1 className="text-3xl sm:text-4xl font-black text-crisis-text">{roleContent.roleLabel} Command Center</h1>
          <p className="text-crisis-text-dim text-base sm:text-lg mt-2">
            {currentRole === 'hotel'
              ? 'Choose where you want to continue: incident operations or AI-assisted decisions.'
              : 'Review and process incidents dispatched by hotel operations.'}
          </p>
        </div>

        <div className={currentRole === 'hotel'
          ? 'grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 min-h-[calc(100vh-270px)]'
          : 'grid grid-cols-1 gap-6 lg:gap-8 min-h-[calc(100vh-270px)]'}>
          {/* Dashboard Button */}
          <button
            onClick={() => navigate('/dashboard')}
            className="card p-8 sm:p-10 lg:p-12 relative overflow-hidden hover:border-emerald-400/50 transition-all group text-left min-h-[320px] lg:min-h-full"
          >
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -bottom-20 -left-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl" />
            </div>
            <div className="relative h-full flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/30 border border-emerald-700/40 text-emerald-300 text-sm mb-5">
                  <LayoutDashboard size={14} /> Dashboard
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-crisis-text mb-4">{roleContent.dashboardTitle}</h2>
                <p className="text-crisis-text-dim text-lg sm:text-xl mb-8">
                  View, monitor, and respond to all active incidents in real time with full timeline tracking.
                </p>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 group-hover:translate-x-1 transition-transform text-lg">
                <span className="font-semibold">Open Dashboard</span>
                <ArrowRight size={22} />
              </div>
            </div>
          </button>

          {/* AI Agent Button */}
          {currentRole === 'hotel' && (
            <button
              onClick={() => navigate('/agent')}
              className="card p-8 sm:p-10 lg:p-12 relative overflow-hidden hover:border-crisis-primary/50 transition-all group text-left min-h-[320px] lg:min-h-full"
            >
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-20 -right-16 w-64 h-64 rounded-full bg-crisis-primary/10 blur-3xl" />
              </div>
              <div className="relative h-full flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crisis-primary/20 border border-crisis-primary/40 text-crisis-primary text-sm mb-5">
                    <Sparkles size={14} /> AI Agent Console
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black text-crisis-text mb-4">AI Decision Engine</h2>
                  <p className="text-crisis-text-dim text-lg sm:text-xl mb-8">
                    Watch the AI analyze incidents, suggest actions, and learn decision patterns in real time.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-crisis-primary group-hover:translate-x-1 transition-transform text-lg">
                  <span className="font-semibold">Open Agent Console</span>
                  <Sparkles size={22} />
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

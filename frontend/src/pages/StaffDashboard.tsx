import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard, RefreshCw, AlertTriangle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import type { IncidentStatus } from '../types/incident';
import { fetchIncidents, registerNotificationToken } from '../api/client';
import { IncidentCard } from '../components/IncidentCard';
import { useRealtimeIncidents } from '../hooks/useRealtimeIncidents';
import { getFirebaseMessagingIfSupported } from '../firebase/client';
import { getToken } from 'firebase/messaging';
import { useAuth } from '../auth/AuthContext';

const HOTEL_STATUS_FILTERS: { label: string; value: IncidentStatus }[] = [
  { label: 'Open', value: 'open' },
  { label: 'Assigned', value: 'assigned' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
];

const SECTOR_STATUS_FILTERS: { label: string; value: IncidentStatus }[] = [
  { label: 'Assigned', value: 'assigned' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
];

type ManagementRole = 'hotel' | 'hotel_staff' | 'fire' | 'medical' | 'police';
const MANAGEMENT_ROLE_KEY = 'hackdays_management_role';

function parseRole(raw: string | null): ManagementRole {
  if (raw === 'fire' || raw === 'medical' || raw === 'police' || raw === 'hotel_staff') return raw;
  return 'hotel';
}

export function StaffDashboard() {
  const navigate = useNavigate();
  const { incidents, loading, error } = useRealtimeIncidents();
  const { user } = useAuth();
  const [filter, setFilter] = useState<IncidentStatus>('open');
  const [refreshing, setRefreshing] = useState(false);
  const role = useMemo(() => parseRole(window.sessionStorage.getItem(MANAGEMENT_ROLE_KEY)), []);
  const statusFilters = role === 'hotel' ? HOTEL_STATUS_FILTERS : SECTOR_STATUS_FILTERS;

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchIncidents();
    setTimeout(() => setRefreshing(false), 400);
  };

  const incidentsForRole = useMemo(() => {
    if (role === 'hotel') return incidents;
    return incidents.filter((incident) => {
      const dispatched = incident.dispatchedSectors ?? [];
      return incident.verifiedByHotel && dispatched.includes(role);
    });
  }, [incidents, role]);

  const filtered = incidentsForRole.filter((i) => i.status === filter);

  useEffect(() => {
    if (role === 'hotel') {
      setFilter('open');
      return;
    }
    setFilter('assigned');
  }, [role]);

  useEffect(() => {
    const registerToken = async () => {
      if (!user) return;
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      if (!vapidKey) return;

      try {
        const messaging = await getFirebaseMessagingIfSupported();
        if (!messaging) return;
        const token = await getToken(messaging, { vapidKey });
        if (token) {
          await registerNotificationToken(token);
        }
      } catch {
        // Non-blocking: notifications are optional for local development.
      }
    };

    void registerToken();
  }, [user]);

  // Stats
  const total = incidentsForRole.length;
  const open = incidentsForRole.filter((i) => i.status === 'open').length;
  const inProgress = incidentsForRole.filter((i) => i.status === 'in_progress').length;
  const resolved = incidentsForRole.filter((i) => ['resolved', 'closed'].includes(i.status)).length;
  const roleTitle = role === 'hotel'
    ? 'Hotel Incident Dashboard'
    : `${role.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())} Response Dashboard`;
  const roleSubtitle = role === 'hotel'
    ? 'Verify incidents, dispatch sectors, and close after full resolution'
    : `Showing only incidents dispatched to ${role.replace('_', ' ')} by hotel`; 

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => navigate('/management')}
              className="btn-ghost inline-flex items-center gap-2 text-xs"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-crisis-primary/20 flex items-center justify-center">
                <LayoutDashboard size={20} className="text-crisis-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-crisis-text">{roleTitle}</h1>
                <p className="text-crisis-text-dim text-sm">{roleSubtitle}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              id="dashboard-refresh-btn"
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-ghost p-2 rounded-lg"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin text-crisis-primary' : ''} />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', value: total, icon: <Clock size={16} />, color: 'text-crisis-text' },
            { label: 'Open', value: open, icon: <AlertTriangle size={16} />, color: 'text-red-400' },
            { label: 'In Progress', value: inProgress, icon: <Loader2 size={16} />, color: 'text-amber-400' },
            { label: 'Resolved', value: resolved, icon: <CheckCircle size={16} />, color: 'text-emerald-400' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="card p-4 text-center">
              <div className={`flex items-center justify-center gap-1.5 ${color} mb-1`}>
                {icon}
                <span className="text-xs font-medium">{label}</span>
              </div>
              <p className={`text-3xl font-black ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
          {statusFilters.map(({ label, value }) => (
            <button
              key={value}
              id={`filter-${value}`}
              onClick={() => setFilter(value)}
              className={`shrink-0 px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
                ${filter === value
                  ? 'bg-crisis-primary/20 text-crisis-primary border border-crisis-primary/40'
                  : 'text-crisis-text-dim hover:text-crisis-text hover:bg-white/5 border border-transparent'
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-crisis-primary" />
          </div>
        )}

        {error && !loading && (
          <div className="card p-6 text-center border-red-700/40 bg-red-900/10">
            <AlertTriangle size={32} className="text-red-400 mx-auto mb-3" />
            <p className="text-crisis-text font-semibold mb-1">Backend Unreachable</p>
            <p className="text-crisis-text-dim text-sm">{error}</p>
            <button onClick={handleRefresh} className="btn-secondary mt-4 text-sm py-2 px-4">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="card p-10 text-center">
            <CheckCircle size={40} className="text-emerald-400 mx-auto mb-3" />
            <p className="text-crisis-text font-semibold">No incidents</p>
            <p className="text-crisis-text-dim text-sm mt-1">
              {`No ${filter.replace('_', ' ')} incidents.`}
            </p>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-3">
            {filtered.map((incident) => (
              <IncidentCard key={incident.id} incident={incident} showAISummary={role === 'hotel'} />
            ))}
          </div>
        )}

        <p className="text-crisis-muted text-xs text-center mt-6">
          Realtime mode enabled when Firebase is configured
        </p>
      </div>
    </div>
  );
}

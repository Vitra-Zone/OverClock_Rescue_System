import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, User, ChevronRight } from 'lucide-react';
import type { Incident } from '../types/incident';

interface Props {
  incident: Incident;
  showAISummary?: boolean;
}

const SEVERITY_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  high:     'bg-orange-500',
  medium:   'bg-yellow-500',
  low:      'bg-green-500',
};

const TYPE_ICON: Record<string, string> = {
  medical:    '🏥',
  fire:       '🔥',
  security:   '🛡️',
  earthquake: '🌍',
  flood:      '💧',
  general:    'ℹ️',
  unknown:    '❓',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function IncidentCard({ incident, showAISummary = true }: Props) {
  const navigate = useNavigate();
  const dispatched = incident.dispatchedSectors ?? [];
  const accepted = incident.acceptedSectors ?? [];
  const resolved = incident.resolvedSectors ?? [];

  return (
    <button
      id={`incident-card-${incident.id}`}
      onClick={() => navigate(`/dashboard/${incident.id}`)}
      className="card w-full text-left p-4 hover:border-crisis-primary/50 transition-all duration-200 
                 hover:shadow-crisis active:scale-[0.99] group"
    >
      <div className="flex items-start gap-4">
        {/* Icon + severity dot */}
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-xl bg-crisis-bg flex items-center justify-center text-2xl">
            {TYPE_ICON[incident.incidentType] ?? '❓'}
          </div>
          <span
            className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-crisis-card 
                        ${SEVERITY_DOT[incident.severity] ?? 'bg-slate-500'}
                        ${incident.status === 'open' ? 'animate-pulse' : ''}`}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-semibold text-crisis-text truncate">
              {incident.guestName}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`chip-${incident.status}`}>{incident.status.replace('_', ' ')}</span>
              <ChevronRight size={14} className="text-crisis-muted group-hover:text-crisis-primary transition-colors" />
            </div>
          </div>

          <p className="text-crisis-text-dim text-sm truncate mb-2">{incident.message}</p>

          {incident.hotelContext?.name && (
            <p className="text-xs text-crisis-text-dim mb-2">
              Hotel: <span className="text-crisis-text">{incident.hotelContext.name}</span>
              {incident.incidentScope === 'outside' ? ' (Outside Incident)' : ''}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-crisis-muted">
            <span className="flex items-center gap-1">
              <MapPin size={11} /> Room {incident.roomNumber}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} /> {timeAgo(incident.createdAt)}
            </span>
            <span className={`chip-${incident.severity}`}>
              {incident.severity}
            </span>
          </div>
        </div>
      </div>

      {dispatched.length > 0 && (
        <div className="mt-3 pt-3 border-t border-crisis-border/50">
          <p className="text-xs text-crisis-text-dim">
            <span className="text-crisis-primary font-medium">Dispatch: </span>
            {dispatched.join(', ')} | Accepted {accepted.length}/{dispatched.length} | Resolved {resolved.length}/{dispatched.length}
          </p>
        </div>
      )}

      {/* AI summary preview */}
      {showAISummary && incident.aiSummary && (
        <div className="mt-3 pt-3 border-t border-crisis-border/50">
          <p className="text-xs text-crisis-text-dim truncate">
            <span className="text-crisis-primary font-medium">AI: </span>
            {incident.aiSummary}
          </p>
        </div>
      )}
    </button>
  );
}

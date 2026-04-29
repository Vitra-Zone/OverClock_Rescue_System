import { Clock, Bot, User, AlertTriangle, Settings } from 'lucide-react';
import type { TimelineEntry } from '@overclock/shared/types';

interface Props {
  timeline: TimelineEntry[];
}

const ACTOR_CONFIG = {
  guest:  { icon: <User size={12} />, color: 'text-blue-400', bg: 'bg-blue-900/40', label: 'Guest' },
  ai:     { icon: <Bot size={12} />, color: 'text-orange-400', bg: 'bg-orange-900/40', label: 'AI Agent' },
  staff:  { icon: <AlertTriangle size={12} />, color: 'text-emerald-400', bg: 'bg-emerald-900/40', label: 'Hotel Staff' },
  hotel_staff: { icon: <AlertTriangle size={12} />, color: 'text-emerald-400', bg: 'bg-emerald-900/40', label: 'Hotel Staff' },
  fire_staff: { icon: <AlertTriangle size={12} />, color: 'text-orange-400', bg: 'bg-orange-900/40', label: 'Fire Staff' },
  medical_staff: { icon: <AlertTriangle size={12} />, color: 'text-blue-300', bg: 'bg-blue-900/40', label: 'Medical Staff' },
  police_staff: { icon: <AlertTriangle size={12} />, color: 'text-cyan-300', bg: 'bg-cyan-900/40', label: 'Police Staff' },
  system: { icon: <Settings size={12} />, color: 'text-slate-400', bg: 'bg-slate-800/60', label: 'System' },
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function TimelinePanel({ timeline }: Props) {
  return (
    <div className="space-y-3">
      {timeline.map((entry, i) => {
        const cfg = ACTOR_CONFIG[entry.actor] ?? ACTOR_CONFIG.system;
        return (
          <div key={i} className="flex gap-3 animate-fade-in">
            <div className={`shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center ${cfg.bg}`}>
              <span className={cfg.color}>{cfg.icon}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                <span className="flex items-center gap-0.5 text-slate-500 text-xs">
                  <Clock size={10} /> {formatTime(entry.timestamp)}
                </span>
              </div>
              <p className="text-slate-200 text-sm leading-snug">{entry.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

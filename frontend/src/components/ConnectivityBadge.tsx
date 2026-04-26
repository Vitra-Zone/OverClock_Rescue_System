import React from 'react';
import { Wifi, WifiOff, MessageSquare, Phone, Video } from 'lucide-react';
import type { ConnectivityMode } from '../types/incident';

interface Props {
  mode: ConnectivityMode;
  onModeChange?: (mode: ConnectivityMode) => void;
  showToggle?: boolean;
}

const CONFIG: Record<ConnectivityMode, { label: string; icon: React.ReactNode; chip: string; dot: string }> = {
  online: {
    label: 'Online',
    icon: <Wifi size={13} />,
    chip: 'chip-online',
    dot: 'bg-emerald-400',
  },
  offline: {
    label: 'Offline',
    icon: <WifiOff size={13} />,
    chip: 'chip-offline',
    dot: 'bg-slate-400',
  },
  sms_fallback: {
    label: 'SMS Fallback',
    icon: <MessageSquare size={13} />,
    chip: 'chip-sms',
    dot: 'bg-amber-400',
  },
  voice_fallback: {
    label: 'Voice Fallback',
    icon: <Phone size={13} />,
    chip: 'chip-voice',
    dot: 'bg-purple-400',
  },
};

const MODES: ConnectivityMode[] = ['online', 'offline', 'sms_fallback', 'voice_fallback'];

export function ConnectivityBadge({ mode, onModeChange, showToggle = false }: Props) {
  const cfg = CONFIG[mode];
  const isSimpleToggle = !showToggle && Boolean(onModeChange);
  const handleSimpleToggle = () => {
    if (!onModeChange) return;
    onModeChange(mode === 'online' ? 'offline' : 'online');
  };

  return (
    <div className="flex items-center gap-2">
      {isSimpleToggle ? (
        <button
          type="button"
          onClick={handleSimpleToggle}
          className={`${cfg.chip} cursor-pointer hover:opacity-90 transition-opacity`}
          title={`Switch to ${mode === 'online' ? 'Offline' : 'Online'}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
          {cfg.icon}
          {cfg.label}
        </button>
      ) : (
        <span className={cfg.chip}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
          {cfg.icon}
          {cfg.label}
        </span>
      )}
      {showToggle && onModeChange && (
        <div className="flex gap-1">
          {MODES.map((m) => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              title={`Simulate ${CONFIG[m].label}`}
              className={`px-2 py-0.5 rounded text-xs transition-all ${
                m === mode
                  ? 'bg-white/15 text-white'
                  : 'text-crisis-text-dim hover:bg-white/8 hover:text-white'
              }`}
            >
              {CONFIG[m].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

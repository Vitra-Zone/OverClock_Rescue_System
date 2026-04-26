import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wifi, WifiOff, MessageSquare, Phone, Video, ChevronRight } from 'lucide-react';
import type { ConnectivityMode } from '../types/incident';
import { ConnectivityBadge } from '../components/ConnectivityBadge';
import { FallbackFlow } from '../components/FallbackFlow';

interface Props {
  connectivity: ConnectivityMode;
  onModeChange: (m: ConnectivityMode) => void;
}

const FALLBACK_INCIDENT_ID = 'pending-selection';

const MODE_INFO: Record<ConnectivityMode, { title: string; desc: string; icon: React.ReactNode; color: string }> = {
  online: {
    title: 'You\'re Online',
    desc: 'Full connectivity. Live video and real-time help are available.',
    icon: <Wifi size={32} className="text-emerald-400" />,
    color: 'from-emerald-900/40 to-teal-900/20 border-emerald-700/30',
  },
  offline: {
    title: 'No Internet Connection',
    desc: 'You\'re offline. Download the offline guides and use SMS or voice to alert staff.',
    icon: <WifiOff size={32} className="text-slate-400" />,
    color: 'from-slate-800/60 to-slate-900/40 border-slate-600/30',
  },
  sms_fallback: {
    title: 'SMS Fallback Active',
    desc: 'Data is limited. SMS alerts will be used to notify hotel staff.',
    icon: <MessageSquare size={32} className="text-amber-400" />,
    color: 'from-amber-900/40 to-yellow-900/20 border-amber-700/30',
  },
  voice_fallback: {
    title: 'Voice Fallback Active',
    desc: 'SMS unavailable. Automated voice call will be placed to hotel emergency line.',
    icon: <Phone size={32} className="text-purple-400" />,
    color: 'from-purple-900/40 to-indigo-900/20 border-purple-700/30',
  },
};

export function FallbackStatusScreen({ connectivity, onModeChange }: Props) {
  const navigate = useNavigate();

  const info = MODE_INFO[connectivity];

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-1 text-sm mb-6 -ml-2">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-black text-crisis-text mb-2">Fallback Status</h1>
          <p className="text-crisis-text-dim text-sm">
            Hackdays always has a backup. Simulate fallback modes below.
          </p>
        </div>

        {/* Current mode card */}
        <div className={`card p-6 bg-gradient-to-br ${info.color} mb-6 animate-fade-in`}>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-black/20 flex items-center justify-center shrink-0">
              {info.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-crisis-text mb-1">{info.title}</h2>
              <p className="text-crisis-text-dim text-sm">{info.desc}</p>
            </div>
          </div>
        </div>

        {/* Mode selector */}
        <div className="card p-5 mb-6">
          <p className="text-sm font-semibold text-crisis-text mb-3">
            Simulate Connectivity Mode
          </p>
          <ConnectivityBadge mode={connectivity} onModeChange={onModeChange} showToggle={true} />
        </div>

        {/* Connectivity flow visualization */}
        <div className="card p-5 mb-6">
          <p className="text-sm font-semibold text-crisis-text mb-4">Fallback Escalation Order</p>
          <div className="flex flex-col gap-2">
            {[
              { mode: 'online', label: 'Online — Live Video & Real-time Help', icon: <Video size={14} />, active: connectivity === 'online' },
              { mode: 'sms_fallback', label: 'Limited Data — SMS Alerts', icon: <MessageSquare size={14} />, active: connectivity === 'sms_fallback' },
              { mode: 'voice_fallback', label: 'Voice Only — Automated Call', icon: <Phone size={14} />, active: connectivity === 'voice_fallback' },
              { mode: 'offline', label: 'Offline — Local Guides Only', icon: <WifiOff size={14} />, active: connectivity === 'offline' },
            ].map(({ mode, label, icon, active }, i) => (
              <div key={mode} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
                ${active ? 'bg-crisis-primary/10 border-crisis-primary/40 text-crisis-primary' 
                         : 'border-crisis-border/50 text-crisis-text-dim'}`}>
                {i > 0 && <div className="absolute -mt-8 ml-2 w-px h-5 bg-crisis-border" />}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${active ? 'bg-crisis-primary/20' : 'bg-crisis-bg'}`}>
                  {icon}
                </div>
                <span className="text-sm font-medium">{label}</span>
                {active && <span className="ml-auto text-xs font-semibold">← Current</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Fallback trigger panel */}
        <div className="card p-5 mb-6">
          <p className="text-sm font-semibold text-crisis-text mb-1">Simulate Fallback Actions</p>
          <p className="text-crisis-text-dim text-xs mb-4">Actions below attach to the current incident context when one is selected.</p>
          <FallbackFlow incidentId={FALLBACK_INCIDENT_ID} connectivity={connectivity} />
        </div>

        {/* Offline guides link */}
        {(connectivity === 'offline' || connectivity === 'voice_fallback') && (
          <button
            onClick={() => navigate('/offline')}
            className="card w-full p-4 flex items-center gap-3 hover:border-crisis-primary/40 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-crisis-bg flex items-center justify-center text-xl">📖</div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-crisis-text">View Offline Guides</p>
              <p className="text-crisis-text-dim text-xs">Available without internet</p>
            </div>
            <ChevronRight size={16} className="text-crisis-muted group-hover:text-crisis-primary transition-colors" />
          </button>
        )}
      </div>
    </div>
  );
}

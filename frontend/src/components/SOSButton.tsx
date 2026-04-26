import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function SOSButton({ onPress, loading = false, disabled = false }: Props) {
  return (
    <div className="flex flex-col items-center gap-6">
      {/* Outer ring animations */}
      <div className="relative flex items-center justify-center">
        <span className="absolute w-48 h-48 rounded-full border-2 border-red-500/20 animate-ping" style={{ animationDuration: '2s' }} />
        <span className="absolute w-40 h-40 rounded-full border-2 border-red-500/30 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />

        <button
          id="sos-trigger-btn"
          onClick={onPress}
          disabled={disabled || loading}
          className={`relative w-36 h-36 rounded-full flex flex-col items-center justify-center gap-1
            font-black text-white transition-all duration-200 active:scale-90 select-none
            sos-glow border-4 border-red-600/60
            ${disabled || loading
              ? 'bg-gray-700 cursor-not-allowed border-gray-600 shadow-none'
              : 'bg-gradient-to-br from-red-600 to-rose-700 cursor-pointer hover:scale-105'
            }`}
          aria-label="SOS Emergency Button"
        >
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="text-xs font-semibold tracking-wider">Sending...</span>
            </div>
          ) : (
            <>
              <AlertTriangle size={36} strokeWidth={3} className="drop-shadow-lg" />
              <span className="text-3xl font-black tracking-widest leading-none">SOS</span>
              <span className="text-xs font-medium tracking-wider opacity-80">HELP</span>
            </>
          )}
        </button>
      </div>

      <p className="text-crisis-text-dim text-sm text-center max-w-xs">
        Tap the button to immediately alert hotel emergency staff
      </p>
    </div>
  );
}

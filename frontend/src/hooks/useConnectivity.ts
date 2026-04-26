import { useState, useEffect, useCallback } from 'react';
import { ConnectivityMode } from '../types/incident';

export function useConnectivity() {
  const [mode, setMode] = useState<ConnectivityMode>('online');

  const detect = useCallback(() => {
    const navOnline = navigator.onLine;
    if (!navOnline) {
      setMode('offline');
    } else {
      setMode('online');
    }
  }, []);

  useEffect(() => {
    detect();
    window.addEventListener('online', detect);
    window.addEventListener('offline', detect);
    return () => {
      window.removeEventListener('online', detect);
      window.removeEventListener('offline', detect);
    };
  }, [detect]);

  // Allow manual override for testing
  const setManualMode = (m: ConnectivityMode) => setMode(m);

  return { mode, backendOnline: navigator.onLine, setManualMode, refresh: detect };
}

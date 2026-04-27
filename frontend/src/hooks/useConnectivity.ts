import { useState, useEffect, useCallback } from 'react';
import { ConnectivityMode } from '../types/incident';

export function useConnectivity() {
  const [mode, setMode] = useState<ConnectivityMode>('online');
  const [networkLabel, setNetworkLabel] = useState('online');

  const detect = useCallback(() => {
    const navOnline = navigator.onLine;
    if (!navOnline) {
      setMode('offline');
      setNetworkLabel('offline');
    } else {
      setMode('online');
      const connection = (navigator as Navigator & { connection?: { type?: string; effectiveType?: string } }).connection;
      const connectionType = connection?.type ?? '';
      const effectiveType = connection?.effectiveType ?? '';
      const isCellular = connectionType === 'cellular' || ['slow-2g', '2g', '3g', '4g'].includes(effectiveType);
      setNetworkLabel(isCellular ? 'mobile data' : 'online');
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

  return { mode, backendOnline: navigator.onLine, setManualMode, refresh: detect, networkLabel };
}

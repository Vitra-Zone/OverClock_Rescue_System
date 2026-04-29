import { useEffect, useState } from 'react';
import type { Incident } from '../types/incident';
import { fetchIncidents } from '../api/client';

export function useRealtimeIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadFromApi = async () => {
      try {
        const list = await fetchIncidents();
        if (!mounted) return;
        setIncidents(list);
        setError(null);
      } catch {
        if (!mounted) return;
        setError('Cannot reach backend. Make sure the backend server is running on port 3001.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadFromApi();
    const interval = setInterval(loadFromApi, 15000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { incidents, loading, error };
}

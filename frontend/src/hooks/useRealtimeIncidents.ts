import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import type { Incident } from '../types/incident';
import { firebaseDb, firebaseEnabled } from '../firebase/client';
import { fetchIncidents } from '../api/client';

export function useRealtimeIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (firebaseEnabled && firebaseDb) {
      const incidentsQuery = query(collection(firebaseDb, 'incidents'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(
        incidentsQuery,
        (snapshot) => {
          const list = snapshot.docs.map((doc) => doc.data() as Incident);
          setIncidents(list);
          setLoading(false);
          setError(null);
        },
        () => {
          setError('Realtime listener failed. Falling back to API.');
          setLoading(false);
        }
      );
      return unsubscribe;
    }

    let mounted = true;

    const load = async () => {
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

    void load();
    const interval = setInterval(load, 15000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { incidents, loading, error };
}

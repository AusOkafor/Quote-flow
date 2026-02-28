import { useState, useEffect } from 'react';
import { dashboardApi } from '@/services/api';
import type { DashboardStats } from '@/types';

export function useDashboard(currency?: string) {
  const [stats, setStats]   = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    dashboardApi.getStats(currency)
      .then((s) => { setStats(s); setError(null); })
      .catch((e) => { setError(e instanceof Error ? e.message : 'Failed to load dashboard'); })
      .finally(() => setLoading(false));
  }, [currency]);

  return { stats, loading, error };
}

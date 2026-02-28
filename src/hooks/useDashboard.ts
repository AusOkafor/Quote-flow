import { useState, useEffect } from 'react';
import { dashboardApi } from '@/services/api';
import type { DashboardStats } from '@/types';

export function useDashboard(currency?: string) {
  const [stats, setStats]   = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dashboardApi.getStats(currency)
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currency]);

  return { stats, loading };
}

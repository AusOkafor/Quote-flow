import { useState, useEffect, useCallback } from 'react';
import { quotesApi } from '@/services/api';
import type { Quote } from '@/types';

export function useQuotes(statusFilter?: string) {
  const [quotes, setQuotes]   = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await quotesApi.list(statusFilter);
      setQuotes(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load quotes');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { void load(); }, [load]);

  const duplicate = async (id: string): Promise<Quote> => {
    const newQ = await quotesApi.duplicate(id);
    setQuotes(prev => [newQ, ...prev]);
    return newQ;
  };

  const remove = async (id: string): Promise<void> => {
    await quotesApi.delete(id);
    setQuotes(prev => prev.filter(q => q.id !== id));
  };

  return { quotes, loading, error, reload: load, duplicate, remove };
}

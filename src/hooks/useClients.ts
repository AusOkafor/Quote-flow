import { useState, useEffect, useCallback } from 'react';
import { clientsApi } from '@/services/api';
import type { Client, CreateClientRequest } from '@/types';

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await clientsApi.list();
      setClients(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const create = async (data: CreateClientRequest): Promise<Client> => {
    const c = await clientsApi.create(data);
    setClients(prev => [c, ...prev]);
    return c;
  };

  const remove = async (id: string): Promise<void> => {
    await clientsApi.delete(id);
    setClients(prev => prev.filter(c => c.id !== id));
  };

  return { clients, loading, error, reload: load, create, delete: remove };
}

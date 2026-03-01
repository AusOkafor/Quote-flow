import { useState, useEffect, useCallback } from 'react';
import { profileApi } from '@/services/api';
import type { Profile } from '@/types';

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await profileApi.get();
      setProfile(data);
    } catch {
      /* profile may not exist yet */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const save = async (data: Partial<Profile>): Promise<Profile> => {
    const updated = await profileApi.update(data);
    setProfile(updated);
    return updated;
  };

  return { profile, loading, save, refresh: load };
}

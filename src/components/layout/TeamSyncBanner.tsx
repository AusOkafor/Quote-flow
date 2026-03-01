import { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useDataRefresh } from '@/contexts/DataRefreshContext';
import { teamsApi } from '@/services/api';
import type { Team } from '@/types';

export default function TeamSyncBanner() {
  const { profile, refresh } = useProfile();
  const { invalidate } = useDataRefresh() ?? {};
  const [invitedTeams, setInvitedTeams] = useState<Team[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    teamsApi.getInvited()
      .then(t => setInvitedTeams(Array.isArray(t) ? t : []))
      .catch(() => setInvitedTeams([]));
  }, []);

  // Show banner when user has invited teams and their current team_id is not one of them
  const currentTeamId = profile?.team_id ?? null;
  const needsSync = invitedTeams.length > 0 && (
    !currentTeamId || !invitedTeams.some(t => t.id === currentTeamId)
  );
  const teamToSync = invitedTeams[0];

  const handleSync = async () => {
    if (!teamToSync || syncing) return;
    setSyncing(true);
    try {
      await teamsApi.syncTeam(teamToSync.id);
      await refresh();
      invalidate?.();
    } catch {
      /* error handled by caller if needed */
    } finally {
      setSyncing(false);
    }
  };

  if (!needsSync || !teamToSync) return null;

  return (
    <div style={{ padding: '28px 32px 0' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '12px 20px',
          background: 'linear-gradient(135deg, var(--brand, #2d5a3d) 0%, #1e3d2a 100%)',
          color: '#fff',
          borderRadius: 10,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
      <span style={{ fontSize: 14 }}>
        You&apos;ve been added to <strong>{teamToSync.name}</strong>. Sync to load team quotes and clients.
      </span>
      <button
        className="btn btn-dark"
        onClick={() => void handleSync()}
        disabled={syncing}
        style={{
          background: 'rgba(255,255,255,.2)',
          border: '1px solid rgba(255,255,255,.4)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {syncing ? (
          <>
            <span
              className="spinner"
              style={{
                width: 16,
                height: 16,
                borderWidth: 2,
                borderColor: 'rgba(255,255,255,.3)',
                borderTopColor: '#fff',
              }}
            />
            Syncing…
          </>
        ) : (
          <>↻ Sync</>
        )}
      </button>
      </div>
    </div>
  );
}

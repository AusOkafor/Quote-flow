import { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { teamsApi } from '@/services/api';
import type { Team, TeamMember } from '@/types';

interface Props {
  onError?: (msg: string) => void;
}

export default function TeamsPanel({ onError }: Props) {
  const { profile } = useProfile();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const isBusiness = profile?.plan === 'business';

  useEffect(() => {
    if (!isBusiness) return;
    setLoading(true);
    teamsApi.getMyTeam()
      .then(t => {
        setTeam(t ?? null);
        if (t) return teamsApi.listMembers(t.id);
        return [];
      })
      .then(m => setMembers(Array.isArray(m) ? m : []))
      .catch(() => onError?.('Failed to load team'))
      .finally(() => setLoading(false));
  }, [isBusiness, onError]);

  const handleAdd = async () => {
    if (!team || !email.trim()) return;
    setAdding(true);
    try {
      const updated = await teamsApi.addMember(team.id, { email: email.trim(), role });
      setMembers(updated);
      setEmail('');
    } catch (e) {
      onError?.(e instanceof Error ? e.message : 'Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!team || !confirm('Remove this member from the team?')) return;
    try {
      await teamsApi.removeMember(team.id, userId);
      setMembers(prev => prev.filter(m => m.user_id !== userId));
    } catch (e) {
      onError?.(e instanceof Error ? e.message : 'Failed to remove member');
    }
  };

  if (!isBusiness) {
    return (
      <>
        <div className="sp-title">Team</div>
        <div className="sp-sub">Invite team members to collaborate on quotes and clients.</div>
        <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Business plan required</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            Team members (up to 5) is a Business plan feature. Upgrade to add collaborators.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="sp-title">Team</div>
      <div className="sp-sub">Invite team members to collaborate on quotes and clients. Max 5 members.</div>

      {team && (
        <>
          <div className="sp-section">
            <div className="sp-section-title">Team: {team.name}</div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ flex: 1, minWidth: 200, padding: 10, borderRadius: 8, border: '1px solid var(--border)', fontSize: 14 }}
              />
              <select
                value={role}
                onChange={e => setRole(e.target.value as 'member' | 'admin')}
                style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', fontSize: 14 }}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button
                className="btn btn-dark"
                onClick={() => void handleAdd()}
                disabled={adding || !email.trim()}
              >
                {adding ? 'Adding…' : 'Add Member'}
              </button>
            </div>
          </div>

          <div className="sp-section">
            <div className="sp-section-title">Members ({members.length}/5)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {members.map(m => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 12,
                    background: 'var(--cream)',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 500 }}>{m.email ?? m.user_id}</span>
                    <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--muted)' }}>{m.role}</span>
                  </div>
                  {m.role !== 'owner' && (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--danger)' }}
                      onClick={() => void handleRemove(m.user_id)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!team && !loading && isBusiness && (
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>No team found. Contact support.</div>
      )}
    </>
  );
}

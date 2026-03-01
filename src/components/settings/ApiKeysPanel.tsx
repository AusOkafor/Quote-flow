import { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { apiKeysApi } from '@/services/api';
import type { APIKey } from '@/types';

interface Props {
  onError?: (msg: string) => void;
}

export default function ApiKeysPanel({ onError }: Props) {
  const { profile } = useProfile();
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isBusiness = profile?.plan === 'business';

  useEffect(() => {
    if (!isBusiness) return;
    setLoading(true);
    apiKeysApi.list()
      .then(k => setKeys(Array.isArray(k) ? k : []))
      .catch(() => onError?.('Failed to load API keys'))
      .finally(() => setLoading(false));
  }, [isBusiness, onError]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    setNewKey(null);
    try {
      const res = await apiKeysApi.create({ name: name.trim() });
      setKeys(prev => [{ id: res.id, user_id: '', name: res.name, created_at: res.created_at }, ...prev]);
      setNewKey(res.key);
      setName('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create API key';
      if ((e as Error & { code?: string }).code === 'business_required') {
        onError?.('API keys require a Business plan.');
      } else {
        onError?.(msg);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this API key? It will stop working immediately.')) return;
    try {
      await apiKeysApi.revoke(id);
      setKeys(prev => prev.filter(k => k.id !== id));
      if (newKey) setNewKey(null);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : 'Failed to revoke key');
    }
  };

  if (!isBusiness) {
    return (
      <>
        <div className="sp-title">API Access</div>
        <div className="sp-sub">Use API keys for programmatic access to quotes and clients.</div>
        <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Business plan required</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            API keys are a Business plan feature. Upgrade to integrate with your tools and workflows.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="sp-title">API Access</div>
      <div className="sp-sub">Create API keys for programmatic access. Keys are shown only once — copy and store securely.</div>

      {newKey && (
        <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--accent)' }}>New key created — copy it now</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <code style={{ flex: 1, minWidth: 200, padding: 10, background: 'var(--paper)', borderRadius: 8, fontSize: 12, wordBreak: 'break-all' }}>
              {newKey}
            </code>
            <button className="btn btn-dark" onClick={() => handleCopy(newKey)}>Copy</button>
          </div>
        </div>
      )}

      <div className="sp-section">
        <div className="sp-section-title">Create key</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Key name (e.g. Production)"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: 10, borderRadius: 8, border: '1px solid var(--border)', fontSize: 14 }}
          />
          <button
            className="btn btn-dark"
            onClick={() => void handleCreate()}
            disabled={creating || !name.trim()}
          >
            {creating ? 'Creating…' : 'Create Key'}
          </button>
        </div>
      </div>

      <div className="sp-section">
        <div className="sp-section-title">Your API keys</div>
        {loading ? (
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Loading…</div>
        ) : keys.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>No API keys yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {keys.map(k => (
              <div
                key={k.id}
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
                  <span style={{ fontWeight: 500 }}>{k.name}</span>
                  <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--muted)' }}>
                    Created {new Date(k.created_at).toLocaleDateString()}
                    {k.last_used_at ? ` · Last used ${new Date(k.last_used_at).toLocaleDateString()}` : ''}
                  </span>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--danger)' }}
                  onClick={() => void handleRevoke(k.id)}
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

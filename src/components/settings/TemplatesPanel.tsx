import { useState, useEffect } from 'react';
import { templatesApi } from '@/services/api';
import type { QuoteTemplate } from '@/types';

interface Props {
  onError?: (msg: string) => void;
}

export default function TemplatesPanel({ onError }: Props) {
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    templatesApi.list()
      .then(setTemplates)
      .catch(() => onError?.('Failed to load templates'))
      .finally(() => setLoading(false));
  }, [onError]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this template? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await templatesApi.delete(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch {
      onError?.('Failed to delete template');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div style={{ padding: 24, color: 'var(--muted)' }}>Loading templates…</div>;
  }

  return (
    <>
      <div className="sp-title">Quote Templates</div>
      <div className="sp-sub">Reusable quote structures. Use "Save as Template" from any quote, or start from a template when creating a new quote.</div>
      {templates.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', background: 'var(--cream)', borderRadius: 12 }}>
          No templates yet. Save a quote as a template from the Quotes page (••• menu → Save as Template).
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          {templates.map(t => (
            <div
              key={t.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
                background: 'var(--cream)',
                borderRadius: 10,
                border: '1px solid var(--border)',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {t.title || 'Untitled'} · {t.line_items?.length ?? 0} items · {t.currency}
                </div>
              </div>
              <button
                className="btn btn-outline btn-sm"
                style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                onClick={() => void handleDelete(t.id)}
                disabled={deletingId === t.id}
              >
                {deletingId === t.id ? '…' : 'Delete'}
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

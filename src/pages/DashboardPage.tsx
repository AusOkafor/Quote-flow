import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar       from '@/components/layout/Topbar';
import MetricCard   from '@/components/dashboard/MetricCard';
import RecentQuotes from '@/components/dashboard/RecentQuotes';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import QuotePreviewModal from '@/components/quotes/QuotePreviewModal';
import { useDashboard }  from '@/hooks/useDashboard';
import { useProfile }    from '@/hooks/useProfile';
import { useQuotes }     from '@/hooks/useQuotes';
import { useAppToast }   from '@/components/layout/ToastProvider';
import { formatCurrency } from '@/lib/utils';
import type { Quote, Currency } from '@/types';

export default function DashboardPage() {
  const navigate = useNavigate();
  const toast    = useAppToast();
  const { profile }      = useProfile();
  const [currency, setCurrency] = useState<string | null>(null);
  const { stats, error: statsError } = useDashboard(currency === 'all' || currency === null ? undefined : currency);
  const { quotes, reload: reloadQuotes, error: quotesError } = useQuotes();
  const [preview, setPreview] = useState<Quote | null>(null);

  // Resolve default tab: when we have stats, set currency if not yet set
  useEffect(() => {
    if (!stats || currency !== null) return;
    const used = stats.currencies_used ?? [];
    if (used.length === 1) {
      setCurrency(used[0]); // Single currency: no tabs, show filtered
    } else if (used.length > 1) {
      const def = profile?.default_currency;
      setCurrency(def && used.includes(def) ? def : 'all');
    } else {
      setCurrency('all');
    }
  }, [stats, profile, currency]);

  const isAll = currency === 'all' || currency === null;
  const displayCurrency = (isAll ? null : currency) as Currency | null;
  const currenciesUsed = stats?.currencies_used ?? [];
  const showTabs = currenciesUsed.length > 1;

  const pct = stats?.quoted_change_percent ?? 0;
  const changeLabel = `${pct >= 0 ? '↑' : '↓'} ${Math.abs(pct)}% vs last month`;

  const totalQuotedValue = isAll
    ? '— (mixed)'
    : formatCurrency(stats?.total_quoted_this_month ?? 0, displayCurrency ?? 'JMD');
  const avgValue = isAll
    ? '—'
    : formatCurrency(stats?.avg_quote_value ?? 0, displayCurrency ?? 'JMD');

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle="Good morning 👋"
        actions={
          <>
            {displayCurrency && <span style={{ fontSize: 13, color: 'var(--muted)' }}>{displayCurrency}</span>}
            <button className="btn btn-dark" onClick={() => navigate('/app/create')}>+ New Quote</button>
          </>
        }
      />
      <div className="page-body">
        {(statsError || quotesError) && (
          <div style={{ padding: 16, marginBottom: 16, background: 'rgba(232,64,64,.08)', border: '1px solid var(--danger)', borderRadius: 10, color: 'var(--danger)' }}>
            ⚠️ {statsError ?? quotesError} — Check browser console (F12). Ensure Vercel has <code>VITE_API_BASE_URL</code> and Render has <code>ALLOWED_ORIGINS</code>.
          </div>
        )}
        {showTabs && (
          <div className="tab-bar" style={{ marginBottom: 20 }}>
            <button
              className={`tab${isAll ? ' active' : ''}`}
              onClick={() => setCurrency('all')}
            >
              All
            </button>
            {currenciesUsed.map(c => (
              <button
                key={c}
                className={`tab${currency === c ? ' active' : ''}`}
                onClick={() => setCurrency(c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}
        <div className="metrics-grid">
          <MetricCard
            icon="💰"
            color="orange"
            label={displayCurrency ? `Total Quoted (${displayCurrency})` : 'Total Quoted'}
            value={totalQuotedValue}
            change={!isAll ? changeLabel : undefined}
            changeUp={pct >= 0}
          />
          <MetricCard
            icon="✅"
            color="green"
            label="Quotes Accepted"
            value={`${stats?.quotes_accepted_this_month ?? 0} this month`}
            changeUp
          />
          <MetricCard
            icon="📊"
            color="blue"
            label="Acceptance Rate"
            value={`${stats?.acceptance_rate ?? 0}%`}
          />
          <MetricCard
            icon="📈"
            color="gold"
            label={displayCurrency ? `Avg Value (${displayCurrency})` : 'Avg Value'}
            value={avgValue}
          />
        </div>
        <div className="dash-grid">
          <RecentQuotes quotes={quotes} onPreview={id => setPreview(quotes.find(q => q.id === id) ?? null)} />
          <ActivityFeed items={stats?.recent_activity ?? []} />
        </div>
      </div>
      <QuotePreviewModal
        quote={preview}
        open={!!preview}
        onClose={() => setPreview(null)}
        onNotesRead={() => {
          void reloadQuotes();
          if (preview?.id) {
            try {
              const raw = sessionStorage.getItem('qf_notified_quote_ids');
              const arr = raw ? (JSON.parse(raw) as string[]) : [];
              sessionStorage.setItem('qf_notified_quote_ids', JSON.stringify(arr.filter(id => id !== preview.id)));
            } catch { /* ignore */ }
          }
        }}
        toast={toast}
        profile={profile ?? undefined}
      />
    </>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar          from '@/components/layout/Topbar';
import MetricCard      from '@/components/dashboard/MetricCard';
import RecentQuotes    from '@/components/dashboard/RecentQuotes';
import ActivityFeed    from '@/components/dashboard/ActivityFeed';
import QuotePreviewModal from '@/components/quotes/QuotePreviewModal';
import { useDashboard }  from '@/hooks/useDashboard';
import { useProfile }    from '@/hooks/useProfile';
import { useQuotes }     from '@/hooks/useQuotes';
import { useAppToast }   from '@/components/layout/ToastProvider';
import { formatCurrency, formatCompactCurrency } from '@/lib/utils';
import type { Quote, Currency } from '@/types';

// ── Inline SVG icons (Lucide-style) ─────────────────────────────────────────
function IconDollarSign() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
function IconCheckCircle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
function IconTrendingUp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
function IconBarChart2() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6"  y1="20" x2="6"  y2="14" />
    </svg>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const toast    = useAppToast();
  const { profile }      = useProfile();
  const [currency, setCurrency] = useState<string | null>(null);
  const { stats, error: statsError } = useDashboard(currency === 'all' || currency === null ? undefined : currency);
  const { quotes, reload: reloadQuotes, error: quotesError } = useQuotes();
  const [preview, setPreview] = useState<Quote | null>(null);

  // Resolve default currency tab when stats load
  useEffect(() => {
    if (!stats || currency !== null) return;
    const used = stats.currencies_used ?? [];
    if (used.length === 1) {
      setCurrency(used[0]);
    } else if (used.length > 1) {
      const def = profile?.default_currency;
      setCurrency(def && used.includes(def) ? def : 'all');
    } else {
      setCurrency('all');
    }
  }, [stats, profile, currency]);

  const isAll            = currency === 'all' || currency === null;
  const displayCurrency  = (isAll ? null : currency) as Currency | null;
  const currenciesUsed   = stats?.currencies_used ?? [];
  const showTabs         = currenciesUsed.length > 1;

  const pct         = stats?.quoted_change_percent ?? 0;
  const changeLabel = `${pct >= 0 ? '↑' : '↓'} ${Math.abs(pct)}% vs last month`;

  const totalRaw = stats?.total_quoted_this_month ?? 0;
  const avgRaw   = stats?.avg_quote_value ?? 0;
  const cur      = displayCurrency ?? 'JMD';

  const totalQuotedCompact = isAll ? '— mixed' : formatCompactCurrency(totalRaw, cur);
  const totalQuotedFull    = isAll ? undefined   : formatCurrency(totalRaw, cur);
  const avgCompact         = isAll ? '—'         : formatCompactCurrency(avgRaw, cur);
  const avgFull            = isAll ? undefined    : formatCurrency(avgRaw, cur);

  // Pending quotes = sent + expiring (awaiting response)
  const pendingCount   = (stats?.sent_count ?? 0);
  const expiringCount  = quotes.filter(q => {
    if (q.status !== 'sent' && q.status !== 'accepted') return false;
    if (!q.expires_at) return false;
    const daysLeft = Math.ceil((new Date(q.expires_at).getTime() - Date.now()) / 86_400_000);
    return daysLeft >= 0 && daysLeft <= 7;
  }).length;

  const firstName = profile?.business_name?.split(' ')[0] ?? profile?.business_name ?? '';

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle={`${getGreeting()}${firstName ? `, ${firstName}` : ''}. ${
          pendingCount > 0
            ? `You have ${pendingCount} quote${pendingCount !== 1 ? 's' : ''} awaiting response.`
            : 'Everything is up to date.'
        }`}
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
            <button className={`tab${isAll ? ' active' : ''}`} onClick={() => setCurrency('all')}>All</button>
            {currenciesUsed.map(c => (
              <button key={c} className={`tab${currency === c ? ' active' : ''}`} onClick={() => setCurrency(c)}>
                {c}
              </button>
            ))}
          </div>
        )}

        {/* ── Stat cards ── */}
        <div className="metrics-grid">
          <MetricCard
            icon={<IconDollarSign />}
            color="orange"
            label={displayCurrency ? `Total Quoted (${displayCurrency})` : 'Total Quoted'}
            value={totalQuotedCompact}
            fullValue={totalQuotedFull}
            change={!isAll ? changeLabel : undefined}
            changeUp={pct >= 0}
          />
          <MetricCard
            icon={<IconCheckCircle />}
            color="green"
            label="Quotes Accepted"
            value={`${stats?.quotes_accepted_this_month ?? 0}`}
            change="this month"
            changeUp
          />
          <MetricCard
            icon={<IconTrendingUp />}
            color="blue"
            label="Acceptance Rate"
            value={`${stats?.acceptance_rate ?? 0}%`}
          />
          <MetricCard
            icon={<IconBarChart2 />}
            color="purple"
            label={displayCurrency ? `Avg Value (${displayCurrency})` : 'Avg Value'}
            value={avgCompact}
            fullValue={avgFull}
          />
        </div>

        {/* ── Quick actions ── */}
        <div className="quick-actions">
          <button className="qa-btn" onClick={() => navigate('/app/create')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Quote
          </button>
          <button className="qa-btn" onClick={() => navigate('/app/clients/new')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Client
          </button>
          {expiringCount > 0 && (
            <button className="qa-btn qa-btn-warn" onClick={() => navigate('/app/quotes?filter=expiring')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Expiring Soon ({expiringCount})
            </button>
          )}
        </div>

        {/* ── Main grid ── */}
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

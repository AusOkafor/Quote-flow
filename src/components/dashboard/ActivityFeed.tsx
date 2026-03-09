import { useNavigate } from 'react-router-dom';
import { relativeTime } from '@/lib/utils';
import type { ActivityItem } from '@/types';

interface Props { items: ActivityItem[] }

// SVG icons per type
function ActivityIcon({ type }: { type: ActivityItem['type'] }) {
  const base: React.CSSProperties = {
    width: 30, height: 30, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  };

  switch (type) {
    case 'accepted':
      return (
        <div style={{ ...base, background: '#EDFAF3', color: '#2DAB6F' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      );
    case 'sent':
      return (
        <div style={{ ...base, background: '#EEF4FF', color: '#2F7DE8' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </div>
      );
    case 'expiring':
      return (
        <div style={{ ...base, background: 'rgba(201,168,76,.12)', color: '#C9A84C' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
      );
    case 'created':
      return (
        <div style={{ ...base, background: 'rgba(138,130,120,.1)', color: '#8A8278' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
      );
    case 'duplicated':
      return (
        <div style={{ ...base, background: 'rgba(138,130,120,.1)', color: '#8A8278' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </div>
      );
    default: // viewed
      return (
        <div style={{ ...base, background: 'rgba(138,130,120,.1)', color: '#8A8278' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
      );
  }
}

function groupByDate(items: ActivityItem[]): { label: string; items: ActivityItem[] }[] {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86_400_000);
  const weekAgo   = new Date(today.getTime() - 6 * 86_400_000);

  const groups: Record<string, ActivityItem[]> = {};
  for (const item of items) {
    const d = new Date(item.occurred_at);
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    let label: string;
    if (day >= today)         label = 'Today';
    else if (day >= yesterday) label = 'Yesterday';
    else if (day >= weekAgo)   label = 'This Week';
    else                       label = 'Earlier';
    (groups[label] ??= []).push(item);
  }

  const ORDER = ['Today', 'Yesterday', 'This Week', 'Earlier'];
  return ORDER.filter(l => groups[l]).map(l => ({ label: l, items: groups[l] }));
}

export default function ActivityFeed({ items }: Props) {
  const navigate = useNavigate();
  const grouped  = groupByDate(items);

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          Activity {items.length > 0 && <span className="notif-badge" />}
        </div>
      </div>
      {items.length === 0 && (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          No recent activity.
        </div>
      )}
      {grouped.map(group => (
        <div key={group.label}>
          <div className="act-group-label">{group.label}</div>
          {group.items.map(item => (
            <div
              key={item.id}
              className={`activity-item${item.quote_id ? ' act-clickable' : ''}`}
              onClick={item.quote_id ? () => navigate(`/app/quotes/${item.quote_id}/edit`) : undefined}
            >
              <ActivityIcon type={item.type} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="act-text" dangerouslySetInnerHTML={{ __html: item.message }} />
                <div className="act-time">{relativeTime(item.occurred_at)}</div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

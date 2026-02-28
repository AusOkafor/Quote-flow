import { relativeTime } from '@/lib/utils';
import type { ActivityItem } from '@/types';

interface Props { items: ActivityItem[] }

const DOT_COLORS: Record<ActivityItem['type'], string> = {
  accepted:   'var(--success)',
  viewed:     'var(--accent2)',
  expiring:   'var(--gold)',
  created:    'var(--muted)',
  sent:       'var(--accent)',
  duplicated: 'var(--muted)',
};

export default function ActivityFeed({ items }: Props) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          Activity {items.length > 0 && <span className="notif-badge" />}
        </div>
        <button className="btn btn-ghost btn-sm">Mark all read</button>
      </div>
      {items.length === 0 && (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          No recent activity.
        </div>
      )}
      {items.map(item => (
        <div className="activity-item" key={item.id}>
          <div
            className="act-dot"
            style={{ background: DOT_COLORS[item.type] ?? 'var(--muted)' }}
          />
          <div>
            <div className="act-text" dangerouslySetInnerHTML={{ __html: item.message }} />
            <div className="act-time">{relativeTime(item.occurred_at)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

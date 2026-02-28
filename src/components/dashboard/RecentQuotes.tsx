import { useNavigate } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import { formatCurrency, relativeTime } from '@/lib/utils';
import type { Quote } from '@/types';

interface Props {
  quotes: Quote[];
  onPreview: (id: string) => void;
}

export default function RecentQuotes({ quotes, onPreview }: Props) {
  const navigate = useNavigate();
  const recent = quotes.slice(0, 5);

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Recent Quotes</div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/app/quotes')}>
          View all →
        </button>
      </div>
      {recent.length === 0 && (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          No quotes yet. <button className="btn btn-dark btn-sm" onClick={() => navigate('/app/create')} style={{ marginLeft: 8 }}>Create one</button>
        </div>
      )}
      {recent.map(q => (
        <div className="quote-row" key={q.id} onClick={() => onPreview(q.id)}>
          <div>
            <div className="qr-client-name">{q.client?.name ?? '—'}</div>
            <div className="qr-client-svc">{q.title}</div>
          </div>
          <Badge status={q.status} />
          <div className="qr-amount">{formatCurrency(q.total, q.currency)}</div>
          <div className="qr-date">{relativeTime(q.created_at)}</div>
        </div>
      ))}
    </div>
  );
}

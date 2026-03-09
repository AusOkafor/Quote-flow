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
      {recent.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          No quotes yet.{' '}
          <button className="btn btn-dark btn-sm" onClick={() => navigate('/app/create')} style={{ marginLeft: 8 }}>
            Create one
          </button>
        </div>
      ) : (
        <table className="rq-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Title</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th>Status</th>
              <th>Date</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {recent.map(q => (
              <tr key={q.id} className="rq-row" onClick={() => onPreview(q.id)}>
                <td className="rq-client">{q.client?.name ?? '—'}</td>
                <td className="rq-title">{q.title || '—'}</td>
                <td className="rq-amount">{formatCurrency(q.total, q.currency)}</td>
                <td><Badge status={q.status} /></td>
                <td className="rq-date">{relativeTime(q.created_at)}</td>
                <td className="rq-action">
                  <button
                    className="rq-view-btn"
                    onClick={e => { e.stopPropagation(); navigate(`/app/quotes/${q.id}/edit`); }}
                  >
                    View →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

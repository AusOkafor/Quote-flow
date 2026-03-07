import React, { useState, useRef, useEffect } from 'react';
import Badge from '@/components/ui/Badge';
import { formatCurrency, relativeTime } from '@/lib/utils';
import { messages } from '@/lib/messages';
import type { Quote } from '@/types';

function PaymentIndicator({ quote }: { quote: Quote }) {
  if (quote.status !== 'accepted') return <span style={{ color: 'var(--muted)' }}>—</span>;
  if (quote.fully_paid_at || quote.paid_at) return <span style={{ color: 'var(--success)', fontWeight: 600 }}>✓ Paid</span>;
  if (quote.deposit_paid_at) return <span style={{ color: 'var(--muted)' }}>🕐 Deposit paid</span>;
  return <span style={{ color: 'var(--muted)' }}>—</span>;
}

interface Props {
  quotes: Quote[];
  onPreview:       (id: string) => void;
  onDuplicate:    (id: string) => void;
  onDelete:       (id: string) => void;
  onSend:         (id: string) => void;
  onEdit:         (id: string) => void;
  onSaveAsTemplate?: (id: string) => void;
}

const TABS = [
  { label: 'All',      value: 'all'      },
  { label: 'Draft',    value: 'draft'    },
  { label: 'Sent',     value: 'sent'     },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Expired',  value: 'expired'  },
];

export default function QuotesTable({ quotes, onPreview, onDuplicate, onDelete, onSend, onEdit, onSaveAsTemplate }: Props) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dotsId, setDotsId] = useState<string | null>(null);
  const [dotsPos, setDotsPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setDotsId(null);
    };
    if (dotsId) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dotsId]);

  const filtered = quotes.filter(q => {
    const matchStatus = filter === 'all' || q.status === filter;
    const matchSearch = !search || [q.client?.name, q.title, q.quote_number]
      .some(s => s?.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const count = (s: string) => s === 'all' ? quotes.length : quotes.filter(q => q.status === s).length;

  const openDots = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setDotsPos({ top: rect.bottom + 6, left: Math.max(0, rect.right - 200) });
    setDotsId(prev => prev === id ? null : id);
  };

  const dotActions: { icon: string; label: string; action: (id: string) => void }[] = [
    { icon: '👁',  label: 'View',             action: (id: string) => onPreview(id) },
    { icon: '✏️',  label: 'Edit',            action: (id: string) => onEdit(id) },
    { icon: '📋',  label: 'Duplicate',       action: (id: string) => onDuplicate(id) },
    { icon: '📤',  label: 'Send',            action: (id: string) => onSend(id) },
    ...(onSaveAsTemplate ? [{ icon: '📄', label: 'Save as Template', action: onSaveAsTemplate }] : []),
  ];

  return (
    <>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <span>🔍</span>
          <input placeholder={messages.quotesPage.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="tab-bar">
        {TABS.map(tab => (
          <button key={tab.value} className={`tab${filter === tab.value ? ' active' : ''}`} onClick={() => setFilter(tab.value)}>
            {tab.label} ({count(tab.value)})
          </button>
        ))}
      </div>

      <div className="card">
        <table className="quotes-table">
          <thead>
            <tr>
              <th style={{ width: 70 }}>#</th>
              <th>Client</th>
              <th>Service</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 52, color: 'var(--muted)' }}>
                  {search ? messages.empty.noResults : messages.empty.noQuotesYet}
                </td>
              </tr>
            ) : filtered.map(q => (
              <tr key={q.id} onClick={() => onPreview(q.id)}>
                <td>
                  <span className="qt-num" style={{ position: 'relative' }}>
                    {q.quote_number}
                    {q.has_unread_notes && (
                      <span
                        title="Unread client message"
                        style={{
                          position: 'absolute',
                          top: -2,
                          right: -8,
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: 'var(--danger)',
                        }}
                      />
                    )}
                  </span>
                </td>
                <td style={{ fontWeight: 500 }}>{q.client?.name ?? '—'}</td>
                <td style={{ color: 'var(--muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.title}</td>
                <td><Badge status={q.status} paid={!!(q.fully_paid_at || q.paid_at)} /></td>
                <td><PaymentIndicator quote={q} /></td>
                <td><span className="qt-amount">{formatCurrency(q.total, q.currency)}</span></td>
                <td style={{ color: 'var(--muted)', fontSize: 13 }}>{relativeTime(q.created_at)}</td>
                <td>
                  <div className="qt-actions">
                    <button className="action-btn primary" onClick={e => { e.stopPropagation(); onPreview(q.id); }}>View</button>
                    <button className="action-btn"         onClick={e => { e.stopPropagation(); onDuplicate(q.id); }}>Duplicate</button>
                    <button className="action-btn"         onClick={e => openDots(e, q.id)}>•••</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dotsId && (
        <div ref={menuRef} style={{ position: 'fixed', top: dotsPos.top, left: dotsPos.left, background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 11, minWidth: 200, zIndex: 500, boxShadow: '0 8px 32px rgba(0,0,0,.14)', overflow: 'hidden' }}>
          {dotActions.map(item => (
            <div
              key={item.label}
              onClick={() => { item.action(dotsId); setDotsId(null); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', fontSize: 13.5, cursor: 'pointer', borderBottom: '1px solid var(--cream)' }}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = 'var(--cream)'; }}
              onMouseOut={e  => { (e.currentTarget as HTMLElement).style.background = ''; }}
            >
              <span style={{ width: 20 }}>{item.icon}</span> {item.label}
            </div>
          ))}
          <div
            onClick={() => {
              if (window.confirm('Delete this quote? This cannot be undone.')) onDelete(dotsId);
              setDotsId(null);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', fontSize: 13.5, cursor: 'pointer', color: 'var(--danger)' }}
            onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(232,64,64,.06)'; }}
            onMouseOut={e  => { (e.currentTarget as HTMLElement).style.background = ''; }}
          >
            <span style={{ width: 20 }}>🗑</span> Delete Quote
          </div>
        </div>
      )}
    </>
  );
}

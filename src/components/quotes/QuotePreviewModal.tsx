import React, { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { quotesApi } from '@/services/api';
import { formatCurrency, formatDateLong, formatDateTime, quotePublicUrl, copyToClipboard } from '@/lib/utils';
import type { Quote, QuoteNote } from '@/types';

interface Props {
  quote: Quote | null;
  open: boolean;
  onClose: () => void;
  onSend?: (id: string) => void;
  onMarkPaid?: (id: string) => void;
  onNotesRead?: () => void;
  toast?: (msg: string, type?: 'success' | 'info' | 'warning' | 'default') => void;
  loading?: boolean;
  /** Profile for logo/business name/brand color (in-app preview) */
  profile?: { logo_url?: string | null; business_name?: string; brand_color?: string };
}

export default function QuotePreviewModal({ quote, open, onClose, onSend, onMarkPaid, onNotesRead, toast, loading, profile }: Props) {
  const [notes, setNotes] = useState<QuoteNote[]>([]);
  const [replyMsg, setReplyMsg] = useState('');
  const [postingReply, setPostingReply] = useState(false);
  useEffect(() => {
    if (!open || !quote?.id) return;
    quotesApi.getNotes(quote.id).then(setNotes).catch(() => {});
    quotesApi.markNotesRead(quote.id).then(() => onNotesRead?.()).catch(() => {});
  }, [open, quote?.id, onNotesRead]);

  const loadNotes = () => {
    if (!quote?.id) return;
    quotesApi.getNotes(quote.id).then(setNotes).catch(() => {});
  };

  const handleReply = async () => {
    if (!quote?.id || !replyMsg.trim()) return;
    setPostingReply(true);
    try {
      await quotesApi.postNote(quote.id, { message: replyMsg.trim() });
      setReplyMsg('');
      loadNotes();
      toast?.('Reply sent.', 'success');
    } catch {
      toast?.('Could not send reply.', 'warning');
    } finally {
      setPostingReply(false);
    }
  };

  if (!open) return null;
  if (loading || !quote) {
    return (
      <Modal open={open} onClose={onClose} maxWidth={760}>
        <div className="qp-wrap" style={{ padding: 48, textAlign: 'center', color: 'var(--muted)' }}>
          Loading…
        </div>
      </Modal>
    );
  }

  const items = quote.line_items ?? [];
  const publicLink = quotePublicUrl(quote.share_token);
  const accent = profile?.brand_color || 'var(--accent)';

  return (
    <Modal open={open} onClose={onClose} maxWidth={760}>
      <div className="qp-wrap" style={{ ['--quote-accent']: accent } as React.CSSProperties}>
        {/* Header */}
        <div className="qp-top">
          <div>
            {profile?.logo_url ? (
              <img src={profile.logo_url} alt="" style={{ maxHeight: 48, maxWidth: 140, objectFit: 'contain', marginBottom: 8 }} />
            ) : (
              <div className="qp-brand">Quote<span className="qp-accent">Flow</span></div>
            )}
            <div className="qp-biz">{profile?.business_name || 'Professional Quote'}</div>
          </div>
          <div className="qp-meta">
            <div className="qp-num">{quote.quote_number}</div>
            <div className="qp-dates">
              Issued: {formatDateLong(quote.created_at)}<br />
              Expires: {formatDateLong(quote.expires_at)}
            </div>
          </div>
        </div>

        <div className="qp-title">{quote.title}</div>

        {/* Parties */}
        {quote.client && (
          <div className="qp-parties">
            <div>
              <div className="qp-party-lbl">Prepared For</div>
              <div className="qp-party-name">{quote.client.name}</div>
              <div className="qp-party-det">
                {quote.client.company && <>{quote.client.company}<br /></>}
                {quote.client.email}<br />
                {quote.client.phone}
              </div>
            </div>
            <div>
              <div className="qp-party-lbl">Terms</div>
              <div className="qp-party-det" style={{ fontSize: 12, lineHeight: 1.8 }}>
                {quote.deposit && <><strong>Deposit:</strong> {quote.deposit}<br /></>}
                {quote.delivery_timeline && <><strong>Delivery:</strong> {quote.delivery_timeline}<br /></>}
                {quote.revisions && <><strong>Revisions:</strong> {quote.revisions}<br /></>}
                {quote.payment_method && <><strong>Payment:</strong> {quote.payment_method}</>}
              </div>
            </div>
          </div>
        )}

        {/* Line items */}
        {items.length > 0 && (
          <table className="qp-table">
            <thead>
              <tr>
                <th style={{ width: '50%' }}>Description</th>
                <th style={{ textAlign: 'right' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Unit Price</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td className="td-main">{item.description}</td>
                  <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(item.unit_price, quote.currency)}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(item.total, quote.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Totals */}
        <div className="qp-totals">
          <div className="qp-tot-inner">
            <div className="qp-tot-row">
              <span>Subtotal</span>
              <span>{formatCurrency(quote.subtotal, quote.currency)}</span>
            </div>
            <div className="qp-tot-row">
              <span>{quote.tax_exempt ? 'GCT (Exempt)' : `GCT (${quote.tax_rate}%)`}</span>
              <span>{quote.tax_exempt ? '—' : formatCurrency(quote.tax_amount, quote.currency)}</span>
            </div>
            <div className="qp-tot-row final">
              <span>Total</span>
              <span className="qp-accent">{formatCurrency(quote.total, quote.currency)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="qp-notes">
            <div className="qp-notes-lbl">Notes & Scope</div>
            <p>{quote.notes}</p>
          </div>
        )}

        {/* Notes thread */}
        <div className="qp-notes" style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <div className="qp-notes-lbl">Questions & Notes</div>
          {notes.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              {notes.map(n => (
                <div
                  key={n.id}
                  style={{
                    padding: '8px 10px',
                    marginBottom: 6,
                    borderRadius: 8,
                    background: n.author_type === 'client' ? 'rgba(0,0,0,.04)' : 'rgba(var(--accent-rgb, 47, 125, 232), 0.08)',
                    borderLeft: `3px solid ${n.author_type === 'client' ? 'var(--muted)' : accent}`,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2, color: 'var(--text)' }}>
                    {n.author_name} · {formatDateTime(n.created_at)}
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.4 }}>{n.message}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              placeholder="Reply to client…"
              value={replyMsg}
              onChange={e => setReplyMsg(e.target.value)}
              rows={2}
              style={{
                flex: 1,
                padding: 8,
                borderRadius: 8,
                border: '1px solid var(--border)',
                fontSize: 13,
                resize: 'vertical',
              }}
            />
            <button
              className="btn btn-dark btn-sm"
              onClick={() => void handleReply()}
              disabled={postingReply || !replyMsg.trim()}
            >
              {postingReply ? '…' : 'Reply'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="qp-foot">
          <div className="qp-valid">
            Valid for {quote.validity_days} days<br />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Views: {quote.view_count}</span>
            {quote.status === 'accepted' && quote.accepted_by_name && (
              <>
                <br />
                <span style={{ fontSize: 11, color: 'var(--success)' }}>Signed by {quote.accepted_by_name}</span>
              </>
            )}
            {quote.paid_at && (
              <>
                <br />
                <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>✓ Paid</span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {quote.status === 'accepted' && !quote.paid_at && onMarkPaid && (
              <button
                className="btn btn-success btn-sm"
                onClick={() => { onMarkPaid(quote.id); }}
              >
                ✓ Mark as Paid
              </button>
            )}
            {quote.status !== 'accepted' && (
              <>
                {quote.share_token && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      void copyToClipboard(publicLink);
                      toast?.('🔗 Link copied!', 'success');
                    }}
                  >
                    🔗 Copy Link
                  </button>
                )}
                {onSend && (
                  <button className="btn btn-dark btn-sm" onClick={() => { onClose(); onSend(quote.id); }}>
                    📤 Send Quote
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

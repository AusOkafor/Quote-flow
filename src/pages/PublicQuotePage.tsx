import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { publicApi } from '@/services/api';
import { useAppToast } from '@/components/layout/ToastProvider';
import { formatCurrency, formatDateLong, formatDateShort, formatDateTime } from '@/lib/utils';
import type { QuoteWithDetails, QuoteNote } from '@/types';

export default function PublicQuotePage() {
  const { token } = useParams<{ token: string }>();
  const toast = useAppToast();
  const [quote,    setQuote]    = useState<QuoteWithDetails | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [accepted, setAccepted] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [notes,    setNotes]    = useState<QuoteNote[]>([]);
  const [noteName,  setNoteName] = useState('');
  const [noteMsg,   setNoteMsg]  = useState('');
  const [postingNote, setPostingNote] = useState(false);
  const [showChangeRequest, setShowChangeRequest] = useState(false);
  const [changeRequestMsg, setChangeRequestMsg] = useState('');
  const [postingChangeRequest, setPostingChangeRequest] = useState(false);

  useEffect(() => {
    if (!token) return;
    publicApi.getQuote(token)
      .then(q => {
        setQuote(q);
        setNoteName(q.client?.name ?? '');
      })
      .catch(() => setError('This quote link is invalid or has expired.'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!token || !quote) return;
    publicApi.getNotes(token).then(setNotes).catch(() => {});
  }, [token, quote]);

  const loadNotes = () => {
    if (!token) return;
    publicApi.getNotes(token).then(setNotes).catch(() => {});
  };

  const handlePostNote = async () => {
    if (!token || !noteMsg.trim() || !noteName.trim()) return;
    setPostingNote(true);
    try {
      await publicApi.postNote(token, { name: noteName.trim(), message: noteMsg.trim() });
      setNoteMsg('');
      loadNotes();
      toast('Message sent. The freelancer will be notified.', 'success');
    } catch {
      toast('Could not send message. Please try again.', 'warning');
    } finally {
      setPostingNote(false);
    }
  };

  const handlePostChangeRequest = async () => {
    if (!token || !changeRequestMsg.trim() || !noteName.trim()) return;
    setPostingChangeRequest(true);
    try {
      await publicApi.postNote(token, {
        name: noteName.trim(),
        message: changeRequestMsg.trim(),
        note_type: 'change_request',
      });
      setChangeRequestMsg('');
      setShowChangeRequest(false);
      loadNotes();
      const updated = await publicApi.getQuote(token);
      setQuote(updated);
      toast('Change request sent. The freelancer will be notified and can update the quote.', 'success', 5000);
    } catch {
      toast('Could not send request. Please try again.', 'warning');
    } finally {
      setPostingChangeRequest(false);
    }
  };

  const handleAccept = async () => {
    if (!token) return;
    if (quote?.require_signature && !signatureName.trim()) {
      alert('Please type your full name to sign and accept this quote.');
      return;
    }
    setAccepting(true);
    try {
      await publicApi.acceptQuote(token, signatureName.trim() || undefined);
      setAccepted(true);
      if (quote) setQuote({ ...quote, status: 'accepted', accepted_by_name: signatureName.trim() || quote.accepted_by_name });
      toast('🎉 Quote accepted! The freelancer has been notified.', 'success', 5000);
    } catch {
      // Network/timeout/CORS can cause fetch to fail even when the backend succeeded (e.g. Render cold start).
      // Refetch the quote to see if it was actually accepted.
      try {
        const updated = await publicApi.getQuote(token);
        if (updated.status === 'accepted') {
          setAccepted(true);
          setQuote(updated);
          toast('🎉 Quote accepted! The freelancer has been notified.', 'success', 5000);
          return;
        }
      } catch {
        /* ignore refetch errors */
      }
      alert('Could not accept quote. It may have already been accepted or expired.');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) return <div className="public-viewer" style={{ textAlign: 'center', paddingTop: 120, fontFamily: 'Syne' }}>Loading quote…</div>;
  if (error)   return <div className="public-viewer" style={{ textAlign: 'center', paddingTop: 120, color: 'var(--danger)' }}>{error}</div>;
  if (!quote)  return null;

  const items = quote.line_items ?? [];
  const accent = quote.creator?.brand_color || 'var(--accent)';

  // Expiry countdown
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiresDate = new Date(quote.expires_at);
  expiresDate.setHours(0, 0, 0, 0);
  const daysRemaining = Math.ceil((expiresDate.getTime() - today.getTime()) / 86_400_000);
  const isExpired = daysRemaining < 0;
  const businessName = quote.creator?.business_name || 'the vendor';

  const expiryBanner = () => {
    const expDate = formatDateShort(quote.expires_at);
    if (daysRemaining > 7) {
      return (
        <div className="expiry-banner expiry-neutral">
          Valid for {quote.validity_days} days · Expires {expDate}
        </div>
      );
    }
    if (daysRemaining >= 3 && daysRemaining <= 7) {
      return (
        <div className="expiry-banner expiry-amber">
          ⏱ Expires in {daysRemaining} days — {expDate}
        </div>
      );
    }
    if (daysRemaining === 1 || daysRemaining === 2) {
      return (
        <div className="expiry-banner expiry-red">
          ⚠ Expires {daysRemaining === 1 ? 'tomorrow' : `in ${daysRemaining} days`} — accept today
        </div>
      );
    }
    if (daysRemaining === 0) {
      return (
        <div className="expiry-banner expiry-red">
          ⚠ Expires today — accept now
        </div>
      );
    }
    if (isExpired) {
      return (
        <div className="expiry-banner expiry-expired">
          Expired on {formatDateShort(quote.expires_at)}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="public-viewer">
      {accepted && (
        <div className="accepted-banner" style={{ maxWidth: 760, margin: '0 auto 24px' }}>
          ✅ You have accepted this quote. The freelancer has been notified.
        </div>
      )}
      <div className="modal" style={{ maxWidth: 760, margin: '0 auto' }}>
        <div className="qp-wrap" style={{ ['--quote-accent']: accent } as React.CSSProperties}>
          <div className="qp-top">
            <div>
              {quote.creator?.logo_url ? (
                <img src={quote.creator.logo_url} alt="" style={{ maxHeight: 48, maxWidth: 140, objectFit: 'contain', marginBottom: 8 }} />
              ) : (
                <div className="qp-brand">Quote<span className="qp-accent">Flow</span></div>
              )}
              <div className="qp-biz">{quote.creator?.business_name || 'Professional Quote'}</div>
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

          {expiryBanner()}

          <div className="qp-parties">
            <div>
              <div className="qp-party-lbl">Prepared For</div>
              <div className="qp-party-name">{quote.client.name}</div>
              <div className="qp-party-det">
                {quote.client.company && <>{quote.client.company}<br /></>}
                {quote.client.email}<br />{quote.client.phone}
              </div>
            </div>
            <div>
              <div className="qp-party-lbl">Terms</div>
              <div className="qp-party-det" style={{ fontSize: 12, lineHeight: 1.8 }}>
                {quote.deposit && <><strong>Deposit:</strong> {quote.deposit}<br /></>}
                {quote.delivery_timeline && <><strong>Delivery:</strong> {quote.delivery_timeline}<br /></>}
                {quote.revisions && <><strong>Revisions:</strong> {quote.revisions}</>}
              </div>
            </div>
          </div>

          {items.length > 0 && (
            <table className="qp-table">
              <thead><tr>
                <th style={{ width: '50%' }}>Description</th>
                <th style={{ textAlign: 'right' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Unit Price</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr></thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td className="td-main" data-label="Description">{item.description}</td>
                    <td style={{ textAlign: 'right' }} data-label="Qty">{item.quantity}</td>
                    <td style={{ textAlign: 'right' }} data-label="Unit Price">{formatCurrency(item.unit_price, quote.currency)}</td>
                    <td style={{ textAlign: 'right' }} data-label="Total">{formatCurrency(item.total, quote.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="qp-totals">
            <div className="qp-tot-inner">
              <div className="qp-tot-row"><span>Subtotal</span><span>{formatCurrency(quote.subtotal, quote.currency)}</span></div>
              <div className="qp-tot-row"><span>GCT</span><span>{quote.tax_exempt ? '—' : formatCurrency(quote.tax_amount, quote.currency)}</span></div>
              <div className="qp-tot-row final"><span>Total</span><span className="qp-accent">{formatCurrency(quote.total, quote.currency)}</span></div>
            </div>
          </div>

          {quote.notes && (
            <div className="qp-notes">
              <div className="qp-notes-lbl">Notes</div>
              <p>{quote.notes}</p>
            </div>
          )}

          <div className="qp-foot">
            <div className="qp-valid">Valid for {quote.validity_days} days</div>
            {!accepted && quote.status !== 'accepted' && !isExpired && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', width: '100%', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-outline"
                    onClick={() => setShowChangeRequest(prev => !prev)}
                  >
                    ✏️ Request Changes
                  </button>
                  {quote.require_signature && (
                  <div style={{ width: '100%', maxWidth: 320 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--muted)' }}>
                      Sign with your full name
                    </label>
                    <input
                      type="text"
                      value={signatureName}
                      onChange={e => setSignatureName(e.target.value)}
                      placeholder="e.g. Simone Richards"
                      style={{
                        width: '100%',
                        padding: 12,
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        fontSize: 14,
                      }}
                    />
                  </div>
                )}
                  <button
                    className="btn btn-success"
                    onClick={() => void handleAccept()}
                    disabled={accepting || (quote.require_signature && !signatureName.trim())}
                  >
                    {accepting ? 'Accepting…' : '✓ Accept this Quote'}
                  </button>
                </div>
                {showChangeRequest && (
                  <div style={{ width: '100%', maxWidth: 480, padding: 16, background: 'var(--cream)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--muted)' }}>Describe the changes you'd like</div>
                    <textarea
                      placeholder="e.g. Can we reduce the price for the logo design? Or extend the timeline by 1 week?"
                      value={changeRequestMsg}
                      onChange={e => setChangeRequestMsg(e.target.value)}
                      rows={4}
                      style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, resize: 'vertical', marginBottom: 10 }}
                    />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => { setShowChangeRequest(false); setChangeRequestMsg(''); }}>Cancel</button>
                      <button
                        className="btn btn-dark btn-sm"
                        onClick={() => void handlePostChangeRequest()}
                        disabled={postingChangeRequest || !changeRequestMsg.trim()}
                      >
                        {postingChangeRequest ? 'Sending…' : 'Send Request'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {isExpired && !accepted && quote.status !== 'accepted' && (
              <div className="expiry-expired-box">
                This quote expired on {formatDateLong(quote.expires_at)}. Contact {businessName} for a refreshed quote.
              </div>
            )}
            {(accepted || quote.status === 'accepted') && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>✅ Accepted</span>
                {quote.accepted_by_name && (
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>Signed by {quote.accepted_by_name}</span>
                )}
              </div>
            )}
          </div>

          {/* Notes thread */}
          <div className="qp-notes" style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
            <div className="qp-notes-lbl">Questions & Notes</div>
            {notes.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                {notes.map(n => (
                  <div
                    key={n.id}
                    style={{
                      padding: '10px 12px',
                      marginBottom: 8,
                      borderRadius: 8,
                      background: n.note_type === 'change_request' ? 'rgba(232,92,47,.08)' : n.author_type === 'client' ? 'rgba(0,0,0,.04)' : 'rgba(var(--accent-rgb, 47, 125, 232), 0.08)',
                      borderLeft: `3px solid ${n.note_type === 'change_request' ? 'var(--accent)' : n.author_type === 'client' ? 'var(--muted)' : accent}`,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {n.note_type === 'change_request' && <span style={{ fontSize: 10, background: 'var(--accent)', color: '#fff', padding: '2px 6px', borderRadius: 4 }}>Change Request</span>}
                      {n.author_name} · {formatDateTime(n.created_at)}
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.5 }}>{n.message}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="text"
                placeholder="Your name"
                value={noteName}
                onChange={e => setNoteName(e.target.value)}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  fontSize: 14,
                }}
              />
              <textarea
                placeholder="Ask a question or add a note…"
                value={noteMsg}
                onChange={e => setNoteMsg(e.target.value)}
                rows={3}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  fontSize: 14,
                  resize: 'vertical',
                }}
              />
              <button
                className="btn btn-dark"
                onClick={() => void handlePostNote()}
                disabled={postingNote || !noteName.trim() || !noteMsg.trim()}
                style={{ alignSelf: 'flex-end' }}
              >
                {postingNote ? 'Sending…' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

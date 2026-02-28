import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { publicApi } from '@/services/api';
import { useAppToast } from '@/components/layout/ToastProvider';
import { formatCurrency, formatDateLong, formatDateShort } from '@/lib/utils';
import type { QuoteWithDetails } from '@/types';

export default function PublicQuotePage() {
  const { token } = useParams<{ token: string }>();
  const toast = useAppToast();
  const [quote,    setQuote]    = useState<QuoteWithDetails | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [accepted, setAccepted] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [signatureName, setSignatureName] = useState('');

  useEffect(() => {
    if (!token) return;
    publicApi.getQuote(token)
      .then(setQuote)
      .catch(() => setError('This quote link is invalid or has expired.'))
      .finally(() => setLoading(false));
  }, [token]);

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
        </div>
      </div>
    </div>
  );
}

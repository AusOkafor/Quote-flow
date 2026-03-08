import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Modal from '@/components/ui/Modal';
import { quotesApi, paymentsApi } from '@/services/api';
import { formatCurrency, formatDateLong, formatDateTime, quotePublicUrl, copyToClipboard, calcDepositAmount, getTaxLabel } from '@/lib/utils';
import { logoStyles } from '@/lib/logoStyles';
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
  /** Profile for logo/business name/brand color/tax info (in-app preview) */
  profile?: { logo_url?: string | null; business_name?: string; brand_color?: string; tax_type?: string; tax_number?: string };
}

export default function QuotePreviewModal({ quote, open, onClose, onSend, onMarkPaid, onNotesRead, toast, loading, profile }: Props) {
  const [notes, setNotes] = useState<QuoteNote[]>([]);
  const [replyMsg, setReplyMsg] = useState('');
  const [postingReply, setPostingReply] = useState(false);
  const [requestingBalance, setRequestingBalance] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  useEffect(() => {
    if (!open || !quote?.id) return;
    quotesApi.getNotes(quote.id).then(setNotes).catch(() => {});
    quotesApi.markNotesRead(quote.id).then(() => onNotesRead?.()).catch(() => {});
  }, [open, quote?.id, onNotesRead]);

  const loadNotes = () => {
    if (!quote?.id) return;
    quotesApi.getNotes(quote.id).then(setNotes).catch(() => {});
  };

  const handleRequestBalancePayment = async () => {
    if (!quote?.id) return;
    setRequestingBalance(true);
    try {
      const res = await paymentsApi.createLink({ quote_id: quote.id, payment_type: 'balance' });
      if (res.payment_url) {
        await copyToClipboard(res.payment_url);
        toast?.('Balance payment link copied! Send it to your client.', 'success');
      }
    } catch {
      toast?.('Could not create payment link. Connect a processor in Settings.', 'warning');
    } finally {
      setRequestingBalance(false);
    }
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

  const handleDownloadPDF = async () => {
    if (!quote) return;
    setIsGeneratingPDF(true);
    try {
      await new Promise(r => setTimeout(r, 100));
      const element = document.getElementById('quote-content');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();

      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      const clientName = quote.client?.name ?? 'quote';
      const fileName = `QuoteFlow-${quote.quote_number}-${clientName.replace(/\s+/g, '-')}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast?.('Failed to generate PDF', 'warning');
    } finally {
      setIsGeneratingPDF(false);
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
      <div id="quote-content">
        <div className="qp-wrap" style={{ ['--quote-accent']: accent } as React.CSSProperties}>
          {/* Header */}
          <div className="qp-top">
          <div>
            {profile?.logo_url ? (
              <img
                src={profile.logo_url}
                alt={profile?.business_name || ''}
                style={{
                  ...(isGeneratingPDF ? logoStyles.pdf : logoStyles.publicQuote),
                  marginBottom: 8,
                }}
              />
            ) : (
              <div className="qp-brand">Quote<span className="qp-accent">Flow</span></div>
            )}
            <div className="qp-biz">{profile?.business_name || 'Professional Quote'}</div>
            {profile?.tax_number && (
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Tax Reg. No: {profile.tax_number}</div>
            )}
          </div>
          <div className="qp-meta">
            <div className="qp-num">{quote.quote_number}</div>
            <div className="qp-dates">
              Issued: {formatDateLong(quote.created_at)}<br />
              Expires: {formatDateLong(quote.expires_at)}
            </div>
            {!isGeneratingPDF && (
              <button
                type="button"
                onClick={() => void handleDownloadPDF()}
                className="btn btn-outline btn-sm"
                style={{ marginTop: 8 }}
              >
                ⬇ Download PDF
              </button>
            )}
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

        {quote.status === 'accepted' && (
          <div style={{ marginTop: 12, padding: 12, background: 'var(--cream)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div className="qp-party-lbl">Payment</div>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
              {quote.fully_paid_at || quote.paid_at ? (
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>✓ Fully paid {formatCurrency(quote.total, quote.currency)}</span>
              ) : quote.deposit_paid_at ? (
                <>
                  <span style={{ color: 'var(--muted)' }}>○ Deposit paid {formatCurrency(calcDepositAmount(quote.deposit || '50%', quote.total), quote.currency)} · Balance due {formatCurrency(quote.total - calcDepositAmount(quote.deposit || '50%', quote.total), quote.currency)}</span>
                  {!isGeneratingPDF && (
                    <div style={{ marginTop: 8 }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => void handleRequestBalancePayment()}
                        disabled={requestingBalance}
                      >
                        {requestingBalance ? 'Creating…' : 'Request Balance Payment'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <span style={{ color: 'var(--muted)' }}>— Not yet paid</span>
              )}
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
              <span>{(() => { const lbl = getTaxLabel(profile?.tax_type); return quote.tax_exempt ? (lbl ? `${lbl} (Exempt)` : 'Tax (Exempt)') : (lbl ? `${lbl} (${quote.tax_rate}%)` : `Tax (${quote.tax_rate}%)`); })()}</span>
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

        {/* Notes thread — hidden in PDF */}
        {!isGeneratingPDF && (
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
                    background: n.note_type === 'change_request' ? 'rgba(232,92,47,.08)' : n.author_type === 'client' ? 'rgba(0,0,0,.04)' : 'rgba(var(--accent-rgb, 47, 125, 232), 0.08)',
                    borderLeft: `3px solid ${n.note_type === 'change_request' ? 'var(--accent)' : n.author_type === 'client' ? 'var(--muted)' : accent}`,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {n.note_type === 'change_request' && <span style={{ fontSize: 9, background: 'var(--accent)', color: '#fff', padding: '1px 5px', borderRadius: 3 }}>Change Request</span>}
                    {n.author_name} · {formatDateTime(n.created_at)}
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.4 }}>{n.message}</div>
                </div>
              ))}
            </div>
          )}
          {!isGeneratingPDF && (
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
          )}
        </div>
        )}

        {/* Footer */}
        <div className="qp-foot">
          {!isGeneratingPDF && (
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
          )}
          {!isGeneratingPDF && (
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
          )}
        </div>
        </div>
      </div>
    </Modal>
  );
}

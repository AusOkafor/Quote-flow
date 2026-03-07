import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { publicApi } from '@/services/api';
import { useAppToast } from '@/components/layout/ToastProvider';
import { formatCurrency, formatDateLong, formatDateShort, formatDateTime, calcDepositAmount } from '@/lib/utils';
import { messages } from '@/lib/messages';
import type { QuoteWithDetails, QuoteNote, PaymentProcessor } from '@/types';

export default function PublicQuotePage() {
  const { token } = useParams<{ token: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [paymentType, setPaymentType] = useState<'full' | 'deposit'>('deposit');
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    if (!token) return;
    publicApi.getQuote(token)
      .then(q => {
        setQuote(q);
        setNoteName(q.client?.name ?? '');
      })
      .catch(() => setError(messages.publicQuote.invalidLink))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!token || !quote) return;
    publicApi.getNotes(token).then(setNotes).catch(() => {});
  }, [token, quote]);

  useEffect(() => {
    if (quote?.creator?.logo_url) {
      console.log('[Logo] url:', quote.creator.logo_url);
    }
  }, [quote?.creator?.logo_url]);

  useEffect(() => {
    if (quote?.creator?.default_payment_timing === 'full') setPaymentType('full');
    else if (quote?.creator?.default_payment_timing === 'deposit') setPaymentType('deposit');
  }, [quote?.creator?.default_payment_timing]);

  // Handle payment success redirect (WiPay uses ?payment=success&processor=wipay)
  useEffect(() => {
    const paymentSuccess = searchParams.get('payment') === 'success';
    if (paymentSuccess && token) {
      publicApi.getQuote(token).then((q) => {
        setQuote(q);
        toast(messages.toast.paymentSuccessThankYou, 'success', 5000);
        // Clear URL params so refresh doesn't re-show toast
        setSearchParams({}, { replace: true });
      }).catch(() => {});
    }
  }, [token, searchParams, toast, setSearchParams]);

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
      toast(messages.publicQuote.messageSent, 'success');
    } catch {
      toast(messages.publicQuote.couldNotSend, 'warning');
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
      toast(messages.publicQuote.changeRequestSent, 'success', 5000);
    } catch {
      toast(messages.publicQuote.couldNotRequest, 'warning');
    } finally {
      setPostingChangeRequest(false);
    }
  };

  const handlePay = async (processor?: PaymentProcessor, overrideType?: 'full' | 'deposit' | 'balance') => {
    if (!token || !quote) return;
    setPaymentError('');
    setPaymentLoading(processor ?? 'default');
    const payType = overrideType ?? paymentType;

    // WiPay: navigate directly to our checkout proxy (no API call)
    if (processor === 'wipay') {
      window.location.href = publicApi.getWiPayCheckoutUrl(token, payType);
      return;
    }

    try {
      const result = await publicApi.createPaymentLink(token, {
        payment_type: payType,
        ...(processor ? { processor } : {}),
      });
      if (result.payment_url) {
        window.location.href = result.payment_url;
        return;
      }
      setPaymentError(messages.publicQuote.paymentLinkFailed);
    } catch (e) {
      const msg = e instanceof Error ? e.message : messages.publicQuote.paymentLinkFailed;
      setPaymentError(msg);
    } finally {
      setPaymentLoading(null);
    }
  };

  const handleAccept = async () => {
    if (!token) return;
    if (quote?.require_signature && !signatureName.trim()) {
      alert(messages.toast.signToAccept);
      return;
    }
    setAccepting(true);
    try {
      await publicApi.acceptQuote(token, signatureName.trim() || undefined);
      setAccepted(true);
      if (quote) setQuote({ ...quote, status: 'accepted', accepted_by_name: signatureName.trim() || quote.accepted_by_name });
      toast(messages.toast.quoteAcceptedNotify, 'success', 5000);
    } catch {
      // Network/timeout/CORS can cause fetch to fail even when the backend succeeded (e.g. Render cold start).
      // Refetch the quote to see if it was actually accepted.
      try {
        const updated = await publicApi.getQuote(token);
        if (updated.status === 'accepted') {
          setAccepted(true);
          setQuote(updated);
          toast(messages.toast.quoteAcceptedNotify, 'success', 5000);
          return;
        }
      } catch {
        /* ignore refetch errors */
      }
      alert(messages.toast.couldNotAccept);
    } finally {
      setAccepting(false);
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

      const baseName = quote.creator?.white_label
        ? (quote.creator?.business_name || 'Quote').replace(/\s+/g, '-')
        : 'QuoteFlow';
      const fileName = `${baseName}-${quote.quote_number}-${(quote.client?.name ?? 'quote').replace(/\s+/g, '-')}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast(messages.toast.pdfFailed, 'warning');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (loading) return <div className="public-viewer" style={{ textAlign: 'center', paddingTop: 120, fontFamily: 'Syne' }}>{messages.loading.loadingQuote}</div>;
  if (error)   return <div className="public-viewer" style={{ textAlign: 'center', paddingTop: 120, color: 'var(--danger)' }}>{error}</div>;
  if (!quote)  return null;

  const items = quote.line_items ?? [];
  const accent = quote.creator?.brand_color || 'var(--accent)';
  const processors = quote.payment_processors ?? [];
  const isFullyPaid = !!(quote.fully_paid_at || quote.paid_at);
  const isDepositPaid = !!quote.deposit_paid_at;
  const hasPaymentSection = processors.length > 0 && (accepted || quote.status === 'accepted') && !isFullyPaid;
  const showBalancePayment = hasPaymentSection && isDepositPaid;
  const depositAmount = calcDepositAmount(quote.deposit || '50%', quote.total);
  const balanceAmount = Math.round((quote.total - depositAmount) * 100) / 100;
  const isUsd = quote.currency === 'USD';

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
          {isGeneratingPDF ? `Expires ${expDate}` : `Valid for ${quote.validity_days} days · Expires ${expDate}`}
        </div>
      );
    }
    if (daysRemaining >= 3 && daysRemaining <= 7) {
      return (
        <div className="expiry-banner expiry-amber">
          {isGeneratingPDF ? `Expires ${expDate}` : `⏱ Expires in ${daysRemaining} days — ${expDate}`}
        </div>
      );
    }
    if (daysRemaining === 1 || daysRemaining === 2) {
      return (
        <div className="expiry-banner expiry-red">
          {isGeneratingPDF ? `Expires ${expDate}` : `⚠ Expires ${daysRemaining === 1 ? 'tomorrow' : `in ${daysRemaining} days`} — accept today`}
        </div>
      );
    }
    if (daysRemaining === 0) {
      return (
        <div className="expiry-banner expiry-red">
          {isGeneratingPDF ? `Expires ${expDate}` : '⚠ Expires today — accept now'}
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
          {messages.publicQuote.acceptedBanner}
        </div>
      )}
      {isFullyPaid && (
        <div className="modal" style={{ maxWidth: 760, margin: '0 auto 24px', padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{messages.publicQuote.paymentComplete}</div>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>
            {messages.publicQuote.paymentThankYou(formatCurrency(quote.total, quote.currency), businessName)}
          </div>
        </div>
      )}
      {hasPaymentSection && !isFullyPaid && (
        <div className="modal" style={{ maxWidth: 760, margin: '0 auto 24px', padding: 24 }}>
          {showBalancePayment ? (
            <>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{messages.publicQuote.depositPaidStatus} ✓</div>
              <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16 }}>
                {messages.publicQuote.balanceDue(formatCurrency(balanceAmount, quote.currency))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {processors.includes('stripe') && (
                  <button className="btn btn-dark" style={{ width: '100%' }} onClick={() => void handlePay('stripe', 'balance')} disabled={!!paymentLoading}>
                    {paymentLoading === 'stripe' ? messages.loading.redirecting : messages.publicQuote.payBalanceWithStripe}
                  </button>
                )}
                {processors.includes('paypal') && isUsd && (
                  <button className="btn btn-dark" style={{ width: '100%' }} onClick={() => void handlePay('paypal', 'balance')} disabled={!!paymentLoading}>
                    {paymentLoading === 'paypal' ? messages.loading.redirecting : messages.publicQuote.payBalanceWithPayPal}
                  </button>
                )}
                {processors.includes('wipay') && (
                  <button className="btn btn-dark" style={{ width: '100%' }} onClick={() => void handlePay('wipay', 'balance')} disabled={!!paymentLoading}>
                    {paymentLoading === 'wipay' ? messages.loading.redirecting : messages.publicQuote.payBalanceWithWiPay(quote.currency)}
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>{messages.publicQuote.acceptedTimeToPay}</div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{messages.publicQuote.howMuchToPay}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: 12, background: paymentType === 'deposit' ? 'var(--cream)' : 'transparent', borderRadius: 8, border: '1px solid ' + (paymentType === 'deposit' ? 'var(--accent)' : 'var(--border)') }}>
                    <input type="radio" name="pay_type" checked={paymentType === 'deposit'} onChange={() => setPaymentType('deposit')} />
                    <span>{messages.publicQuote.payDepositOnly}</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{formatCurrency(depositAmount, quote.currency)}</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>({quote.deposit || '50%'} upfront)</span>
                  </label>
                  <label
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: 12,
                      background: paymentType === 'full' ? 'var(--cream)' : 'transparent',
                      borderRadius: 8,
                      border: '1px solid ' + (paymentType === 'full' ? 'var(--accent)' : 'var(--border)'),
                    }}
                  >
                    <input type="radio" name="pay_type" checked={paymentType === "full"} onChange={() => setPaymentType("full")} />
                    <span>{messages.publicQuote.payFullAmount}</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{formatCurrency(quote.total, quote.currency)}</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>(saves follow-up)</span>
                  </label>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginBottom: 16 }}>
                {processors.includes('stripe') && (
                  <button className="btn btn-dark" style={{ width: '100%', marginBottom: 10 }} onClick={() => void handlePay('stripe')} disabled={!!paymentLoading}>
                    {paymentLoading === 'stripe' ? messages.loading.redirecting : messages.publicQuote.payWithStripe}
                  </button>
                )}
                {processors.includes('paypal') && isUsd && (
                  <button className="btn btn-dark" style={{ width: '100%', marginBottom: 10 }} onClick={() => void handlePay('paypal')} disabled={!!paymentLoading}>
                    {paymentLoading === 'paypal' ? messages.loading.redirecting : messages.publicQuote.payWithPayPal}
                  </button>
                )}
                {processors.includes('wipay') && (
                  <button className="btn btn-dark" style={{ width: '100%', marginBottom: 10 }} onClick={() => void handlePay('wipay')} disabled={!!paymentLoading}>
                    {paymentLoading === 'wipay' ? messages.loading.redirecting : messages.publicQuote.payWithWiPay(quote.currency)}
                  </button>
                )}
              </div>
              {paymentError && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{paymentError}</div>}
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {messages.publicQuote.payManually(businessName)}
              </div>
            </>
          )}
        </div>
      )}
      <div className="modal" style={{ maxWidth: 760, margin: '0 auto' }}>
        <div id="quote-content">
          <div className="qp-wrap" style={{ ['--quote-accent']: accent } as React.CSSProperties}>
            <div className="qp-top">
              <div className="freelancer-logo-container" style={{ minWidth: 220, maxWidth: 220 }}>
                {quote.creator?.logo_url ? (
                <>
                  <img
                    src={quote.creator.logo_url}
                    alt={quote.creator?.business_name || ''}
                    className="freelancer-logo"
                    style={{
                      height: isGeneratingPDF ? '64px' : '72px',
                      maxWidth: isGeneratingPDF ? '200px' : '220px',
                      width: 'auto',
                      objectFit: 'contain',
                      display: 'block',
                      marginBottom: 8,
                    }}
                  />
                </>
              ) : quote.creator?.white_label ? (
                <div className="qp-brand" style={{ fontSize: 22, fontWeight: 700 }}>{quote.creator?.business_name || 'Professional Quote'}</div>
              ) : (
                <div className="qp-brand">Quote<span className="qp-accent">Flow</span></div>
              )}
              {(quote.creator?.logo_url || !quote.creator?.white_label) && (
                <div className="qp-biz">{quote.creator?.business_name || 'Professional Quote'}</div>
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
                  ⬇ {messages.publicQuote.downloadPDF}
                </button>
              )}
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
            {!isGeneratingPDF && (
              <div className="qp-valid">{messages.publicQuote.validFor(quote.validity_days)}</div>
            )}
            {!isGeneratingPDF && !accepted && quote.status !== 'accepted' && !isExpired && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', width: '100%', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-outline"
                    onClick={() => setShowChangeRequest(prev => !prev)}
                  >
                    ✏️ {messages.publicQuote.requestChanges}
                  </button>
                  {quote.require_signature && (
                  <div style={{ width: '100%', maxWidth: 320 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--muted)' }}>
                      {messages.publicQuote.signLabel}
                    </label>
                    <input
                      type="text"
                      value={signatureName}
                      onChange={e => setSignatureName(e.target.value)}
                      placeholder={messages.publicQuote.signaturePlaceholder}
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
                    {accepting ? messages.loading.accepting : messages.publicQuote.acceptButtonWithCheck}
                  </button>
                </div>
                {showChangeRequest && (
                  <div style={{ width: '100%', maxWidth: 480, padding: 16, background: 'var(--cream)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--muted)' }}>{messages.publicQuote.changeRequestPrompt}</div>
                    <textarea
                      placeholder={messages.publicQuote.changeRequestPlaceholder}
                      value={changeRequestMsg}
                      onChange={e => setChangeRequestMsg(e.target.value)}
                      rows={4}
                      style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, resize: 'vertical', marginBottom: 10 }}
                    />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => { setShowChangeRequest(false); setChangeRequestMsg(''); }}>{messages.sendModal.cancel}</button>
                      <button
                        className="btn btn-dark btn-sm"
                        onClick={() => void handlePostChangeRequest()}
                        disabled={postingChangeRequest || !changeRequestMsg.trim()}
                      >
                        {postingChangeRequest ? messages.loading.sending : messages.publicQuote.sendRequest}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {isExpired && !accepted && quote.status !== 'accepted' && (
              <div className="expiry-expired-box">
                {messages.publicQuote.expiredMessage(formatDateLong(quote.expires_at), businessName)}
              </div>
            )}
            {(accepted || quote.status === 'accepted') && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>✅ {messages.publicQuote.acceptedStatus}</span>
                {quote.accepted_by_name && (
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{messages.publicQuote.signedBy(quote.accepted_by_name)}</span>
                )}
              </div>
            )}
          </div>

          {/* Notes thread — hidden in PDF */}
          {!isGeneratingPDF && (
          <div className="qp-notes" style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
            <div className="qp-notes-lbl">{messages.publicQuote.questionsNotes}</div>
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
                      borderLeft: '3px solid ' + (n.note_type === 'change_request' ? 'var(--accent)' : n.author_type === 'client' ? 'var(--muted)' : accent),
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {n.note_type === 'change_request' && <span style={{ fontSize: 10, background: 'var(--accent)', color: "#fff", padding: '2px 6px', borderRadius: 4 }}>Change Request</span>}
                      {n.author_name} · {formatDateTime(n.created_at)}
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.5 }}>{n.message}</div>
                  </div>
                ))}
              </div>
            )}
            {!isGeneratingPDF && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  type="text"
                  placeholder={messages.publicQuote.yourNamePlaceholder}
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
                  placeholder={messages.publicQuote.messagePlaceholder}
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
                  {postingNote ? messages.loading.sending : messages.publicQuote.sendMessage}
                </button>
              </div>
            )}
          </div>
          )}
        </div>
        </div>
      </div>
      {!isGeneratingPDF && !quote.creator?.white_label && (
        <div className="powered-by-footer" style={{ textAlign: 'center', padding: '24px 16px', fontSize: 13, color: 'var(--muted)' }}>
          Powered by <a href="https://quoteflow.app" target="_blank" rel="noopener noreferrer" className="powered-by-wordmark" style={{ color: 'var(--accent)', textDecoration: 'none' }}>QuoteFlow</a>
        </div>
      )}
    </div>
  );
}

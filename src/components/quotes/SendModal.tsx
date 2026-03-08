import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { copyToClipboard, formatCurrency, formatDateLong, quotePublicUrl } from '@/lib/utils';
import { messages } from '@/lib/messages';
import type { Quote, SendChannel } from '@/types';

interface Props {
  quoteId: string | null;
  quote?: Quote | null;
  open: boolean;
  onClose: () => void;
  onSend: (id: string, channel: SendChannel, extra?: { email?: string; phone?: string }) => Promise<{ quote_link?: string } | void>;
  /** Pass false to show a warning that no payment processor is connected */
  hasPaymentMethod?: boolean;
}

const CHANNELS: { value: SendChannel; icon: string; title: string; sub: string }[] = [
  { value: 'email',    icon: '📧', title: 'Email',     sub: 'Send to client inbox' },
  { value: 'whatsapp', icon: '💬', title: 'WhatsApp',  sub: 'Send via WhatsApp' },
  { value: 'link',     icon: '🔗', title: 'Copy Link',  sub: 'Share a public link' },
];

/** Strip non-digits; if starts with 0, replace with Jamaica country code 876. */
function normalizePhoneForWaMe(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    return '876' + digits.slice(1);
  }
  return digits;
}

export default function SendModal({ quoteId, quote, open, onClose, onSend, hasPaymentMethod = true }: Props) {
  const [channel,        setChannel]        = useState<SendChannel>('email');
  const [email,          setEmail]          = useState('');
  const [phone,          setPhone]          = useState('');
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [confirmPending, setConfirmPending] = useState(false);

  useEffect(() => {
    if (open && quote?.client) {
      setEmail(quote.client.email || '');
      setPhone(quote.client.phone || '');
    }
    if (!open) { setError(null); setConfirmPending(false); }
  }, [open, quote?.client?.email, quote?.client?.phone]);

  useEffect(() => { setConfirmPending(false); }, [channel]);

  const handleWhatsAppSend = async () => {
    if (!quote?.share_token || !quoteId) return;
    const quoteURL = quotePublicUrl(quote.share_token);
    const clientName = quote.client?.name || 'there';
    const formattedTotal = formatCurrency(quote.total, quote.currency);
    const formattedExpiry = formatDateLong(quote.expires_at);
    const message = encodeURIComponent(
      messages.whatsapp.quoteMessage({
        clientName,
        quoteTitle: quote.title,
        total: formattedTotal,
        expiryDate: formattedExpiry,
        quoteURL,
      })
    );
    const normalizedPhone = normalizePhoneForWaMe(phone);
    const waURL = normalizedPhone
      ? `https://wa.me/${normalizedPhone}?text=${message}`
      : `https://wa.me/?text=${message}`;
    window.open(waURL, '_blank');
    // Mark quote as sent in the backend (fire-and-forget — WA already opened)
    try {
      await onSend(quoteId, 'whatsapp', { phone: normalizedPhone || undefined });
    } catch {
      // Don't surface error — the WhatsApp message is already open
    }
    onClose();
  };

  const proceedWithSend = async () => {
    if (!quoteId) return;
    if (channel === 'whatsapp') {
      void handleWhatsAppSend();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await onSend(quoteId, channel, { email: email || undefined, phone: phone || undefined });
      if (channel === 'link' && result?.quote_link) {
        await copyToClipboard(result.quote_link);
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : messages.toast.failedToSend);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (!hasPaymentMethod && !confirmPending) {
      setConfirmPending(true);
      return;
    }
    void proceedWithSend();
  };

  const sendViaLabel = channel === 'link' ? messages.sendModal.link : channel === 'email' ? messages.sendModal.email : messages.sendModal.whatsapp;

  return (
    <Modal open={open} onClose={onClose} maxWidth={500}>
      <div className="modal-inner">
        <div className="modal-title">{messages.sendModal.title}</div>
        <div className="modal-sub">{messages.sendModal.sub}</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
          {CHANNELS.map(c => (
            <div
              key={c.value}
              className={`send-option${channel === c.value ? ' selected' : ''}`}
              onClick={() => setChannel(c.value)}
            >
              <div className="send-option-icon">{c.icon}</div>
              <div className="send-option-title">{c.title}</div>
              <div className="send-option-sub">{c.sub}</div>
            </div>
          ))}
        </div>

        {channel === 'email' && (
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>{messages.sendModal.emailLabel}</label>
            <input type="email" placeholder={messages.sendModal.emailPlaceholder} value={email} onChange={e => setEmail(e.target.value)} />
          </div>
        )}
        {channel === 'whatsapp' && (
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>{messages.sendModal.whatsappLabel}</label>
            <input type="tel" placeholder={messages.sendModal.whatsappPlaceholder} value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
        )}
        {channel === 'link' && (
          <div style={{ background: 'var(--cream)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
            {messages.sendModal.linkDescription}
          </div>
        )}

        {!hasPaymentMethod && (
          <div style={{ background: 'rgba(232,162,47,.1)', border: '1px solid rgba(232,162,47,.35)', borderRadius: 10, padding: 12, fontSize: 13, color: 'var(--warning, #b45309)', marginBottom: 16 }}>
            ⚠️ No payment method connected. Your client won't be able to pay through this quote. You can still send it — or{' '}
            <a href="/app/settings?panel=payments" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', fontWeight: 600 }}>
              connect a payment method
            </a>{' '}first.
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(232,64,64,.08)', border: '1px solid rgba(232,64,64,.2)', borderRadius: 10, padding: 12, fontSize: 13, color: 'var(--danger)', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {confirmPending ? (
          <div style={{ background: 'rgba(234,179,8,.08)', border: '1px solid rgba(234,179,8,.3)', borderRadius: 10, padding: '14px 16px' }}>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--text-primary)' }}>⚠️ Your client won't be able to pay online.</strong>
              {' '}No payment method is connected. Do you still want to send this quote?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setConfirmPending(false)}>
                Go Back
              </button>
              <button className="btn btn-warning btn-sm" onClick={() => void proceedWithSend()} disabled={loading}>
                {loading ? messages.loading.sending : 'Send Anyway'}
              </button>
            </div>
          </div>
        ) : (
          <div className="modal-foot">
            <button className="btn btn-outline" onClick={onClose}>{messages.sendModal.cancel}</button>
            <button className="btn btn-success" onClick={handleSend} disabled={loading}>
              {loading ? messages.loading.sending : messages.sendModal.sendVia(sendViaLabel)}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

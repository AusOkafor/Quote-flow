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

export default function SendModal({ quoteId, quote, open, onClose, onSend }: Props) {
  const [channel,  setChannel]  = useState<SendChannel>('email');
  const [email,    setEmail]    = useState('');
  const [phone,    setPhone]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    if (open && quote?.client) {
      setEmail(quote.client.email || '');
      setPhone(quote.client.phone || '');
    }
    if (!open) setError(null);
  }, [open, quote?.client?.email, quote?.client?.phone]);

  const handleWhatsAppSend = () => {
    if (!quote?.share_token) return;
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
    onClose();
  };

  const handleSend = async () => {
    if (!quoteId) return;
    if (channel === 'whatsapp') {
      handleWhatsAppSend();
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

        {error && (
          <div style={{ background: 'rgba(232,64,64,.08)', border: '1px solid rgba(232,64,64,.2)', borderRadius: 10, padding: 12, fontSize: 13, color: 'var(--danger)', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div className="modal-foot">
          <button className="btn btn-outline" onClick={onClose}>{messages.sendModal.cancel}</button>
          <button className="btn btn-success" onClick={() => void handleSend()} disabled={loading}>
            {loading ? messages.loading.sending : messages.sendModal.sendVia(sendViaLabel)}
          </button>
        </div>
      </div>
    </Modal>
  );
}

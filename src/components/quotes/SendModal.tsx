import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { copyToClipboard } from '@/lib/utils';
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

  const handleSend = async () => {
    if (!quoteId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await onSend(quoteId, channel, { email: email || undefined, phone: phone || undefined });
      if (channel === 'link' && result?.quote_link) {
        await copyToClipboard(result.quote_link);
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth={500}>
      <div className="modal-inner">
        <div className="modal-title">Send Quote</div>
        <div className="modal-sub">Choose how to deliver this quote to your client.</div>

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
            <label>Recipient Email</label>
            <input type="email" placeholder="client@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
        )}
        {channel === 'whatsapp' && (
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>WhatsApp Number</label>
            <input type="tel" placeholder="+1 (876) 555-0100" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
        )}
        {channel === 'link' && (
          <div style={{ background: 'var(--cream)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
            A shareable link will be generated and copied to your clipboard. Your client can open it in any browser — no sign-in required.
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(232,64,64,.08)', border: '1px solid rgba(232,64,64,.2)', borderRadius: 10, padding: 12, fontSize: 13, color: 'var(--danger)', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div className="modal-foot">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-success" onClick={() => void handleSend()} disabled={loading}>
            {loading ? 'Sending…' : `Send via ${channel === 'link' ? 'Link' : channel === 'email' ? 'Email' : 'WhatsApp'} →`}
          </button>
        </div>
      </div>
    </Modal>
  );
}

import { useNavigate } from 'react-router-dom';
import Modal from '@/components/ui/Modal';
import { messages } from '@/lib/messages';

interface Props {
  open: boolean;
  onClose: () => void;
  variant?: 'limit' | 'pro';
}

const FREE_LIMIT = 3;

export default function UpgradeLimitModal({ open, onClose, variant = 'limit' }: Props) {
  const navigate = useNavigate();
  const isPro = variant === 'pro';

  return (
    <Modal open={open} onClose={onClose} maxWidth={420}>
      <div style={{ padding: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 16, lineHeight: 1 }}>{isPro ? '✨' : '📊'}</div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
          {isPro ? messages.freeTier.proFeatureTitle : messages.freeTier.limitReachedTitle}
        </h2>
        <p style={{ margin: '16px 0 24px', fontSize: 15, lineHeight: 1.6, color: 'var(--muted)' }}>
          {isPro
            ? messages.freeTier.proFeatureDesc
            : messages.freeTier.limitReachedDesc(FREE_LIMIT)}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            className="btn btn-dark"
            onClick={() => {
              onClose();
              navigate('/app/settings?panel=billing');
            }}
          >
            {isPro ? messages.freeTier.ctaButton : messages.freeTier.goToSettings}
          </button>
          <button className="btn btn-outline" onClick={onClose}>
            {messages.freeTier.close}
          </button>
        </div>
      </div>
    </Modal>
  );
}

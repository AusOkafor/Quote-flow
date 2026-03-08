import type { ToastItem } from '@/hooks/useToast';

const ICONS = { success: '✅', info: 'ℹ️', warning: '⚠️', default: '💬' };

interface Props {
  toasts: ToastItem[];
  dismiss: (id: number) => void;
}

export default function ToastContainer({ toasts, dismiss }: Props) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          style={{ cursor: t.action ? 'default' : 'pointer' }}
          onClick={t.action ? undefined : () => dismiss(t.id)}
        >
          <span>{ICONS[t.type] ?? ICONS.default}</span>
          <span style={{ flex: 1 }}>{t.message}</span>
          {t.action && (
            <button
              onClick={() => { t.action!.onClick(); dismiss(t.id); }}
              style={{
                marginLeft: 12,
                padding: '4px 12px',
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {t.action.label}
            </button>
          )}
          <button
            onClick={() => dismiss(t.id)}
            style={{
              marginLeft: t.action ? 6 : 12,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              opacity: 0.5,
              padding: '0 2px',
              color: 'inherit',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

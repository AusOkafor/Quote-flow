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
          onClick={() => dismiss(t.id)}
          style={{ cursor: 'pointer' }}
        >
          <span>{ICONS[t.type] ?? ICONS.default}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

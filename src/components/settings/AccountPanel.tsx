import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '@/components/ui/Modal';
import { userApi } from '@/services/api';
import { supabase } from '@/lib/supabase';
import { useAppToast } from '@/components/layout/ToastProvider';

export default function AccountPanel() {
  const navigate = useNavigate();
  const toast = useAppToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText.toLowerCase() !== 'delete') return;
    setDeleting(true);
    try {
      await userApi.deleteAccount();
      await supabase.auth.signOut();
      toast('Account deleted', 'info');
      navigate('/', { replace: true });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to delete account', 'warning');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="sp-title">Account</div>
      <div className="sp-sub">Manage your account and data.</div>
      <div style={{
        marginTop: 24,
        padding: 24,
        background: 'rgba(220, 53, 69, 0.08)',
        border: '1px solid rgba(220, 53, 69, 0.25)',
        borderRadius: 14,
      }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--danger)', marginBottom: 8 }}>
          Delete account
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
          Permanently delete your account and all your data (clients, quotes, settings). This cannot be undone.
        </div>
        <button
          className="btn"
          style={{
            background: 'var(--danger)',
            color: 'white',
            border: 'none',
          }}
          onClick={() => setShowConfirm(true)}
        >
          Delete my account
        </button>
      </div>

      <Modal open={showConfirm} onClose={() => !deleting && setShowConfirm(false)} maxWidth={440}>
        <div className="modal-inner">
          <div className="modal-title" style={{ color: 'var(--danger)' }}>Delete account?</div>
          <div className="modal-sub" style={{ marginBottom: 16 }}>
            This will permanently remove your account and all data. Type <strong>delete</strong> to confirm.
          </div>
          <input
            type="text"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder="Type delete to confirm"
            style={{
              width: '100%',
              padding: 12,
              marginBottom: 20,
              borderRadius: 8,
              border: '1px solid var(--border)',
              fontSize: 14,
            }}
          />
          <div className="modal-foot">
            <button className="btn btn-outline" onClick={() => setShowConfirm(false)} disabled={deleting}>
              Cancel
            </button>
            <button
              className="btn"
              style={{
                background: 'var(--danger)',
                color: 'white',
                border: 'none',
              }}
              onClick={() => void handleDelete()}
              disabled={confirmText.toLowerCase() !== 'delete' || deleting}
            >
              {deleting ? 'Deleting…' : 'Delete account'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

import React from 'react';
import Modal from '@/components/ui/Modal';
import type { Client } from '@/types';

interface Props {
  open: boolean;
  client: Client | null;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export default function DeleteClientModal({ open, client, onClose, onConfirm, loading }: Props) {
  if (!client) return null;

  return (
    <Modal open={open} onClose={onClose} maxWidth={420}>
      <div className="modal-inner">
        <div className="modal-title" style={{ color: 'var(--gold)' }}>Delete client?</div>
        <div className="modal-sub" style={{ marginBottom: 20 }}>
          Remove <strong>{client.name}</strong>? This will fail if they have quotes — delete their quotes first.
        </div>
        <div className="modal-foot">
          <button className="btn btn-outline" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="btn"
            style={{ background: 'var(--danger)', color: 'white', border: 'none' }}
            onClick={() => void onConfirm()}
            disabled={loading}
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

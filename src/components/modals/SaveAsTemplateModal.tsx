import { useState } from 'react';
import Modal from '@/components/ui/Modal';

interface Props {
  open: boolean;
  quoteTitle?: string;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
}

export default function SaveAsTemplateModal({ open, quoteTitle, onClose, onSave }: Props) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim());
      setName('');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} maxWidth={400}>
      <div className="modal-inner">
        <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Save as Template</h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--muted)' }}>
          {quoteTitle ? `Save "${quoteTitle}" as a reusable template.` : 'Save this quote as a reusable template.'}
        </p>
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label>Template name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Brand Identity Package"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && void handleSave()}
          />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-dark" onClick={() => void handleSave()} disabled={saving || !name.trim()}>
            {saving ? 'Saving…' : 'Save Template'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

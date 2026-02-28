import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import type { CreateClientRequest } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateClientRequest) => Promise<void>;
  onError?: (message: string) => void;
}

const EMPTY: CreateClientRequest = {
  name: '', company: '', email: '', phone: '', address: '', notes: '',
};

export default function AddClientModal({ open, onClose, onSave, onError }: Props) {
  const [form, setForm]     = useState<CreateClientRequest>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState<Partial<CreateClientRequest>>({});

  const set = (key: keyof CreateClientRequest, val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const validate = (): boolean => {
    const errs: Partial<CreateClientRequest> = {};
    if (!form.name.trim())  errs.name  = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await onSave(form);
      setForm(EMPTY);
      setErrors({});
      onClose();
    } catch (e) {
      onError?.(e instanceof Error ? e.message : 'Failed to add client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth={560}>
      <div className="modal-inner">
        <div className="modal-title">Add New Client</div>
        <div className="modal-sub">Save a client to reuse their details across quotes.</div>

        <div className="form-grid">
          <div className="form-group">
            <label>Full Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Simone Richards" />
            {errors.name && <span style={{ color: 'var(--danger)', fontSize: 11 }}>{errors.name}</span>}
          </div>
          <div className="form-group">
            <label>Company</label>
            <input value={form.company} onChange={e => set('company', e.target.value)} placeholder="Richards Design Co." />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="simone@gmail.com" />
            {errors.email && <span style={{ color: 'var(--danger)', fontSize: 11 }}>{errors.email}</span>}
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 (876) 555-0100" />
          </div>
          <div className="form-group form-full">
            <label>Address</label>
            <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Kingston 10, Jamaica" />
          </div>
          <div className="form-group form-full">
            <label>Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Prefers WhatsApp, budget-conscious…" style={{ minHeight: 72 }} />
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-dark" onClick={() => void handleSave()} disabled={loading}>
            {loading ? 'Saving…' : 'Add Client'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

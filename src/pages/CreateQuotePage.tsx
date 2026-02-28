import { useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar             from '@/components/layout/Topbar';
import Toggle             from '@/components/ui/Toggle';
import LineItemsEditor    from '@/components/quotes/LineItemsEditor';
import UpgradeLimitModal  from '@/components/modals/UpgradeLimitModal';
import { useClients }     from '@/hooks/useClients';
import { quotesApi, isFreeTierLimitError } from '@/services/api';
import { useAppToast }    from '@/components/layout/AppShell';
import { calcTotals }     from '@/lib/utils';
import type { LineItemInput, Currency } from '@/types';

const STEPS = ['Client Info', 'Line Items', 'Terms & Notes', 'Review & Send'];

interface FormState {
  client_id: string;
  title: string;
  currency: Currency;
  validity_days: number;
  notes: string;
  deposit: string;
  payment_method: string;
  delivery_timeline: string;
  revisions: string;
  tax_exempt: boolean;
  tax_rate: number;
  require_signature: boolean;
  track_views: boolean;
  send_reminder: boolean;
}

export default function CreateQuotePage() {
  const navigate  = useNavigate();
  const toast     = useAppToast();
  const { clients }  = useClients();

  const [step, setStep]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [items, setItems]         = useState<LineItemInput[]>([{ description: '', quantity: 1, unit_price: 0 }]);
  const [form, setForm]       = useState<FormState>({
    client_id: '', title: '', currency: 'JMD',
    validity_days: 14, notes: '', deposit: '50% upfront',
    payment_method: 'Bank Transfer', delivery_timeline: '10 business days',
    revisions: '2 rounds', tax_exempt: true, tax_rate: 15,
    require_signature: true, track_views: true, send_reminder: false,
  });

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const { subtotal, total } = calcTotals(items, form.tax_rate, form.tax_exempt);

  const client = clients.find(c => c.id === form.client_id);

  const handleSend = async () => {
    setLoading(true);
    try {
      await quotesApi.create({ ...form, line_items: items });
      toast('✅ Quote created!', 'success');
      navigate('/app/quotes');
    } catch (e) {
      if (isFreeTierLimitError(e)) {
        setShowUpgradeModal(true);
      } else {
        toast(e instanceof Error ? e.message : 'Failed to create quote', 'warning');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Topbar
        title="New Quote"
        actions={
          <>
            <button className="btn btn-outline" onClick={() => toast('Draft saved', 'info')}>Save Draft</button>
            <button className="btn btn-ghost" onClick={() => navigate('/app/quotes')}>Cancel</button>
          </>
        }
      />
      <div className="page-body">
        <div className="flow-wrap">
          {/* Stepper */}
          <div className="stepper">
            {STEPS.map((label, i) => {
              const n = i + 1;
              const state = n < step ? 's-done' : n === step ? 's-active' : 's-pending';
              return (
                <Fragment key={label}>
                  <div className="step-item">
                    <div className={`step-circle ${state}`}>{n < step ? '✓' : n}</div>
                    <div className="step-text">
                      <div className={`step-name${n === step ? ' active' : ''}`}>{label}</div>
                    </div>
                  </div>
                  {i < STEPS.length - 1 && <div className={`step-line${n < step ? ' done' : ''}`} />}
                </Fragment>
              );
            })}
          </div>

          {/* Step 1: Client Info */}
          {step === 1 && (
            <div className="flow-card">
              <div className="flow-title">Who is this quote for?</div>
              <div className="flow-sub">Select an existing client or enter details manually.</div>
              <div className="form-grid">
                <div className="form-group form-full">
                  <label>Select Client</label>
                  <select value={form.client_id} onChange={e => set('client_id', e.target.value)}>
                    <option value="">— Choose client —</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>)}
                  </select>
                </div>
                <div className="form-group form-full">
                  <label>Quote Title / Project</label>
                  <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Brand Identity Design — March 2026" />
                </div>
                <div className="form-group">
                  <label>Currency</label>
                  <select value={form.currency} onChange={e => set('currency', e.target.value as Currency)}>
                    {(['JMD','USD','TTD','BBD'] as Currency[]).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Validity (days)</label>
                  <input type="number" min={1} max={365} value={form.validity_days} onChange={e => set('validity_days', parseInt(e.target.value))} />
                </div>
              </div>
              <div className="flow-foot">
                <div />
                <button className="btn btn-dark" onClick={() => setStep(2)} disabled={!form.client_id || !form.title}>
                  Next: Add Services →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Line Items */}
          {step === 2 && (
            <div className="flow-card">
              <div className="flow-title">What services are you quoting?</div>
              <div className="flow-sub">Add each service or deliverable as a line item.</div>
              <LineItemsEditor
                items={items}
                onChange={setItems}
                currency={form.currency}
                taxRate={form.tax_rate}
                taxExempt={form.tax_exempt}
              />
              <div className="flow-foot">
                <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-dark" onClick={() => setStep(3)}>Next: Terms &amp; Notes →</button>
              </div>
            </div>
          )}

          {/* Step 3: Terms */}
          {step === 3 && (
            <div className="flow-card">
              <div className="flow-title">Terms &amp; conditions</div>
              <div className="flow-sub">Set payment terms, delivery, and extra options.</div>
              <div className="terms-grid">
                <div className="form-group">
                  <label>Deposit Required</label>
                  <select value={form.deposit} onChange={e => set('deposit', e.target.value)}>
                    {['50% upfront','100% upfront','30% deposit','No deposit'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
                    {['Bank Transfer','Cash','Cheque','PayPal','Stripe','Crypto'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Delivery Timeline</label>
                  <input value={form.delivery_timeline} onChange={e => set('delivery_timeline', e.target.value)} placeholder="10 business days" />
                </div>
                <div className="form-group">
                  <label>Revisions</label>
                  <input value={form.revisions} onChange={e => set('revisions', e.target.value)} placeholder="2 rounds" />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label>Notes / Scope</label>
                  <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Files delivered via Google Drive upon final payment." />
                </div>
              </div>
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { key: 'tax_exempt'         as const, label: 'GCT Exempt',          sub: 'No tax applied to this quote' },
                  { key: 'require_signature'  as const, label: 'Require Signature',    sub: 'Client must sign to accept' },
                  { key: 'track_views'        as const, label: 'Track Views',          sub: 'Get notified when client opens' },
                  { key: 'send_reminder'      as const, label: 'Send Reminder',        sub: 'Auto-remind 3 days before expiry' },
                ].map(item => (
                  <div key={item.key} className="toggle-row">
                    <div>
                      <div className="toggle-label">{item.label}</div>
                      <div className="toggle-sub">{item.sub}</div>
                    </div>
                    <Toggle checked={!!form[item.key]} onChange={v => set(item.key, v as FormState[typeof item.key])} />
                  </div>
                ))}
              </div>
              <div className="flow-foot">
                <button className="btn btn-outline" onClick={() => setStep(2)}>← Back</button>
                <button className="btn btn-dark" onClick={() => setStep(4)}>Next: Review &amp; Send →</button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="flow-card">
              <div className="flow-title">Review &amp; Send</div>
              <div className="flow-sub">Everything looks good? Send your quote.</div>

              <div className="review-section">
                <div className="review-section-title">Quote Summary</div>
                <div className="review-grid">
                  <div className="review-item"><div className="review-item-label">Client</div><div className="review-item-val">{client?.name ?? '—'}</div></div>
                  <div className="review-item"><div className="review-item-label">Project</div><div className="review-item-val">{form.title}</div></div>
                  <div className="review-item"><div className="review-item-label">Subtotal</div><div className="review-item-val">{form.currency} {subtotal.toLocaleString()}</div></div>
                  <div className="review-item"><div className="review-item-label">Total</div><div className="review-item-val" style={{ color: 'var(--accent)', fontFamily: 'Syne' }}>{form.currency} {total.toLocaleString()}</div></div>
                  <div className="review-item"><div className="review-item-label">Deposit</div><div className="review-item-val">{form.deposit}</div></div>
                  <div className="review-item"><div className="review-item-label">Valid For</div><div className="review-item-val">{form.validity_days} days</div></div>
                </div>
              </div>

              <div className="flow-foot">
                <button className="btn btn-outline" onClick={() => setStep(3)}>← Back</button>
                <button className="btn btn-success" onClick={() => void handleSend()} disabled={loading}>
                  {loading ? 'Creating…' : 'Create Quote ✓'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <UpgradeLimitModal open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </>
  );
}

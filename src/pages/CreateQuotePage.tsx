import { useState, Fragment, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Topbar             from '@/components/layout/Topbar';
import Toggle             from '@/components/ui/Toggle';
import LineItemsEditor    from '@/components/quotes/LineItemsEditor';
import UpgradeLimitModal  from '@/components/modals/UpgradeLimitModal';
import { useClients }     from '@/hooks/useClients';
import { useProfile }     from '@/hooks/useProfile';
import { quotesApi, templatesApi, isFreeTierLimitError, isProRequiredError } from '@/services/api';
import { useAppToast }    from '@/components/layout/ToastProvider';
import { calcTotals, copyToClipboard } from '@/lib/utils';
import type { LineItemInput, Currency, QuoteTemplate, QuoteWithDetails } from '@/types';

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
  const { id: editId } = useParams<{ id: string }>();
  const toast     = useAppToast();
  const { clients }  = useClients();
  const { profile }  = useProfile();
  const isEdit = !!editId;
  const isPro = profile?.plan === 'pro' || profile?.plan === 'business';

  const [step, setStep]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState<'limit' | 'pro' | null>(null);
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [items, setItems]         = useState<LineItemInput[]>([{ description: '', quantity: 1, unit_price: 0 }]);
  const [savedQuote, setSavedQuote] = useState<QuoteWithDetails | null>(null);
  const [form, setForm]       = useState<FormState>({
    client_id: '', title: '', currency: 'JMD',
    validity_days: 14, notes: '', deposit: '50% upfront',
    payment_method: 'Bank Transfer', delivery_timeline: '10 business days',
    revisions: '2 rounds', tax_exempt: true, tax_rate: 15,
    require_signature: true, track_views: true, send_reminder: false,
  });

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  useEffect(() => {
    templatesApi.list().then(setTemplates).catch(() => {});
  }, []);

  useEffect(() => {
    if (profile && !isPro && form.track_views) setForm(prev => ({ ...prev, track_views: false }));
  }, [profile?.plan]);

  useEffect(() => {
    if (!editId) return;
    setLoadingQuote(true);
    quotesApi.get(editId)
      .then(q => {
        if (q.status !== 'draft') {
          toast('Only draft quotes can be edited.', 'warning');
          navigate('/app/quotes');
          return;
        }
        setForm({
          client_id: q.client_id,
          title: q.title,
          currency: q.currency as Currency,
          validity_days: q.validity_days,
          notes: q.notes ?? '',
          deposit: q.deposit ?? '50% upfront',
          payment_method: q.payment_method ?? 'Bank Transfer',
          delivery_timeline: q.delivery_timeline ?? '10 business days',
          revisions: q.revisions ?? '2 rounds',
          tax_exempt: q.tax_exempt,
          tax_rate: q.tax_rate,
          require_signature: q.require_signature,
          track_views: q.track_views,
          send_reminder: q.send_reminder,
        });
        setItems((q.line_items && q.line_items.length > 0)
          ? q.line_items.map(li => ({ description: li.description, quantity: li.quantity, unit_price: li.unit_price }))
          : [{ description: '', quantity: 1, unit_price: 0 }]);
      })
      .catch(() => {
        toast('Quote not found.', 'warning');
        navigate('/app/quotes');
      })
      .finally(() => setLoadingQuote(false));
  }, [editId, navigate, toast]);

  const applyTemplate = (tpl: QuoteTemplate) => {
    setForm(prev => ({
      ...prev,
      title: tpl.title || prev.title,
      currency: tpl.currency as Currency,
      validity_days: tpl.validity_days,
      notes: tpl.notes,
      deposit: tpl.deposit,
      payment_method: tpl.payment_method,
      delivery_timeline: tpl.delivery_timeline,
      revisions: tpl.revisions,
      tax_exempt: tpl.tax_exempt,
      tax_rate: tpl.tax_rate,
      require_signature: tpl.require_signature,
      track_views: tpl.track_views,
      send_reminder: tpl.send_reminder,
    }));
    if (tpl.line_items && tpl.line_items.length > 0) {
      setItems(tpl.line_items.map(li => ({
        description: li.description,
        quantity: li.quantity,
        unit_price: li.unit_price,
      })));
    }
  };

  const { subtotal, total } = calcTotals(items, form.tax_rate, form.tax_exempt);

  const client = clients.find(c => c.id === form.client_id);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (isEdit && editId) {
        const updated = await quotesApi.update(editId, {
          title: form.title,
          currency: form.currency,
          validity_days: form.validity_days,
          notes: form.notes,
          deposit: form.deposit,
          payment_method: form.payment_method,
          delivery_timeline: form.delivery_timeline,
          revisions: form.revisions,
          tax_exempt: form.tax_exempt,
          tax_rate: form.tax_rate,
          require_signature: form.require_signature,
          track_views: form.track_views,
          send_reminder: form.send_reminder,
          line_items: items,
        });
        setSavedQuote(updated);
        toast('✅ Quote updated!', 'success');
      } else {
        await quotesApi.create({ ...form, line_items: items });
        toast('✅ Quote created!', 'success');
        navigate('/app/quotes');
      }
    } catch (e) {
      if (isFreeTierLimitError(e)) {
        setShowUpgradeModal('limit');
      } else if (isProRequiredError(e)) {
        setShowUpgradeModal('pro');
      } else {
        toast(e instanceof Error ? e.message : 'Failed to save quote', 'warning');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (channel: 'email' | 'link') => {
    if (!editId || !savedQuote) return;
    try {
      const res = await quotesApi.send(editId, {
        channel,
        recipient_email: channel === 'email' ? savedQuote.client?.email : undefined,
      });
      if (channel === 'link' && res.quote_link) {
        await copyToClipboard(res.quote_link);
        toast('🔗 Link copied!', 'success');
      } else if (channel === 'email') {
        toast('✅ Quote sent via email!', 'success');
      }
      setSavedQuote(null);
      navigate('/app/quotes');
    } catch {
      toast('Failed to send quote.', 'warning');
    }
  };

  if (isEdit && loadingQuote) {
    return (
      <>
        <Topbar title="Edit Quote" actions={<button className="btn btn-ghost" onClick={() => navigate('/app/quotes')}>Cancel</button>} />
        <div className="page-body" style={{ textAlign: 'center', padding: 80, color: 'var(--muted)' }}>Loading quote…</div>
      </>
    );
  }

  return (
    <>
      <Topbar
        title={isEdit ? 'Edit Quote' : 'New Quote'}
        actions={
          <>
            {!isEdit && <button className="btn btn-outline" onClick={() => toast('Draft saved', 'info')}>Save Draft</button>}
            <button className="btn btn-ghost" onClick={() => navigate('/app/quotes')}>Cancel</button>
          </>
        }
      />
      <div className="page-body">
      {savedQuote && (
        <div style={{ marginBottom: 20, padding: 20, background: 'rgba(45,171,111,.1)', border: '1px solid var(--success)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontWeight: 600, color: 'var(--success)' }}>Quote updated. Re-send to {savedQuote.client?.name ?? 'client'}?</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-success btn-sm" onClick={() => void handleResend('email')}>📧 Send via Email</button>
            <button className="btn btn-outline btn-sm" onClick={() => void handleResend('link')}>🔗 Copy Link</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setSavedQuote(null); navigate('/app/quotes'); }}>Done</button>
          </div>
        </div>
      )}
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
              {!isEdit && templates.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>Start from Template</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {templates.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => applyTemplate(t)}
                      >
                        📄 {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
                  { key: 'tax_exempt'         as const, label: 'GCT Exempt',          sub: 'No tax applied to this quote', pro: false },
                  { key: 'require_signature'  as const, label: 'Require Signature',    sub: 'Client must sign to accept', pro: false },
                  { key: 'track_views'        as const, label: 'Track Views',          sub: isPro ? 'Get notified when client opens' : 'Pro feature — Upgrade to enable', pro: true },
                  { key: 'send_reminder'      as const, label: 'Send Reminder',        sub: 'Auto-remind 3 days before expiry', pro: false },
                ].map(item => (
                  <div key={item.key} className="toggle-row">
                    <div>
                      <div className="toggle-label">{item.label}</div>
                      <div className="toggle-sub">{item.sub}</div>
                    </div>
                    <Toggle
                      checked={!!form[item.key]}
                      onChange={v => set(item.key, v as FormState[typeof item.key])}
                      disabled={item.pro && !isPro}
                    />
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
              <div className="flow-title">{isEdit ? 'Review &amp; Save' : 'Review &amp; Send'}</div>
              <div className="flow-sub">{isEdit ? 'Review your changes and save.' : 'Everything looks good? Send your quote.'}</div>

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
                <button className="btn btn-success" onClick={() => void handleSave()} disabled={loading}>
                  {loading ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save Changes ✓' : 'Create Quote ✓')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <UpgradeLimitModal open={!!showUpgradeModal} onClose={() => setShowUpgradeModal(null)} variant={showUpgradeModal ?? 'limit'} />
    </>
  );
}

import { useState, Fragment, useEffect, useRef } from 'react';
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
import { messages } from '@/lib/messages';
import type { LineItemInput, Currency, QuoteTemplate, QuoteWithDetails } from '@/types';

const STEPS = [...messages.createQuote.steps];

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
  const [isDirty, setIsDirty]     = useState(false);
  const profileDefaultsApplied    = useRef(false);
  const [form, setForm]       = useState<FormState>({
    client_id: '', title: '', currency: 'JMD',
    validity_days: 14, notes: '', deposit: '50% upfront',
    payment_method: 'Bank Transfer', delivery_timeline: '10 business days',
    revisions: '2 rounds', tax_exempt: true, tax_rate: 15,
    require_signature: true, track_views: true, send_reminder: false,
  });

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (!isEdit) setIsDirty(true);
  };

  useEffect(() => {
    templatesApi.list().then(setTemplates).catch(() => {});
  }, []);

  // Auto-save draft 30s after last change (new quotes only)
  useEffect(() => {
    if (!isDirty || isEdit) return;
    const timer = setTimeout(async () => {
      if (!form.client_id || !form.title) return;
      try {
        await quotesApi.create({ ...form, line_items: items });
        setIsDirty(false);
        toast(messages.createQuote.draftSaved, 'info');
      } catch {
        // Silent — don't interrupt the user
      }
    }, 30000);
    return () => clearTimeout(timer);
  }, [form, items, isDirty, isEdit]);

  // Apply profile defaults once when profile loads for a new quote
  useEffect(() => {
    if (!profile || isEdit || profileDefaultsApplied.current) return;
    profileDefaultsApplied.current = true;
    // tax_exempt_default can be null in DB for older profiles — treat null as true (exempt by default)
    const taxExemptDefault = (profile.tax_exempt_default as boolean | null) !== null
      ? profile.tax_exempt_default
      : true;
    setForm(prev => ({
      ...prev,
      currency:          (profile.default_currency as FormState['currency']) || prev.currency,
      validity_days:     profile.default_validity_days || prev.validity_days,
      deposit:           profile.default_deposit       || prev.deposit,
      payment_method:    profile.default_payment       || prev.payment_method,
      delivery_timeline: prev.delivery_timeline,
      revisions:         profile.default_revisions     || prev.revisions,
      notes:             profile.default_notes         || prev.notes,
      tax_rate:          profile.tax_rate               ?? prev.tax_rate,
      tax_exempt:        taxExemptDefault,
    }));
  }, [profile, isEdit]);

  useEffect(() => {
    if (profile && !isPro && form.track_views) setForm(prev => ({ ...prev, track_views: false }));
  }, [profile?.plan]);

  useEffect(() => {
    if (!editId) return;
    setLoadingQuote(true);
    quotesApi.get(editId)
      .then(q => {
        if (q.status !== 'draft') {
          toast(messages.createQuote.onlyDraftEditable, 'warning');
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
        toast(messages.createQuote.quoteNotFound, 'warning');
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
        toast(messages.createQuote.quoteUpdated, 'success');
      } else {
        await quotesApi.create({ ...form, line_items: items });
        toast(messages.createQuote.quoteCreated, 'success');
        navigate('/app/quotes');
      }
    } catch (e) {
      if (isFreeTierLimitError(e)) {
        setShowUpgradeModal('limit');
      } else if (isProRequiredError(e)) {
        setShowUpgradeModal('pro');
      } else {
        toast(e instanceof Error ? e.message : messages.createQuote.failedToSave, 'warning');
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
        toast(messages.createQuote.linkCopied, 'success');
      } else if (channel === 'email') {
        toast(messages.createQuote.quoteSentEmail, 'success');
      }
      setSavedQuote(null);
      navigate('/app/quotes');
    } catch {
      toast(messages.createQuote.failedToSend, 'warning');
    }
  };

  if (isEdit && loadingQuote) {
    return (
      <>
        <Topbar title={messages.createQuote.editTitle} actions={<button className="btn btn-ghost" onClick={() => navigate('/app/quotes')}>{messages.createQuote.cancel}</button>} />
        <div className="page-body" style={{ textAlign: 'center', padding: 80, color: 'var(--muted)' }}>{messages.createQuote.loadingQuote}</div>
      </>
    );
  }

  return (
    <>
      <Topbar
        title={isEdit ? messages.createQuote.editTitle : messages.createQuote.newTitle}
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => navigate('/app/quotes')}>{messages.createQuote.cancel}</button>
          </>
        }
      />
      <div className="page-body">
      {savedQuote && (
        <div style={{ marginBottom: 20, padding: 20, background: 'rgba(45,171,111,.1)', border: '1px solid var(--success)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontWeight: 600, color: 'var(--success)' }}>{messages.createQuote.resendPrompt(savedQuote.client?.name ?? 'client')}</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-success btn-sm" onClick={() => void handleResend('email')}>{messages.createQuote.sendViaEmail}</button>
            <button className="btn btn-outline btn-sm" onClick={() => void handleResend('link')}>{messages.createQuote.copyLink}</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setSavedQuote(null); navigate('/app/quotes'); }}>{messages.createQuote.done}</button>
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
              <div className="flow-title">{messages.createQuote.whoIsQuoteFor}</div>
              <div className="flow-sub">{messages.createQuote.selectClientOrEnter}</div>
              {!isEdit && templates.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>{messages.createQuote.startFromTemplate}</div>
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
                  <label>{messages.createQuote.selectClient}</label>
                  <select value={form.client_id} onChange={e => set('client_id', e.target.value)}>
                    <option value="">{messages.createQuote.chooseClient}</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>)}
                  </select>
                </div>
                <div className="form-group form-full">
                  <label>{messages.createQuote.quoteTitle}</label>
                  <input value={form.title} onChange={e => set('title', e.target.value)} placeholder={messages.createQuote.quoteTitlePlaceholder} />
                </div>
                <div className="form-group">
                  <label>{messages.createQuote.currency}</label>
                  <select value={form.currency} onChange={e => set('currency', e.target.value as Currency)}>
                    {(['JMD','USD','TTD','BBD'] as Currency[]).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>{messages.createQuote.validityDays}</label>
                  <input type="number" min={1} max={365} value={form.validity_days} onChange={e => set('validity_days', parseInt(e.target.value))} />
                </div>
              </div>
              <div className="flow-foot">
                <div />
                <button className="btn btn-dark" onClick={() => setStep(2)} disabled={!form.client_id || !form.title}>
                  {messages.createQuote.nextAddServices}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Line Items */}
          {step === 2 && (
            <div className="flow-card">
              <div className="flow-title">{messages.createQuote.whatServices}</div>
              <div className="flow-sub">{messages.createQuote.addLineItems}</div>
              <LineItemsEditor
                items={items}
                onChange={items => { setItems(items); if (!isEdit) setIsDirty(true); }}
                currency={form.currency}
                taxRate={form.tax_rate}
                taxExempt={form.tax_exempt}
                taxType={profile?.tax_type}
              />
              <div className="flow-foot">
                <button className="btn btn-outline" onClick={() => setStep(1)}>{messages.createQuote.back}</button>
                <button className="btn btn-dark" onClick={() => setStep(3)}>{messages.createQuote.nextTerms}</button>
              </div>
            </div>
          )}

          {/* Step 3: Terms */}
          {step === 3 && (
            <div className="flow-card">
              <div className="flow-title">{messages.createQuote.termsTitle}</div>
              <div className="flow-sub">{messages.createQuote.termsSub}</div>
              <div className="terms-grid">
                <div className="form-group">
                  <label>{messages.createQuote.depositRequired}</label>
                  <select value={form.deposit} onChange={e => set('deposit', e.target.value)}>
                    {['50% upfront','100% upfront','30% deposit','No deposit'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>{messages.createQuote.paymentMethod}</label>
                  <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
                    {['Bank Transfer','Cash','Cheque','PayPal','Stripe','Crypto'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>{messages.createQuote.deliveryTimeline}</label>
                  <input value={form.delivery_timeline} onChange={e => set('delivery_timeline', e.target.value)} placeholder="10 business days" />
                </div>
                <div className="form-group">
                  <label>{messages.createQuote.revisions}</label>
                  <input value={form.revisions} onChange={e => set('revisions', e.target.value)} placeholder="2 rounds" />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label>{messages.createQuote.notesScope}</label>
                  <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder={messages.createQuote.notesPlaceholder} />
                </div>
              </div>
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { key: 'tax_exempt'         as const, label: messages.createQuote.gctExempt,          sub: messages.createQuote.gctExemptSub, pro: false },
                  { key: 'require_signature'  as const, label: messages.createQuote.requireSignature,    sub: messages.createQuote.requireSignatureSub, pro: false },
                  { key: 'track_views'        as const, label: messages.createQuote.trackViews,          sub: messages.createQuote.trackViewsSub(isPro), pro: true },
                  { key: 'send_reminder'      as const, label: messages.createQuote.sendReminder,        sub: messages.createQuote.sendReminderSub, pro: false },
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
                <button className="btn btn-outline" onClick={() => setStep(2)}>{messages.createQuote.back}</button>
                <button className="btn btn-dark" onClick={() => setStep(4)}>{messages.createQuote.nextReview}</button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="flow-card">
              <div className="flow-title">{isEdit ? messages.createQuote.reviewSave : messages.createQuote.reviewSend}</div>
              <div className="flow-sub">{isEdit ? messages.createQuote.reviewChanges : messages.createQuote.everythingLooksGood}</div>

              <div className="review-section">
                <div className="review-section-title">{messages.createQuote.quoteSummary}</div>
                <div className="review-grid">
                  <div className="review-item"><div className="review-item-label">{messages.createQuote.client}</div><div className="review-item-val">{client?.name ?? '—'}</div></div>
                  <div className="review-item"><div className="review-item-label">{messages.createQuote.project}</div><div className="review-item-val">{form.title}</div></div>
                  <div className="review-item"><div className="review-item-label">{messages.createQuote.subtotal}</div><div className="review-item-val">{form.currency} {subtotal.toLocaleString()}</div></div>
                  <div className="review-item"><div className="review-item-label">{messages.createQuote.total}</div><div className="review-item-val" style={{ color: 'var(--accent)', fontFamily: 'Syne' }}>{form.currency} {total.toLocaleString()}</div></div>
                  <div className="review-item"><div className="review-item-label">{messages.createQuote.deposit}</div><div className="review-item-val">{form.deposit}</div></div>
                  <div className="review-item"><div className="review-item-label">{messages.createQuote.validForLabel}</div><div className="review-item-val">{form.validity_days} {messages.createQuote.days}</div></div>
                </div>
              </div>

              <div className="flow-foot">
                <button className="btn btn-outline" onClick={() => setStep(3)}>{messages.createQuote.back}</button>
                <button className="btn btn-success" onClick={() => void handleSave()} disabled={loading}>
                  {loading ? (isEdit ? messages.createQuote.saving : messages.createQuote.creating) : (isEdit ? messages.createQuote.saveChanges : messages.createQuote.createQuote)}
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

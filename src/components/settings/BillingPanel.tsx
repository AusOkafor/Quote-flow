import { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useDashboard } from '@/hooks/useDashboard';
import { billingApi } from '@/services/api';
import { useAppToast } from '@/components/layout/ToastProvider';
import { messages } from '@/lib/messages';

const FREE_LIMIT = 3;

export default function BillingPanel() {
  const toast = useAppToast();
  const { profile, refresh: refreshProfile } = useProfile();
  const { stats } = useDashboard();
  const [loading, setLoading] = useState<string | null>(null);

  const plan = profile?.plan ?? 'free';
  const quotesUsed = stats?.quotes_created_this_month ?? 0;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast(messages.toast.paymentSuccess, 'success');
      params.delete('success');
      const newUrl = params.toString() ? `${window.location.pathname}?${params}` : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      refreshProfile?.();
    }
  }, [toast, refreshProfile]);

  const handleManageBilling = async () => {
    setLoading('portal');
    try {
      const { url } = await billingApi.createPortalSession();
      if (url) window.location.href = url;
      else toast(messages.toast.billingPortalFailed, 'warning');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to open billing portal';
      toast(msg.includes('no billing') ? messages.toast.subscribeFirst : msg, 'warning');
    } finally {
      setLoading(null);
    }
  };

  const handleUpgrade = async (targetPlan: 'pro' | 'business', interval: 'monthly' | 'annual') => {
    setLoading(`${targetPlan}-${interval}`);
    try {
      const { url } = await billingApi.createCheckoutSession({ plan: targetPlan, interval });
      if (url) window.location.href = url;
      else toast(messages.toast.checkoutFailed, 'warning');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Checkout failed';
      if (msg.includes('not configured') || msg.includes('503')) {
        toast(messages.toast.billingNotConfigured, 'warning');
      } else {
        toast(msg, 'warning');
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <div className="sp-title">{messages.billing.title}</div>
      <div className="sp-sub">{messages.billing.sub}</div>
      <div style={{ background: 'linear-gradient(135deg, var(--ink), #1a1a2e)', borderRadius: 14, padding: 26, marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(232,92,47,.15)', pointerEvents: 'none' }} />
        <div style={{ fontSize: 11, color: 'rgba(245,242,236,.45)', letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: 8 }}>{messages.billing.currentPlan}</div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: 'var(--paper)', marginBottom: 4 }}>
          {plan === 'business' ? messages.billing.business : plan === 'pro' ? messages.billing.pro : messages.billing.free}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(245,242,236,.5)', marginBottom: 18 }}>
          {plan === 'business'
            ? messages.billing.businessFeatures
            : plan === 'pro'
              ? messages.billing.proFeatures
              : messages.freeTier.quotesUsed(quotesUsed, FREE_LIMIT)}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(plan === 'business'
            ? messages.billing.businessFeatureList
            : plan === 'pro'
              ? messages.billing.proFeatureList
              : messages.billing.freeFeatures
          ).map(b => (
            <span key={b} style={{ background: 'rgba(245,242,236,.1)', border: '1px solid rgba(245,242,236,.15)', borderRadius: 100, padding: '4px 12px', fontSize: 11, color: 'rgba(245,242,236,.7)' }}>{b}</span>
          ))}
        </div>
      </div>
      {plan === 'business' && (
        <div style={{ background: 'rgba(45,171,111,.08)', border: '1px solid var(--success)', borderRadius: 14, padding: 16, marginBottom: 24, fontSize: 14, color: 'var(--text)' }}>
          ✓ {messages.billing.whiteLabelEnabled}
        </div>
      )}
      {(plan === 'free' || plan === 'pro') && (
        <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 24, fontSize: 14, color: 'var(--muted)' }}>
          {messages.billing.whiteLabelUpgrade}
        </div>
      )}
      {(plan === 'pro' || plan === 'business') && (
        <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 24 }}>
          <button className="btn btn-outline" disabled={!!loading} onClick={() => void handleManageBilling()}>
            {loading === 'portal' ? messages.loading.opening : messages.billing.manageBilling}
          </button>
        </div>
      )}
      {(plan === 'free' || plan === 'pro') && (
        <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>
            {plan === 'free' ? messages.billing.upgradePro : messages.billing.upgradeBusiness}
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
            {plan === 'free'
              ? messages.billing.upgradeProDesc
              : messages.billing.upgradeBusinessDesc}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <button
              className="btn btn-dark"
              disabled={!!loading}
              onClick={() => void handleUpgrade(plan === 'free' ? 'pro' : 'business', 'monthly')}
            >
              {loading === (plan === 'free' ? 'pro' : 'business') + '-monthly' ? messages.loading.redirecting : messages.billing.upgradeMonthly}
            </button>
            <button
              className="btn btn-outline"
              disabled={!!loading}
              onClick={() => void handleUpgrade(plan === 'free' ? 'pro' : 'business', 'annual')}
            >
              {loading === (plan === 'free' ? 'pro' : 'business') + '-annual' ? messages.loading.redirecting : messages.billing.upgradeAnnual}
            </button>
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12 }}>
            {messages.billing.securePayment}
          </div>
        </div>
      )}
    </>
  );
}

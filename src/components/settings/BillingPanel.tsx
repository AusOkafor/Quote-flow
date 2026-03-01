import { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useDashboard } from '@/hooks/useDashboard';
import { billingApi } from '@/services/api';
import { useAppToast } from '@/components/layout/ToastProvider';

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
      toast('Payment successful! Your plan has been updated.', 'success');
      params.delete('success');
      const newUrl = params.toString() ? `${window.location.pathname}?${params}` : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      refreshProfile?.();
    }
  }, [toast, refreshProfile]);

  const handleUpgrade = async (targetPlan: 'pro' | 'business', interval: 'monthly' | 'annual') => {
    setLoading(`${targetPlan}-${interval}`);
    try {
      const { url } = await billingApi.createCheckoutSession({ plan: targetPlan, interval });
      if (url) window.location.href = url;
      else toast('Could not start checkout', 'warning');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Checkout failed';
      if (msg.includes('not configured') || msg.includes('503')) {
        toast('Billing is not configured yet. Contact support to upgrade.', 'warning');
      } else {
        toast(msg, 'warning');
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <div className="sp-title">Billing</div>
      <div className="sp-sub">Manage your plan and payment method.</div>
      <div style={{ background: 'linear-gradient(135deg, var(--ink), #1a1a2e)', borderRadius: 14, padding: 26, marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(232,92,47,.15)', pointerEvents: 'none' }} />
        <div style={{ fontSize: 11, color: 'rgba(245,242,236,.45)', letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: 8 }}>Current Plan</div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: 'var(--paper)', marginBottom: 4 }}>
          {plan === 'business' ? 'Business' : plan === 'pro' ? 'Pro' : 'Free'}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(245,242,236,.5)', marginBottom: 18 }}>
          {plan === 'business'
            ? 'Everything in Pro + Team, API, White-label'
            : plan === 'pro'
              ? 'Unlimited quotes · Full features'
              : `You've used ${quotesUsed} of ${FREE_LIMIT} quotes this month · No credit card required`}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(plan === 'business'
            ? ['Everything in Pro', 'Team members (5)', 'API access', 'White-label']
            : plan === 'pro'
              ? ['Unlimited quotes', 'Priority support', 'Custom branding']
              : ['3 quotes/month', 'Basic templates', 'WhatsApp sharing']
          ).map(b => (
            <span key={b} style={{ background: 'rgba(245,242,236,.1)', border: '1px solid rgba(245,242,236,.15)', borderRadius: 100, padding: '4px 12px', fontSize: 11, color: 'rgba(245,242,236,.7)' }}>{b}</span>
          ))}
        </div>
      </div>
      {(plan === 'free' || plan === 'pro') && (
        <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>
            {plan === 'free' ? 'Upgrade to Pro — $15/month' : 'Upgrade to Business — $39/month'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
            {plan === 'free'
              ? 'Unlimited quotes, custom branding, view tracking, and more.'
              : 'Team members, API access, custom domain, white-label quotes.'}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <button
              className="btn btn-dark"
              disabled={!!loading}
              onClick={() => void handleUpgrade(plan === 'free' ? 'pro' : 'business', 'monthly')}
            >
              {loading === (plan === 'free' ? 'pro' : 'business') + '-monthly' ? 'Redirecting…' : 'Upgrade Monthly'}
            </button>
            <button
              className="btn btn-outline"
              disabled={!!loading}
              onClick={() => void handleUpgrade(plan === 'free' ? 'pro' : 'business', 'annual')}
            >
              {loading === (plan === 'free' ? 'pro' : 'business') + '-annual' ? 'Redirecting…' : 'Upgrade Annual (save 20%)'}
            </button>
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12 }}>
            Secure payment via Stripe. Cancel anytime.
          </div>
        </div>
      )}
    </>
  );
}

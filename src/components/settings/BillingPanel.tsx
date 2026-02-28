import React from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useDashboard } from '@/hooks/useDashboard';

const FREE_LIMIT = 3;

export default function BillingPanel() {
  const { profile } = useProfile();
  const { stats } = useDashboard();

  const plan = profile?.plan ?? 'free';
  const quotesUsed = stats?.quotes_created_this_month ?? 0;

  return (
    <>
      <div className="sp-title">Billing</div>
      <div className="sp-sub">Manage your plan and payment method.</div>
      <div style={{ background: 'linear-gradient(135deg, var(--ink), #1a1a2e)', borderRadius: 14, padding: 26, marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(232,92,47,.15)', pointerEvents: 'none' }} />
        <div style={{ fontSize: 11, color: 'rgba(245,242,236,.45)', letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: 8 }}>Current Plan</div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: 'var(--paper)', marginBottom: 4 }}>
          {plan === 'pro' ? 'Pro' : 'Free'}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(245,242,236,.5)', marginBottom: 18 }}>
          {plan === 'pro'
            ? 'Unlimited quotes · Full features'
            : `You've used ${quotesUsed} of ${FREE_LIMIT} quotes this month · No credit card required`}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(plan === 'pro'
            ? ['Unlimited quotes', 'Priority support', 'Custom branding']
            : ['3 quotes/month', 'Basic templates', 'WhatsApp sharing']
          ).map(b => (
            <span key={b} style={{ background: 'rgba(245,242,236,.1)', border: '1px solid rgba(245,242,236,.15)', borderRadius: 100, padding: '4px 12px', fontSize: 11, color: 'rgba(245,242,236,.7)' }}>{b}</span>
          ))}
        </div>
      </div>
      {plan !== 'pro' && (
        <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Upgrade to Pro — $15/month</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
            Unlimited quotes, custom branding, view tracking, and more.
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            Payment integration coming soon. In the meantime, you can continue using the free plan or{' '}
            <a href="mailto:support@quoteflow.app" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>contact us</a> to upgrade.
          </div>
        </div>
      )}
    </>
  );
}

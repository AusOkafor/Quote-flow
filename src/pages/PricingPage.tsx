import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const PLANS = [
  {
    tier: 'Free',
    monthly: 0, annual: 0,
    features: ['3 quotes per month', 'Basic templates', 'WhatsApp sharing', 'PDF export', 'Email support'],
    featured: false,
  },
  {
    tier: 'Pro',
    monthly: 15, annual: 12,
    features: ['Unlimited quotes', 'Custom branding', 'Client portal', 'View tracking', 'Priority support', 'Analytics dashboard', 'Auto-reminders'],
    featured: true,
  },
  {
    tier: 'Business',
    monthly: 39, annual: 32,
    features: ['Everything in Pro', 'Team members (5)', 'API access', 'Custom domain', 'Dedicated account manager', 'White-label quotes'],
    featured: false,
  },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user));
  }, []);

  const handlePlanClick = (planTier: string) => {
    if (isLoggedIn) {
      // Already in app — go to dashboard, or billing for paid plans
      navigate(planTier === 'Free' ? '/app' : '/app/settings?panel=billing');
    } else {
      navigate('/login');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <div className="plans-nav">
        <div className="logo" style={{ color: 'var(--ink)' }}>Quote<span>Flow</span></div>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Back</button>
      </div>
      <div className="plans-hero">
        <h2>Simple, transparent pricing</h2>
        <p>Start free. Upgrade when you're ready.</p>
        <div className="toggle-billing">
          <button className={`tb-opt${billing === 'monthly' ? ' active' : ''}`} onClick={() => setBilling('monthly')}>Monthly</button>
          <button className={`tb-opt${billing === 'annual'  ? ' active' : ''}`} onClick={() => setBilling('annual')}>Annual (save 20%)</button>
        </div>
      </div>
      <div className="plans-cards">
        {PLANS.map(plan => (
          <div key={plan.tier} className={`pc${plan.featured ? ' featured' : ''}`}>
            {plan.featured && <div className="pc-popular">Most Popular</div>}
            <div className="pc-tier">{plan.tier}</div>
            <div className="pc-price">
              {plan.monthly === 0 ? 'Free' : `$${billing === 'monthly' ? plan.monthly : plan.annual}`}
            </div>
            {plan.monthly > 0 && <div className="pc-per">/month{billing === 'annual' ? ', billed annually' : ''}</div>}
            <div className="pc-feats">
              {plan.features.map(f => (
                <div key={f} className="pc-feat">
                  <span className="pc-feat-check">✓</span>
                  {f}
                </div>
              ))}
            </div>
            <button className="pc-btn" onClick={() => handlePlanClick(plan.tier)}>
              {plan.monthly === 0 ? 'Get Started Free' : `Get ${plan.tier}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

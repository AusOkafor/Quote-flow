import { useState, useEffect } from 'react';
import { usePayments } from '@/hooks/usePayments';
import { useProfile } from '@/hooks/useProfile';
import { useAppToast } from '@/components/layout/ToastProvider';
import type { Profile, PaymentProcessor } from '@/types';

interface Props {
  profile: Profile;
  onChange: (updates: Partial<Profile>) => void;
}

const PROCESSOR_LABELS: Record<PaymentProcessor, string> = {
  wipay: 'WiPay',
  stripe: 'Stripe',
  paypal: 'PayPal',
};

export default function PaymentsPanel({ profile, onChange }: Props) {
  const toast = useAppToast();
  const { loading, connectWiPay, connectStripe, connectPayPal, disconnect, isConnected } = usePayments();
  const { refresh: refreshProfile } = useProfile();
  const [wipayAccountId, setWipayAccountId] = useState('');
  const [wipayApiKey, setWipayApiKey] = useState('');
  const [wipayLoading, setWipayLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    const error = params.get('error');
    if (connected === 'stripe') {
      toast('Stripe connected successfully', 'success');
      params.delete('connected');
      window.history.replaceState({}, '', params.toString() ? `${window.location.pathname}?${params}` : window.location.pathname);
      refreshProfile?.();
    } else if (connected === 'paypal') {
      toast('PayPal connected successfully', 'success');
      params.delete('connected');
      window.history.replaceState({}, '', params.toString() ? `${window.location.pathname}?${params}` : window.location.pathname);
      refreshProfile?.();
    } else if (error === 'stripe') {
      toast('Stripe connection failed. Please try again.', 'warning');
      params.delete('error');
      window.history.replaceState({}, '', params.toString() ? `${window.location.pathname}?${params}` : window.location.pathname);
    }
  }, [toast, refreshProfile]);

  const handleConnectWiPay = async () => {
    if (!wipayAccountId.trim() || !wipayApiKey.trim()) {
      toast('Please enter Account ID and API Key', 'warning');
      return;
    }
    setWipayLoading(true);
    try {
      await connectWiPay({ account_id: wipayAccountId.trim(), api_key: wipayApiKey.trim() });
      setWipayAccountId('');
      setWipayApiKey('');
      toast('WiPay connected successfully', 'success');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Invalid WiPay credentials';
      toast(msg, 'warning');
    } finally {
      setWipayLoading(false);
    }
  };

  const handleDisconnect = async (processor: PaymentProcessor) => {
    if (!window.confirm(`Disconnect ${PROCESSOR_LABELS[processor]}?`)) return;
    try {
      await disconnect(processor);
      toast(`${PROCESSOR_LABELS[processor]} disconnected`, 'success');
    } catch {
      toast('Failed to disconnect', 'warning');
    }
  };

  const defaultTiming = profile.default_payment_timing ?? 'link_only';
  const preferredUsd = profile.preferred_usd_processor ?? null;

  const processorCard = (
    processor: PaymentProcessor,
    title: string,
    subtitle: string,
    note?: string,
    accentColor: string = 'var(--accent)',
  ) => (
    <div
      key={processor}
      className="pay-processor-card"
      style={{
        borderLeft: `4px solid ${accentColor}`,
      }}
    >
      <div className="pay-processor-header">
        <div>
          <div className="pay-processor-title">{title}</div>
          <div className="pay-processor-sub">{subtitle}</div>
          {note && (
            <div className="pay-processor-note">
              <span className="pay-processor-note-icon">ℹ</span>
              {note}
            </div>
          )}
        </div>
        {isConnected(processor) ? (
          <div className="pay-processor-status">
            <span className="pay-processor-badge">Connected</span>
            <button className="btn btn-outline btn-sm" onClick={() => void handleDisconnect(processor)}>
              Disconnect
            </button>
          </div>
        ) : processor === 'wipay' ? (
          <div className="pay-processor-form">
            <input
              type="text"
              placeholder="Account ID"
              value={wipayAccountId}
              onChange={e => setWipayAccountId(e.target.value)}
              className="pay-input"
            />
            <input
              type="password"
              placeholder="API Key"
              value={wipayApiKey}
              onChange={e => setWipayApiKey(e.target.value)}
              className="pay-input"
            />
            <button
              className="btn btn-dark"
              onClick={() => void handleConnectWiPay()}
              disabled={wipayLoading || !wipayAccountId.trim() || !wipayApiKey.trim()}
            >
              {wipayLoading ? 'Connecting…' : 'Connect WiPay'}
            </button>
          </div>
        ) : (
          <button
            className="btn btn-dark"
            onClick={() => (processor === 'stripe' ? void connectStripe() : void connectPayPal())}
          >
            Connect with {PROCESSOR_LABELS[processor]}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="sp-title">Payment Processors</div>
      <div className="sp-sub">Connect payment processors to collect payments directly on quotes.</div>

      {loading ? (
        <div className="pay-loading">Loading…</div>
      ) : (
        <div className="pay-processors">
          {processorCard(
            'wipay',
            'WiPay',
            'Caribbean payments · JMD, TTD, BBD',
            'Requires business registration at wipayfinancial.com before connecting',
            '#0D9488',
          )}
          {processorCard('stripe', 'Stripe', 'International & card payments · USD', undefined, '#635BFF')}
          {processorCard(
            'paypal',
            'PayPal',
            'Widely accepted · USD only',
            'USD quotes only — not supported for JMD',
            '#003087',
          )}
        </div>
      )}

      <div className="sp-title pay-section-title">Default Payment Timing</div>
      <div className="sp-sub">When clients accept a quote, how should payment work?</div>
      <div className="pay-timing-options">
        {[
          { value: 'full' as const, label: 'Full payment on acceptance', desc: 'Pay 100% right when accepting' },
          { value: 'deposit' as const, label: 'Deposit on acceptance', desc: 'Pay deposit % now. Balance due when work is done.' },
          { value: 'link_only' as const, label: 'Payment link only', desc: 'Accept and payment are separate. Button stays on page.' },
        ].map(opt => (
          <label
            key={opt.value}
            className={`pay-timing-option ${defaultTiming === opt.value ? 'selected' : ''}`}
          >
            <input
              type="radio"
              name="payment_timing"
              checked={defaultTiming === opt.value}
              onChange={() => onChange({ default_payment_timing: opt.value })}
            />
            <div className="pay-timing-content">
              <div className="pay-timing-label">{opt.label}</div>
              <div className="pay-timing-desc">{opt.desc}</div>
            </div>
          </label>
        ))}
      </div>

      {(isConnected('stripe') && isConnected('paypal')) && (
        <>
          <div className="sp-title pay-section-title">USD Processor Preference</div>
          <div className="sp-sub">When both are connected, which should clients see first for USD quotes?</div>
          <div className="pay-usd-pref">
            <label className={`pay-usd-option ${preferredUsd === 'stripe' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="usd_processor"
                checked={preferredUsd === 'stripe'}
                onChange={() => onChange({ preferred_usd_processor: 'stripe' })}
              />
              <span>Stripe</span>
            </label>
            <label className={`pay-usd-option ${preferredUsd === 'paypal' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="usd_processor"
                checked={preferredUsd === 'paypal'}
                onChange={() => onChange({ preferred_usd_processor: 'paypal' })}
              />
              <span>PayPal</span>
            </label>
          </div>
        </>
      )}
    </>
  );
}

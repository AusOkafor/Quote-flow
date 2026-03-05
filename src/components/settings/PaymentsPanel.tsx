import { useEffect, useState } from 'react';
import { usePayments } from '@/hooks/usePayments';
import { useProfile } from '@/hooks/useProfile';
import { useAppToast } from '@/components/layout/ToastProvider';
import type { Profile, PaymentProcessor } from '@/types';

interface Props {
  profile: Profile;
  onChange: (updates: Partial<Profile>) => void;
}

const PROCESSOR_LABELS: Record<PaymentProcessor, string> = {
  stripe: 'Stripe',
  paypal: 'PayPal',
  wipay: 'WiPay',
};

export default function PaymentsPanel({ profile, onChange }: Props) {
  const toast = useAppToast();
  const { loading, connectStripe, connectPayPal, connectWiPay, disconnect, isConnected } = usePayments();
  const [wipayAccountNumber, setWipayAccountNumber] = useState('');
  const [wipayAPIKey, setWipayAPIKey] = useState('');
  const [connectingWiPay, setConnectingWiPay] = useState(false);
  const { refresh: refreshProfile } = useProfile();

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
    } else if (error === 'paypal') {
      toast('PayPal connection failed. Please try again.', 'warning');
      params.delete('error');
      window.history.replaceState({}, '', params.toString() ? `${window.location.pathname}?${params}` : window.location.pathname);
    }
  }, [toast, refreshProfile]);

  const handleConnectWiPay = async () => {
    if (!wipayAccountNumber.trim() || !wipayAPIKey.trim()) return;
    setConnectingWiPay(true);
    try {
      await connectWiPay({
        account_number: wipayAccountNumber.trim(),
        api_key: wipayAPIKey.trim(),
      });
      toast('WiPay connected successfully!', 'success');
      setWipayAccountNumber('');
      setWipayAPIKey('');
      refreshProfile?.();
    } catch {
      toast('Failed to connect WiPay — check your credentials and try again', 'warning');
    } finally {
      setConnectingWiPay(false);
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
        ) : processor === 'wipay' ? null : (
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
          {processorCard('stripe', 'Stripe', 'International & card payments · USD', undefined, '#635BFF')}
          {processorCard(
            'paypal',
            'PayPal',
            'Widely accepted · USD only',
            'USD quotes only — not supported for JMD',
            '#003087',
          )}
          {/* WiPay — Caribbean currencies (JMD, TTD, BBD) */}
          <div
            key="wipay"
            className="pay-processor-card"
            style={{ borderLeft: '4px solid #2DAB6F' }}
          >
            <div className="pay-processor-header">
              <div>
                <div className="pay-processor-title">WiPay</div>
                <div className="pay-processor-sub">
                  Caribbean payments · JMD, TTD, BBD — no QuoteFlow platform fee
                </div>
                <div className="pay-processor-note">
                  <span className="pay-processor-note-icon">ℹ</span>
                  Requires a registered business. Apply at{' '}
                  <a href="https://wipayfinancial.com" target="_blank" rel="noopener noreferrer" className="link">
                    wipayfinancial.com
                  </a>
                </div>
              </div>
              {isConnected('wipay') ? (
                <div className="pay-processor-status">
                  <span className="pay-processor-badge">Connected</span>
                  <button className="btn btn-outline btn-sm" onClick={() => void handleDisconnect('wipay')}>
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="pay-wipay-form">
                  <input
                    type="text"
                    placeholder="WiPay account number"
                    value={wipayAccountNumber}
                    onChange={(e) => setWipayAccountNumber(e.target.value)}
                    className="pay-wipay-input"
                  />
                  <input
                    type="password"
                    placeholder="WiPay API key"
                    value={wipayAPIKey}
                    onChange={(e) => setWipayAPIKey(e.target.value)}
                    className="pay-wipay-input"
                  />
                  <button
                    className="btn btn-dark"
                    onClick={() => void handleConnectWiPay()}
                    disabled={connectingWiPay || !wipayAccountNumber.trim() || !wipayAPIKey.trim()}
                  >
                    {connectingWiPay ? 'Connecting…' : 'Connect WiPay'}
                  </button>
                </div>
              )}
            </div>
          </div>
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

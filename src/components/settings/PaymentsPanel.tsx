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

  return (
    <>
      <div className="sp-title">Payment Processors</div>
      <div className="sp-sub">Connect payment processors to collect payments directly on quotes.</div>

      {loading ? (
        <div style={{ padding: 24, color: 'var(--muted)' }}>Loading…</div>
      ) : (
        <>
          {/* WiPay */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>🇯🇲 WiPay</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>Caribbean payments · JMD, TTD, BBD</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                  ⚠ Requires business registration at wipayfinancial.com before connecting
                </div>
                {isConnected('wipay') ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>✓ Connected</span>
                    <button className="btn btn-outline btn-sm" onClick={() => { void handleDisconnect('wipay'); }}>
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320 }}>
                    <input
                      type="text"
                      placeholder="Account ID"
                      value={wipayAccountId}
                      onChange={e => setWipayAccountId(e.target.value)}
                      style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', fontSize: 14 }}
                    />
                    <input
                      type="password"
                      placeholder="API Key"
                      value={wipayApiKey}
                      onChange={e => setWipayApiKey(e.target.value)}
                      style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', fontSize: 14 }}
                    />
                    <button
                      className="btn btn-dark" onClick={() => void handleConnectWiPay()}
                      disabled={wipayLoading || !wipayAccountId.trim() || !wipayApiKey.trim()}
                    >
                      {wipayLoading ? 'Connecting…' : 'Connect WiPay'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stripe */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>💳 Stripe</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>International & card payments · USD</div>
                {isConnected('stripe') ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>✓ Connected</span>
                    <button className="btn btn-outline btn-sm" onClick={() => { void handleDisconnect('stripe'); }}>
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button className="btn btn-dark" onClick={() => void connectStripe()}>
                    Connect with Stripe
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* PayPal */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>🅿 PayPal</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>Widely accepted · USD only</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                  ⚠ USD quotes only — not supported for JMD
                </div>
                {isConnected('paypal') ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>✓ Connected</span>
                    <button className="btn btn-outline btn-sm" onClick={() => { void handleDisconnect('paypal'); }}>
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button className="btn btn-dark" onClick={() => void connectPayPal()}>
                    Connect with PayPal
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Payment timing */}
      <div className="sp-title" style={{ marginTop: 24 }}>Default Payment Timing</div>
      <div className="sp-sub">When clients accept a quote, how should payment work?</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {[
          { value: 'full' as const, label: 'Full payment on acceptance', desc: 'Pay 100% right when accepting' },
          { value: 'deposit' as const, label: 'Deposit on acceptance', desc: 'Pay deposit % now. Balance due when work is done.' },
          { value: 'link_only' as const, label: 'Payment link only', desc: 'Accept and payment are separate. Button stays on page.' },
        ].map(opt => (
          <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <input
              type="radio"
              name="payment_timing"
              checked={defaultTiming === opt.value}
              onChange={() => onChange({ default_payment_timing: opt.value })}
            />
            <div>
              <div style={{ fontWeight: 500 }}>{opt.label}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{opt.desc}</div>
            </div>
          </label>
        ))}
      </div>

      {/* USD processor preference */}
      {(isConnected('stripe') && isConnected('paypal')) && (
        <>
          <div className="sp-title">For USD quotes (Stripe + PayPal both connected)</div>
          <div className="sp-sub">Prefer:</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="radio"
                name="usd_processor"
                checked={preferredUsd === 'stripe'}
                onChange={() => onChange({ preferred_usd_processor: 'stripe' })}
              />
              Stripe
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="radio"
                name="usd_processor"
                checked={preferredUsd === 'paypal'}
                onChange={() => onChange({ preferred_usd_processor: 'paypal' })}
              />
              PayPal
            </label>
          </div>
        </>
      )}
    </>
  );
}

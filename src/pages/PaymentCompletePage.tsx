import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { publicApi } from '@/services/api';
import { formatCurrency, calcDepositAmount } from '@/lib/utils';
import type { QuoteWithDetails } from '@/types';

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 10000;

export default function PaymentCompletePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('quote');
  const [quote, setQuote] = useState<QuoteWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const start = Date.now();
    const poll = async () => {
      try {
        const q = await publicApi.getQuote(token);
        if (cancelled) return;
        setQuote(q);
        if (q.deposit_paid_at || q.fully_paid_at) {
          setConfirmed(true);
          setLoading(false);
          return;
        }
      } catch {
        if (cancelled) return;
      }
      if (Date.now() - start >= POLL_TIMEOUT_MS) {
        setTimedOut(true);
        setLoading(false);
        return;
      }
      setTimeout(poll, POLL_INTERVAL_MS);
    };
    poll();
    return () => { cancelled = true; };
  }, [token]);

  if (!token) {
    return (
      <div className="public-viewer" style={{ textAlign: 'center', paddingTop: 120, fontFamily: 'Syne' }}>
        <div style={{ fontSize: 18, marginBottom: 8 }}>Invalid link</div>
        <div style={{ color: 'var(--muted)' }}>This payment link is invalid or has expired.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="public-viewer" style={{ textAlign: 'center', paddingTop: 120, fontFamily: 'Syne' }}>
        <div style={{ marginBottom: 16 }}>⏳</div>
        <div style={{ fontSize: 18, marginBottom: 8 }}>Confirming your payment…</div>
        <div style={{ color: 'var(--muted)' }}>Please wait a moment.</div>
      </div>
    );
  }

  const businessName = quote?.creator?.business_name || 'the vendor';
  const clientName = quote?.client?.name || 'there';

  if (confirmed && quote) {
    const paidAmount = quote.fully_paid_at ? quote.total : calcDepositAmount(quote.deposit || '50%', quote.total);
    return (
      <div className="public-viewer" style={{ textAlign: 'center', paddingTop: 120, fontFamily: 'Syne', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Payment Successful!</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 24 }}>
          Thank you, {clientName}. Your payment of {formatCurrency(paidAmount, quote.currency)} has been received by {businessName}.
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>A receipt has been sent to your email.</div>
      </div>
    );
  }

  if (timedOut) {
    return (
      <div className="public-viewer" style={{ textAlign: 'center', paddingTop: 120, fontFamily: 'Syne', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Payment Submitted</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 24 }}>
          Your payment is being processed. We'll confirm shortly. If you received a receipt, you're all set.
        </div>
      </div>
    );
  }

  return (
    <div className="public-viewer" style={{ textAlign: 'center', paddingTop: 120, fontFamily: 'Syne' }}>
      <div style={{ fontSize: 18, marginBottom: 8 }}>Confirming payment…</div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar             from '@/components/layout/Topbar';
import QuotesTable        from '@/components/quotes/QuotesTable';
import QuotePreviewModal  from '@/components/quotes/QuotePreviewModal';
import SendModal          from '@/components/quotes/SendModal';
import UpgradeLimitModal  from '@/components/modals/UpgradeLimitModal';
import { useQuotes }      from '@/hooks/useQuotes';
import { useProfile }     from '@/hooks/useProfile';
import { quotesApi, isFreeTierLimitError } from '@/services/api';
import { useAppToast }    from '@/components/layout/AppShell';
import type { Quote, SendChannel } from '@/types';

export default function QuotesPage() {
  const navigate = useNavigate();
  const toast    = useAppToast();
  const { quotes, duplicate, remove, reload } = useQuotes();
  const { profile } = useProfile();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [preview, setPreview] = useState<Quote | null>(null);
  const [sendId,  setSendId]  = useState<string | null>(null);
  const [sendQuote, setSendQuote] = useState<Quote | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleDuplicate = async (id: string) => {
    try {
      const q = await duplicate(id);
      toast(`📋 Duplicated as ${q.quote_number}`, 'success');
    } catch (e) {
      if (isFreeTierLimitError(e)) {
        setShowUpgradeModal(true);
      } else {
        toast('Failed to duplicate', 'warning');
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      toast('🗑 Quote deleted', 'warning');
    } catch {
      toast('Failed to delete quote', 'warning');
    }
  };

  const handleSend = async (id: string, channel: SendChannel, extra?: { email?: string; phone?: string }) => {
    const result = await quotesApi.send(id, { channel, recipient_email: extra?.email, recipient_phone: extra?.phone });
    const msg = channel === 'link' ? '✅ Link copied to clipboard!' : `✅ Sent via ${channel}`;
    toast(msg, 'success', 6000);
    return result;
  };

  const handleMarkPaid = async (id: string) => {
    try {
      const updated = await quotesApi.markPaid(id);
      setPreview(prev => (prev?.id === id ? { ...prev, ...updated } : prev));
      await reload();
      toast('✓ Marked as paid', 'success');
    } catch {
      toast('Failed to mark as paid', 'warning');
    }
  };

  const handleExport = async () => {
    try {
      await quotesApi.exportCSV();
      toast('⬇ CSV downloading…', 'info');
    } catch {
      toast('Export failed', 'warning');
    }
  };

  return (
    <>
      <Topbar
        title="All Quotes"
        actions={
          <>
            <button className="btn btn-outline" onClick={() => void handleExport()}>↓ Export CSV</button>
            <button className="btn btn-dark" onClick={() => navigate('/app/create')}>+ New Quote</button>
          </>
        }
      />
      <div className="page-body">
        <QuotesTable
          quotes={quotes}
          onPreview={async (id) => {
            setPreviewId(id);
            setPreview(null);
            try {
              const full = await quotesApi.get(id);
              setPreview(full);
            } catch {
              setPreview(quotes.find(q => q.id === id) ?? null);
            }
          }}
          onDuplicate={id => void handleDuplicate(id)}
          onDelete={id => void handleDelete(id)}
          onSend={id => setSendId(id)}
          onEdit={id => navigate(`/app/create?edit=${id}`)}
        />
      </div>
      <QuotePreviewModal
        quote={preview}
        open={!!previewId}
        loading={!!previewId && !preview}
        onClose={() => { setPreviewId(null); setPreview(null); }}
        onSend={id => { setSendQuote(preview); setSendId(id); setPreviewId(null); setPreview(null); }}
        onMarkPaid={id => void handleMarkPaid(id)}
        toast={toast}
        profile={profile ?? undefined}
      />
      <SendModal
        quoteId={sendId}
        quote={sendQuote ?? quotes.find(q => q.id === sendId) ?? null}
        open={!!sendId}
        onClose={() => { setSendId(null); setSendQuote(null); }}
        onSend={(id, ch, extra) => handleSend(id, ch, extra)}
      />
      <UpgradeLimitModal open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </>
  );
}

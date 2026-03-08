import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar             from '@/components/layout/Topbar';
import QuotesTable        from '@/components/quotes/QuotesTable';
import QuotePreviewModal  from '@/components/quotes/QuotePreviewModal';
import SendModal          from '@/components/quotes/SendModal';
import SaveAsTemplateModal from '@/components/modals/SaveAsTemplateModal';
import UpgradeLimitModal  from '@/components/modals/UpgradeLimitModal';
import { useQuotes }      from '@/hooks/useQuotes';
import { useProfile }     from '@/hooks/useProfile';
import { quotesApi, templatesApi, paymentsApi, isFreeTierLimitError } from '@/services/api';
import { useAppToast }    from '@/components/layout/ToastProvider';
import { messages }      from '@/lib/messages';
import type { Quote, SendChannel } from '@/types';

export default function QuotesPage() {
  const navigate = useNavigate();
  const toast    = useAppToast();
  const { quotes, loading, error, duplicate, remove, reload } = useQuotes();
  const { profile } = useProfile();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [preview, setPreview] = useState<Quote | null>(null);
  const [sendId,  setSendId]  = useState<string | null>(null);
  const [sendQuote, setSendQuote] = useState<Quote | null>(null);
  const [saveAsTemplateId, setSaveAsTemplateId] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(true);

  useEffect(() => {
    paymentsApi.listAccounts()
      .then(accounts => setHasPaymentMethod(accounts.some(a => a.is_active)))
      .catch(() => {}); // silent — don't block the page
  }, []);

  const handleDuplicate = async (id: string) => {
    try {
      const q = await duplicate(id);
      toast(messages.toast.duplicatedAs(q.quote_number), 'success');
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
      toast(messages.toast.quoteDeletedShort, 'warning');
    } catch {
      toast(messages.toast.failedToDelete, 'warning');
    }
  };

  const handleSend = async (id: string, channel: SendChannel, extra?: { email?: string; phone?: string }) => {
    const result = await quotesApi.send(id, { channel, recipient_email: extra?.email, recipient_phone: extra?.phone });
    const msg = channel === 'link' ? messages.toast.linkCopiedSuccess : messages.toast.sentVia(channel);
    toast(msg, 'success', 6000);
    await reload();
    return result;
  };

  const handleMarkPaid = async (id: string) => {
    try {
      const updated = await quotesApi.markPaid(id);
      setPreview(prev => (prev?.id === id ? { ...prev, ...updated } : prev));
      await reload();
      toast(messages.toast.markedAsPaid, 'success');
    } catch {
      toast(messages.toast.failedToMarkPaid, 'warning');
    }
  };

  const handleExport = async () => {
    try {
      await quotesApi.exportCSV();
      toast(messages.toast.csvDownloading, 'info');
    } catch {
      toast(messages.toast.exportFailed, 'warning');
    }
  };

  const handleSaveAsTemplate = async (name: string) => {
    if (!saveAsTemplateId) return;
    await templatesApi.createFromQuote({ name, quote_id: saveAsTemplateId });
    toast(messages.toast.templateSaved, 'success');
  };

  return (
    <>
      <Topbar
        title={messages.quotesPage.title}
        actions={
          <>
            <button className="btn btn-outline" onClick={() => void handleExport()}>{messages.quotesPage.exportCsv}</button>
            <button className="btn btn-dark" onClick={() => navigate('/app/create')}>{messages.quotesPage.newQuote}</button>
          </>
        }
      />
      <div className="page-body">
        {error && (
          <div style={{ padding: 16, marginBottom: 16, background: 'rgba(232,64,64,.08)', border: '1px solid var(--danger)', borderRadius: 10, color: 'var(--danger)' }}>
            ⚠️ {error} — Check browser console (F12) and ensure Vercel has <code>VITE_API_BASE_URL</code> and Render has <code>ALLOWED_ORIGINS</code>.
          </div>
        )}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>{messages.loading.loadingQuotes}</div>
        ) : (
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
          onEdit={id => navigate(`/app/quotes/${id}/edit`)}
          onSaveAsTemplate={id => setSaveAsTemplateId(id)}
        />
        )}
      </div>
      <QuotePreviewModal
        quote={preview}
        open={!!previewId}
        loading={!!previewId && !preview}
        onClose={() => { setPreviewId(null); setPreview(null); }}
        onSend={id => { setSendQuote(preview); setSendId(id); setPreviewId(null); setPreview(null); }}
        onMarkPaid={id => void handleMarkPaid(id)}
        onNotesRead={() => {
          void reload();
          if (preview?.id) {
            try {
              const raw = sessionStorage.getItem('qf_notified_quote_ids');
              const arr = raw ? (JSON.parse(raw) as string[]) : [];
              sessionStorage.setItem('qf_notified_quote_ids', JSON.stringify(arr.filter(id => id !== preview.id)));
            } catch { /* ignore */ }
          }
        }}
        toast={toast}
        profile={profile ?? undefined}
      />
      <SendModal
        quoteId={sendId}
        quote={sendQuote ?? quotes.find(q => q.id === sendId) ?? null}
        open={!!sendId}
        onClose={() => { setSendId(null); setSendQuote(null); }}
        onSend={(id, ch, extra) => handleSend(id, ch, extra)}
        hasPaymentMethod={hasPaymentMethod}
      />
      <SaveAsTemplateModal
        open={!!saveAsTemplateId}
        quoteTitle={quotes.find(q => q.id === saveAsTemplateId)?.title}
        onClose={() => setSaveAsTemplateId(null)}
        onSave={handleSaveAsTemplate}
      />
      <UpgradeLimitModal open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </>
  );
}

import { useState } from 'react';
import Topbar           from '@/components/layout/Topbar';
import ClientCard       from '@/components/clients/ClientCard';
import AddClientModal   from '@/components/modals/AddClientModal';
import DeleteClientModal from '@/components/modals/DeleteClientModal';
import { useClients }   from '@/hooks/useClients';
import { useAppToast }  from '@/components/layout/ToastProvider';
import type { Client, CreateClientRequest }  from '@/types';

export default function ClientsPage() {
  const toast = useAppToast();
  const { clients, loading, error, create, update, delete: deleteClient } = useClients();

  const [showAdd,       setShowAdd]       = useState(false);
  const [clientToEdit,  setClientToEdit]  = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deleting,      setDeleting]      = useState(false);

  const handleAdd = async (data: CreateClientRequest) => {
    await create(data);
    toast('Client added!', 'success');
  };

  const handleEditSave = async (data: CreateClientRequest) => {
    if (!clientToEdit) return;
    await update(clientToEdit.id, data);
    toast('Client updated!', 'success');
  };

  const handleDeleteClick = (client: Client) => setClientToDelete(client);

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    setDeleting(true);
    try {
      await deleteClient(clientToDelete.id);
      setClientToDelete(null);
      toast('Client removed', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to delete client', 'warning');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Topbar
        title="Clients"
        actions={<button className="btn btn-dark" onClick={() => setShowAdd(true)}>+ Add Client</button>}
      />
      <div className="page-body">
        {error && (
          <div style={{ padding: 16, marginBottom: 16, background: 'rgba(232,64,64,.08)', border: '1px solid var(--danger)', borderRadius: 10, color: 'var(--danger)' }}>
            ⚠️ {error} — Check browser console (F12) and ensure Vercel has <code>VITE_API_BASE_URL</code> and Render has <code>ALLOWED_ORIGINS</code>.
          </div>
        )}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 72, color: 'var(--muted)' }}>Loading clients…</div>
        ) : clients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 72, color: 'var(--muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>👥</div>
            <div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No clients yet</div>
            <div style={{ fontSize: 14, marginBottom: 24 }}>Add your first client to start sending quotes.</div>
            <button className="btn btn-dark" onClick={() => setShowAdd(true)}>+ Add First Client</button>
          </div>
        ) : (
          <div className="clients-grid">
            {clients.map(c => (
              <ClientCard
                key={c.id}
                client={c}
                onClick={() => {}}
                onEdit={() => setClientToEdit(c)}
                onDelete={() => handleDeleteClick(c)}
                deleteDisabled={deleting}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add modal */}
      <AddClientModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={handleAdd}
        onError={msg => toast(msg, 'warning')}
      />

      {/* Edit modal — reuses AddClientModal in edit mode */}
      <AddClientModal
        open={!!clientToEdit}
        client={clientToEdit}
        onClose={() => setClientToEdit(null)}
        onSave={handleEditSave}
        onError={msg => toast(msg, 'warning')}
      />

      <DeleteClientModal
        open={!!clientToDelete}
        client={clientToDelete}
        onClose={() => !deleting && setClientToDelete(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />
    </>
  );
}

import { useState } from 'react';
import Topbar           from '@/components/layout/Topbar';
import ClientCard       from '@/components/clients/ClientCard';
import AddClientModal   from '@/components/modals/AddClientModal';
import DeleteClientModal from '@/components/modals/DeleteClientModal';
import { useClients }   from '@/hooks/useClients';
import { useAppToast }  from '@/components/layout/AppShell';
import type { Client }  from '@/types';

export default function ClientsPage() {
  const toast = useAppToast();
  const { clients, create, delete: deleteClient } = useClients();
  const [showAdd, setShowAdd] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleAdd = async (data: Parameters<typeof create>[0]) => {
    await create(data);
    toast('✅ Client added!', 'success');
  };

  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    setDeleting(true);
    try {
      await deleteClient(clientToDelete.id);
      setClientToDelete(null);
      toast('✅ Client removed', 'success');
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
        {clients.length === 0 ? (
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
                onDelete={() => handleDeleteClick(c)}
                deleteDisabled={deleting}
              />
            ))}
          </div>
        )}
      </div>
      <AddClientModal open={showAdd} onClose={() => setShowAdd(false)} onSave={handleAdd} onError={msg => toast(msg, 'warning')} />
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

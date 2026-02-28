import React from 'react';
import { getInitials, getAvatarColor, formatCurrency } from '@/lib/utils';
import type { Client } from '@/types';

interface Props {
  client: Client;
  onClick: () => void;
  onDelete?: (e: React.MouseEvent) => void;
  deleteDisabled?: boolean;
}

export default function ClientCard({ client, onClick, onDelete, deleteDisabled }: Props) {
  const initials = getInitials(client.name);
  const color    = getAvatarColor(client.name);

  return (
    <div className="client-card" onClick={onClick} style={{ position: 'relative' }}>
      {onDelete && (
        <button
          type="button"
          className="btn btn-ghost"
          onClick={(e) => { e.stopPropagation(); onDelete(e); }}
          disabled={deleteDisabled}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            padding: 6,
            minWidth: 0,
            fontSize: 14,
            color: 'var(--muted)',
          }}
          title="Delete client"
          aria-label="Delete client"
        >
          {deleteDisabled ? '…' : '🗑️'}
        </button>
      )}
      <div className="client-av" style={{ background: color }}>{initials}</div>
      <div className="client-name">{client.name}</div>
      {client.company && <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{client.company}</div>}
      <div className="client-email">{client.email}</div>
      <div className="client-stats">
        <div className="cs-item">
          <div className="cs-val">{client.quote_count ?? 0}</div>
          <div className="cs-label">Quotes</div>
        </div>
        {client.total_quoted !== undefined && client.total_quoted > 0 && (
          <div className="cs-item">
            <div className="cs-val">{formatCurrency(client.total_quoted, 'JMD')}</div>
            <div className="cs-label">Total Quoted</div>
          </div>
        )}
        {client.acceptance_rate !== undefined && (
          <div className="cs-item">
            <div className="cs-val">{client.acceptance_rate}%</div>
            <div className="cs-label">Acceptance</div>
          </div>
        )}
      </div>
    </div>
  );
}

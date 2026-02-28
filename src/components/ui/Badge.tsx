import React from 'react';
import { badgeClass } from '@/lib/utils';
import type { QuoteStatus } from '@/types';

interface Props { status: QuoteStatus; paid?: boolean }

const LABELS: Record<QuoteStatus, string> = {
  accepted: 'Accepted', sent: 'Sent', draft: 'Draft', expired: 'Expired', declined: 'Declined',
};

export default function Badge({ status, paid }: Props) {
  const label = paid && status === 'accepted' ? 'Paid' : (LABELS[status] ?? status);
  return <span className={badgeClass(status, paid)}>{label}</span>;
}

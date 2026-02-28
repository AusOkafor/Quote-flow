import { clsx, type ClassValue } from 'clsx';
import type { Currency, QuoteStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  JMD: 'J$', USD: '$', TTD: 'TT$', BBD: 'Bds$',
};

export function formatCurrency(amount: number, currency: Currency = 'JMD'): string {
  const sym = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${sym}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function relativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  // Compare calendar days in user's local timezone (not elapsed UTC time)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const quoteDayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((todayStart.getTime() - quoteDayStart.getTime()) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/** Format for expiry banners: "Jan 15" */
export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const BADGE_CLASSES: Record<QuoteStatus, string> = {
  accepted: 'badge badge-accepted',
  sent:     'badge badge-sent',
  draft:    'badge badge-draft',
  expired:  'badge badge-expired',
  declined: 'badge badge-expired',
};

export function badgeClass(status: QuoteStatus, paid?: boolean): string {
  if (paid && status === 'accepted') return 'badge badge-paid';
  return BADGE_CLASSES[status] ?? 'badge badge-draft';
}

const AVATAR_COLORS = [
  '#E85C2F', '#2F7DE8', '#2DAB6F', '#C9A84C',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
];

export function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export function getAvatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export function calcTotals(
  items: { quantity: number; unit_price: number }[],
  taxRate: number,
  taxExempt: boolean,
): { subtotal: number; taxAmount: number; total: number } {
  const subtotal  = items.reduce((s, it) => s + it.quantity * it.unit_price, 0);
  const taxAmount = taxExempt ? 0 : Math.round(subtotal * (taxRate / 100) * 100) / 100;
  return { subtotal, taxAmount, total: subtotal + taxAmount };
}

/** Returns the public quote URL for clients to open. Must point to the frontend app, not the API. */
export function quotePublicUrl(shareToken: string): string {
  const base = typeof window !== 'undefined'
    ? window.location.origin
    : (import.meta.env.VITE_APP_URL ?? 'https://quote-flow-phi.vercel.app');
  return `${base}/q/${shareToken}`;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

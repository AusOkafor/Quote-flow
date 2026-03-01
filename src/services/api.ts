import { getAccessToken } from '@/lib/supabase';
import type {
  APIResponse, APIKey, Client, CreateClientRequest, CreateQuoteRequest,
  DashboardStats, Profile, Quote, QuoteWithDetails, SendQuoteRequest,
  UnreadClientMessage, Team, TeamMember,
} from '@/types';

const BASE = (import.meta.env.VITE_API_BASE_URL as string) ?? 'https://quote-service-p3fq.onrender.com';

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });
  let json: APIResponse<T>;
  try {
    json = (await res.json()) as APIResponse<T>;
  } catch {
    const msg = res.ok ? 'Invalid response' : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  if (!res.ok || !json.success) {
    const err = new Error(json.error ?? json.message ?? `Request failed (${res.status})`);
    (err as Error & { code?: string; apiMessage?: string }).code = json.error;
    (err as Error & { code?: string; apiMessage?: string }).apiMessage = json.message;
    throw err;
  }
  return json.data as T;
}

const get   = <T>(p: string) => req<T>(p, { method: 'GET' });
const del   = <T>(p: string) => req<T>(p, { method: 'DELETE' });
const post  = <T>(p: string, b: unknown) => req<T>(p, { method: 'POST', body: JSON.stringify(b) });
const put   = <T>(p: string, b: unknown) => req<T>(p, { method: 'PUT',  body: JSON.stringify(b) });
const patch = <T>(p: string, b: unknown) => req<T>(p, { method: 'PATCH', body: JSON.stringify(b) });

export const dashboardApi = {
  getStats: (currency?: string) =>
    get<DashboardStats>(`/dashboard${currency ? `?currency=${encodeURIComponent(currency)}` : ''}`),
  getUnreadMessages: () => get<UnreadClientMessage[]>('/dashboard/unread-messages'),
};

export const profileApi = {
  get:    () => get<Profile>('/profile'),
  update: (data: Partial<Profile>) => put<Profile>('/profile', data),
};

export const teamsApi = {
  getMyTeam:      () => get<Team | null>('/teams'),
  listMembers:    (teamId: string) => get<TeamMember[]>(`/teams/${teamId}/members`),
  addMember:      (teamId: string, data: { email: string; role?: string }) =>
    post<TeamMember[]>(`/teams/${teamId}/members`, data),
  removeMember:   (teamId: string, userId: string) =>
    del<{ deleted: boolean }>(`/teams/${teamId}/members/${userId}`),
};

export const apiKeysApi = {
  list:    () => get<APIKey[]>('/api-keys'),
  create:  (data: { name: string }) => post<import('@/types').CreateAPIKeyResponse>('/api-keys', data),
  revoke:  (id: string) => del<{ deleted: boolean }>(`/api-keys/${id}`),
};

export const billingApi = {
  createCheckoutSession: (data: { plan: string; interval: string }) =>
    post<{ url: string }>('/billing/create-checkout-session', data),
};

export const userApi = {
  deleteAccount: () => del<{ deleted: boolean }>('/user'),
};

export const clientsApi = {
  list:   () => get<Client[]>('/clients'),
  get:    (id: string) => get<Client>(`/clients/${id}`),
  create: (data: CreateClientRequest) => post<Client>('/clients', data),
  update: (id: string, data: Partial<Client>) => put<Client>(`/clients/${id}`, data),
  delete: (id: string) => del<{ deleted: boolean }>(`/clients/${id}`),
};

export const quotesApi = {
  list:      (status?: string, currency?: string) => {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.set('status', status);
    if (currency) params.set('currency', currency);
    const qs = params.toString();
    return get<Quote[]>(`/quotes${qs ? `?${qs}` : ''}`);
  },
  get:       (id: string) => get<QuoteWithDetails>(`/quotes/${id}`),
  create:    (data: CreateQuoteRequest) => post<Quote>('/quotes', data),
  update:    (id: string, data: { title?: string; currency?: string; validity_days?: number; notes?: string; deposit?: string; payment_method?: string; delivery_timeline?: string; revisions?: string; tax_exempt?: boolean; tax_rate?: number; require_signature?: boolean; track_views?: boolean; send_reminder?: boolean; line_items?: { description: string; quantity: number; unit_price: number }[] }) =>
    patch<QuoteWithDetails>(`/quotes/${id}`, data),
  delete:    (id: string) => del<{ deleted: boolean }>(`/quotes/${id}`),
  duplicate: (id: string) => post<Quote>(`/quotes/${id}/duplicate`, {}),
  markPaid:  (id: string) => post<QuoteWithDetails>(`/quotes/${id}/mark-paid`, {}),
  send:      (id: string, data: SendQuoteRequest) =>
    post<{ message: string; quote_link: string; channel: string }>(`/quotes/${id}/send`, data),
  getNotes:  (id: string) => get<import('@/types').QuoteNote[]>(`/quotes/${id}/notes`),
  postNote:  (id: string, data: { message: string }) =>
    post<import('@/types').QuoteNote>(`/quotes/${id}/notes`, data),
  markNotesRead: (id: string) =>
    req<{ read: boolean }>(`/quotes/${id}/notes/read`, { method: 'PATCH' }),
  exportCSV: async (): Promise<void> => {
    const token = await getAccessToken();
    const res = await fetch(`${BASE}/quotes/export`, {
      headers: { Authorization: `Bearer ${token ?? ''}` },
    });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `quoteflow-quotes-${new Date().toISOString().slice(0, 10)}.csv`,
    });
    a.click();
    URL.revokeObjectURL(url);
  },
};

export const templatesApi = {
  list:   () => get<import('@/types').QuoteTemplate[]>('/templates'),
  create: (data: { name: string; title?: string; currency: string; validity_days: number; notes?: string; deposit?: string; payment_method?: string; delivery_timeline?: string; revisions?: string; tax_exempt: boolean; tax_rate: number; require_signature: boolean; track_views: boolean; send_reminder: boolean; line_items: { description: string; quantity: number; unit_price: number }[] }) =>
    post<import('@/types').QuoteTemplate>('/templates', data),
  createFromQuote: (data: { name: string; quote_id: string }) =>
    post<import('@/types').QuoteTemplate>('/templates/from-quote', data),
  delete: (id: string) => del<{ deleted: boolean }>(`/templates/${id}`),
};

/** Check if an error is the free tier limit (402). */
export function isFreeTierLimitError(e: unknown): boolean {
  return e instanceof Error && (e as Error & { code?: string }).code === 'free_tier_limit';
}

/** Check if an error is Pro plan required (402). */
export function isProRequiredError(e: unknown): boolean {
  return e instanceof Error && (e as Error & { code?: string }).code === 'pro_required';
}

export const publicApi = {
  getQuote:    (token: string) => req<QuoteWithDetails>(`/q/${token}`),
  acceptQuote: (token: string, signatureName?: string) =>
    req<{ accepted: boolean; quote_number: string; message: string }>(
      `/q/${token}/accept`,
      { method: 'POST', body: JSON.stringify({ signature_name: signatureName }) },
    ),
  getNotes:    (token: string) => req<import('@/types').QuoteNote[]>(`/q/${token}/notes`),
  postNote:    (token: string, data: { name: string; message: string; note_type?: 'message' | 'change_request' }) =>
    post<import('@/types').QuoteNote>(`/q/${token}/notes`, data),
};

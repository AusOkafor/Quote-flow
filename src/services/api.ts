import { getAccessToken } from '@/lib/supabase';
import type {
  APIResponse, Client, CreateClientRequest, CreateQuoteRequest,
  DashboardStats, Profile, Quote, QuoteWithDetails, SendQuoteRequest,
} from '@/types';

const BASE = (import.meta.env.VITE_API_BASE_URL as string) ?? 'http://localhost:8080';

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

const get  = <T>(p: string) => req<T>(p, { method: 'GET' });
const del  = <T>(p: string) => req<T>(p, { method: 'DELETE' });
const post = <T>(p: string, b: unknown) => req<T>(p, { method: 'POST', body: JSON.stringify(b) });
const put  = <T>(p: string, b: unknown) => req<T>(p, { method: 'PUT',  body: JSON.stringify(b) });

export const dashboardApi = {
  getStats: (currency?: string) =>
    get<DashboardStats>(`/dashboard${currency ? `?currency=${encodeURIComponent(currency)}` : ''}`),
};

export const profileApi = {
  get:    () => get<Profile>('/profile'),
  update: (data: Partial<Profile>) => put<Profile>('/profile', data),
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
  delete:    (id: string) => del<{ deleted: boolean }>(`/quotes/${id}`),
  duplicate: (id: string) => post<Quote>(`/quotes/${id}/duplicate`, {}),
  markPaid:  (id: string) => post<QuoteWithDetails>(`/quotes/${id}/mark-paid`, {}),
  send:      (id: string, data: SendQuoteRequest) =>
    post<{ message: string; quote_link: string; channel: string }>(`/quotes/${id}/send`, data),
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

/** Check if an error is the free tier limit (402). */
export function isFreeTierLimitError(e: unknown): boolean {
  return e instanceof Error && (e as Error & { code?: string }).code === 'free_tier_limit';
}

export const publicApi = {
  getQuote:    (token: string) => req<QuoteWithDetails>(`/q/${token}`),
  acceptQuote: (token: string, signatureName?: string) =>
    req<{ accepted: boolean; quote_number: string; message: string }>(
      `/q/${token}/accept`,
      { method: 'POST', body: JSON.stringify({ signature_name: signatureName }) },
    ),
};

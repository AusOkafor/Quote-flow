export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'expired' | 'declined';
export type Currency    = 'JMD' | 'USD' | 'TTD' | 'BBD';
export type SendChannel = 'email' | 'whatsapp' | 'link';
export type ToastType   = 'success' | 'info' | 'warning' | 'default';

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  business_name: string;
  profession: string;
  address: string;
  phone: string;
  email_on_quote: string;
  logo_url?: string | null;
  brand_color: string;
  default_currency: Currency;
  default_validity_days: number;
  default_deposit: string;
  default_revisions: string;
  default_notes: string;
  default_payment: string;
  tax_type: string;
  tax_rate: number;
  tax_number: string;
  tax_exempt_default: boolean;
  show_tax_breakdown: boolean;
  plan?: string;
  notify_accepted: boolean;
  notify_viewed: boolean;
  notify_expiring: boolean;
  notify_weekly: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  quote_count?: number;
  total_quoted?: number;
  acceptance_rate?: number;
  created_at: string;
  updated_at: string;
}

export interface LineItem {
  id: string;
  quote_id: string;
  position: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Quote {
  id: string;
  user_id: string;
  client_id: string;
  quote_number: string;
  title: string;
  status: QuoteStatus;
  currency: Currency;
  subtotal: number;
  tax_rate: number;
  tax_exempt: boolean;
  tax_amount: number;
  total: number;
  validity_days: number;
  expires_at: string;
  notes: string;
  deposit: string;
  payment_method: string;
  delivery_timeline: string;
  revisions: string;
  require_signature: boolean;
  track_views: boolean;
  send_reminder: boolean;
  view_count: number;
  last_viewed_at?: string;
  accepted_at?: string;
  accepted_by_name?: string;
  paid_at?: string;
  sent_at?: string;
  share_token: string;
  created_at: string;
  updated_at: string;
  client?: Client;
  line_items?: LineItem[];
  has_unread_notes?: boolean;
}

export interface QuoteNote {
  id: string;
  quote_id: string;
  author_type: 'client' | 'freelancer';
  author_name: string;
  message: string;
  read_at?: string | null;
  created_at: string;
}

export interface QuoteWithDetails extends Quote {
  client: Client;
  line_items: LineItem[];
  creator?: { logo_url?: string | null; business_name?: string; brand_color?: string };
}

export interface LineItemInput {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface CreateQuoteRequest {
  client_id: string;
  title: string;
  currency: Currency;
  validity_days: number;
  notes: string;
  deposit: string;
  payment_method: string;
  delivery_timeline: string;
  revisions: string;
  tax_exempt: boolean;
  tax_rate: number;
  require_signature: boolean;
  track_views: boolean;
  send_reminder: boolean;
  line_items: LineItemInput[];
}

export interface CreateClientRequest {
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

export interface SendQuoteRequest {
  channel: SendChannel;
  recipient_email?: string;
  recipient_phone?: string;
  message?: string;
}

export interface ActivityItem {
  id: string;
  type: 'accepted' | 'viewed' | 'expiring' | 'created' | 'sent' | 'duplicated';
  message: string;
  quote_id?: string;
  quote_number?: string;
  client_name?: string;
  occurred_at: string;
}

export interface DashboardStats {
  total_quoted_this_month: number;
  total_quoted_last_month: number;
  quoted_change_percent: number;
  quotes_accepted_this_month: number;
  quotes_accepted_last_month: number;
  acceptance_rate: number;
  avg_quote_value: number;
  total_quotes_all_time: number;
  quotes_created_this_month: number;
  draft_count: number;
  sent_count: number;
  accepted_count: number;
  expired_count: number;
  currencies_used: string[];
  recent_activity: ActivityItem[];
}

export interface QuoteTemplate {
  id: string;
  user_id: string;
  name: string;
  title: string;
  currency: Currency;
  validity_days: number;
  notes: string;
  deposit: string;
  payment_method: string;
  delivery_timeline: string;
  revisions: string;
  tax_exempt: boolean;
  tax_rate: number;
  require_signature: boolean;
  track_views: boolean;
  send_reminder: boolean;
  created_at: string;
  line_items?: TemplateLineItem[];
}

export interface TemplateLineItem {
  id: string;
  template_id: string;
  position: number;
  description: string;
  quantity: number;
  unit_price: number;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useDashboard } from '@/hooks/useDashboard';
import { useAppToast } from '@/components/layout/ToastProvider';
import { dashboardApi } from '@/services/api';
import { supabase } from '@/lib/supabase';
import { getInitials, getAvatarColor } from '@/lib/utils';

const FREE_LIMIT = 3;

const NAV_ITEMS = [
  { path: '/app',           icon: '⊞', label: 'Dashboard' },
  { path: '/app/quotes',    icon: '📄', label: 'Quotes' },
  { path: '/app/create',    icon: '✚',  label: 'New Quote' },
  { path: '/app/clients',   icon: '👥', label: 'Clients' },
  { path: '/app/settings',  icon: '⚙',  label: 'Settings' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const toast     = useAppToast();
  const { profile } = useProfile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { stats } = useDashboard();
  const [userName, setUserName] = useState<string>('');

  // Toast for unread client messages (runs on all app pages, poll every 30s)
  useEffect(() => {
    const key = 'qf_notified_quote_ids';
    const check = () => {
      let notified: string[] = [];
      try {
        const raw = sessionStorage.getItem(key);
        if (raw) notified = JSON.parse(raw) as string[];
      } catch { /* ignore */ }
      dashboardApi.getUnreadMessages()
        .then(msgs => {
          const list = Array.isArray(msgs) ? msgs : [];
          for (const m of list) {
            if (notified.includes(m.quote_id)) continue;
            const label = m.note_type === 'change_request' ? 'Requested changes' : 'New message';
            const from = m.author_name || m.client_name || 'Client';
            toast(`${label} from ${from} on #${m.quote_number}: "${m.message.slice(0, 60)}${m.message.length > 60 ? '…' : ''}"`, 'info', 0);
            notified.push(m.quote_id);
          }
          if (list.length > 0) {
            try { sessionStorage.setItem(key, JSON.stringify(notified)); } catch { /* ignore */ }
          }
        })
        .catch((e) => { console.warn('[QuoteFlow] Unread messages fetch failed:', e); });
    };
    check();
    const t = setInterval(check, 30_000);
    return () => clearInterval(t);
  }, [toast]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const name = (user?.user_metadata?.full_name as string) || (user?.user_metadata?.name as string) || profile?.business_name || user?.email?.split('@')[0] || 'Account';
      setUserName(name);
    });
  }, [profile?.business_name]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const plan = profile?.plan ?? 'free';
  const quotesUsed = stats?.quotes_created_this_month ?? 0;
  const planLabel = plan === 'pro' ? 'Pro' : `Free Plan — ${quotesUsed}/${FREE_LIMIT} quotes`;

  const closeSidebar = () => setSidebarOpen(false);
  const navTo = (path: string) => { navigate(path); closeSidebar(); };

  return (
    <div className="app-shell">
        <div className={`sidebar-backdrop ${sidebarOpen ? 'open' : ''}`} onClick={closeSidebar} aria-hidden />
        <div className="mobile-header">
          <div className="logo">Quote<span>Flow</span></div>
          <button className="hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">☰</button>
        </div>
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-logo">Quote<span>Flow</span></div>
          <div className="nav-label">Main</div>
          {NAV_ITEMS.map(item => (
            <div
              key={item.path}
              className={`nav-item${location.pathname === item.path ? ' active' : ''}`}
              onClick={() => navTo(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </div>
          ))}
          <div
            className="nav-item"
            style={{ marginTop: 8 }}
            onClick={() => navTo('/pricing')}
          >
            <span className="nav-icon">💎</span> Upgrade
          </div>
          <div className="sidebar-footer">
            <div className="sidebar-user" style={{ padding: '12px 8px', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: getAvatarColor(userName),
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {getInitials(userName)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--paper)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
                  <div style={{ fontSize: 11, color: 'rgba(245,242,236,.5)' }}>{planLabel}</div>
                </div>
              </div>
            </div>
            <div
              className="nav-item"
              style={{ color: 'rgba(245,242,236,.4)' }}
              onClick={() => { handleLogout(); closeSidebar(); }}
            >
              <span className="nav-icon">→</span> Log out
            </div>
          </div>
        </aside>

        {/* Main area */}
        <main className="main">
          {children}
        </main>
      </div>
  );
}

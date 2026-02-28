import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ToastContainer from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useProfile } from '@/hooks/useProfile';
import { useDashboard } from '@/hooks/useDashboard';
import { supabase } from '@/lib/supabase';
import { getInitials, getAvatarColor } from '@/lib/utils';

const ToastCtx = createContext<ReturnType<typeof useToast>['toast']>(() => {});

export function useAppToast() {
  return useContext(ToastCtx);
}

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
  const { toasts, toast, dismiss } = useToast();
  const { profile } = useProfile();
  const { stats } = useDashboard();
  const [userName, setUserName] = useState<string>('');

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

  return (
    <ToastCtx.Provider value={toast}>
      <div className="app-shell">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo">Quote<span>Flow</span></div>
          <div className="nav-label">Main</div>
          {NAV_ITEMS.map(item => (
            <div
              key={item.path}
              className={`nav-item${location.pathname === item.path ? ' active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </div>
          ))}
          <div
            className="nav-item"
            style={{ marginTop: 8 }}
            onClick={() => navigate('/pricing')}
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
              onClick={handleLogout}
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

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastCtx.Provider>
  );
}

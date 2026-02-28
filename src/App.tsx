import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import ToastProvider   from '@/components/layout/ToastProvider';
import AppShell        from '@/components/layout/AppShell';
import LandingPage     from '@/pages/LandingPage';
import LoginPage       from '@/pages/LoginPage';
import PricingPage     from '@/pages/PricingPage';
import PublicQuotePage from '@/pages/PublicQuotePage';
import DashboardPage   from '@/pages/DashboardPage';
import QuotesPage      from '@/pages/QuotesPage';
import CreateQuotePage from '@/pages/CreateQuotePage';
import ClientsPage     from '@/pages/ClientsPage';
import SettingsPage    from '@/pages/SettingsPage';
import type { Session } from '@supabase/supabase-js';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);
  if (session === undefined) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)', fontFamily: 'Syne' }}>Loading…</div>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
      <Routes>
        <Route path="/"         element={<LandingPage />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/pricing"  element={<PricingPage />} />
        <Route path="/q/:token" element={<PublicQuotePage />} />

        <Route path="/app" element={<AuthGuard><AppShell><DashboardPage /></AppShell></AuthGuard>} />
        <Route path="/app/quotes"   element={<AuthGuard><AppShell><QuotesPage /></AppShell></AuthGuard>} />
        <Route path="/app/create"   element={<AuthGuard><AppShell><CreateQuotePage /></AppShell></AuthGuard>} />
        <Route path="/app/clients"  element={<AuthGuard><AppShell><ClientsPage /></AppShell></AuthGuard>} />
        <Route path="/app/settings" element={<AuthGuard><AppShell><SettingsPage /></AppShell></AuthGuard>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}

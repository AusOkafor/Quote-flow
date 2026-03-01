import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Topbar           from '@/components/layout/Topbar';
import ProfilePanel     from '@/components/settings/ProfilePanel';
import DefaultsPanel    from '@/components/settings/DefaultsPanel';
import TaxPanel         from '@/components/settings/TaxPanel';
import BillingPanel     from '@/components/settings/BillingPanel';
import TemplatesPanel   from '@/components/settings/TemplatesPanel';
import AccountPanel     from '@/components/settings/AccountPanel';
import { useProfile }   from '@/hooks/useProfile';
import { useAppToast }  from '@/components/layout/ToastProvider';
import type { Profile } from '@/types';

const NAV = [
  { id: 'profile',   icon: '👤', label: 'Profile & Brand' },
  { id: 'defaults',  icon: '📋', label: 'Quote Defaults' },
  { id: 'templates', icon: '📄', label: 'Templates' },
  { id: 'tax',       icon: '🧾', label: 'Tax Settings' },
  { id: 'billing',   icon: '💳', label: 'Billing' },
  { id: 'account',   icon: '⚠️', label: 'Account' },
];

const DEFAULT_PROFILE: Profile = {
  id: '', user_id: '', business_name: '', profession: '', address: '', phone: '',
  email_on_quote: '', brand_color: '#E85C2F', default_currency: 'JMD',
  default_validity_days: 14, default_deposit: '50% upfront', default_revisions: '2 rounds',
  default_notes: '', default_payment: '', tax_type: 'GCT', tax_rate: 15, tax_number: '',
  tax_exempt_default: true, show_tax_breakdown: true, plan: 'free',
  notify_accepted: true, notify_viewed: true, notify_expiring: true, notify_weekly: false,
  created_at: '', updated_at: '',
};

export default function SettingsPage() {
  const toast = useAppToast();
  const [searchParams] = useSearchParams();
  const { profile: savedProfile, save } = useProfile();
  const [panel, setPanel] = useState('profile');

  useEffect(() => {
    const p = searchParams.get('panel');
    if (p && ['profile', 'defaults', 'templates', 'tax', 'billing', 'account'].includes(p)) {
      setPanel(p);
    }
  }, [searchParams]);
  const [local, setLocal] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);

  const profile = local ?? savedProfile ?? DEFAULT_PROFILE;
  const onChange = (updates: Partial<Profile>) => setLocal(prev => ({ ...(prev ?? profile), ...updates }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const toSave = local ?? (savedProfile ?? DEFAULT_PROFILE);
      await save(toSave);
      setLocal(null);
      toast('✅ Settings saved!', 'success');
    } catch {
      toast('Failed to save settings', 'warning');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Topbar
        title="Settings"
        actions={
          <button className="btn btn-dark" onClick={() => void handleSave()} disabled={saving || (local === null && savedProfile !== null)}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        }
      />
      <div className="page-body">
        <div className="settings-layout">
          <div className="settings-nav">
            {NAV.map(item => (
              <div key={item.id} className={`sn-item${panel === item.id ? ' active' : ''}`} onClick={() => setPanel(item.id)}>
                <span>{item.icon}</span> {item.label}
              </div>
            ))}
          </div>
          <div className="settings-panel">
            {panel === 'profile'   && <ProfilePanel  profile={profile} onChange={onChange} onError={msg => toast(msg, 'warning')} />}
            {panel === 'defaults'  && <DefaultsPanel profile={profile} onChange={onChange} />}
            {panel === 'templates' && <TemplatesPanel onError={msg => toast(msg, 'warning')} />}
            {panel === 'tax'       && <TaxPanel      profile={profile} onChange={onChange} />}
            {panel === 'billing'  && <BillingPanel />}
            {panel === 'account'  && <AccountPanel />}
          </div>
        </div>
      </div>
    </>
  );
}

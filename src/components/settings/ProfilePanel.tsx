import React, { useRef, useState } from 'react';
import Toggle from '@/components/ui/Toggle';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

interface Props {
  profile: Profile;
  onChange: (updates: Partial<Profile>) => void;
  onError?: (msg: string) => void;
}

const BRAND_COLORS = ['#E85C2F','#2DAB6F','#2F7DE8','#C9A84C','#8B5CF6','#EC4899','#0D0D0D'];

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export default function ProfilePanel({ profile, onChange, onError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleLogoClick = () => {
    if (uploading) return;
    inputRef.current?.click();
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!ACCEPTED_TYPES.includes(file.type)) {
      onError?.('Please use PNG, JPG, or SVG (max 2MB).');
      return;
    }
    if (file.size > MAX_SIZE) {
      onError?.('File too large. Max 2MB.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      onError?.('Please sign in again.');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `${user.id}/logo.${ext}`;
      const { error } = await supabase.storage.from('logos').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path);
      onChange({ logo_url: publicUrl });
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => onChange({ logo_url: null });
  const isPro = profile.plan === 'pro' || profile.plan === 'business';

  return (
    <>
      <div className="sp-title">Profile & Brand</div>
      <div className="sp-sub">Your business info shown on every quote.</div>

      <div className="sp-section">
        <div className="sp-section-title">Business Info</div>
        <div className="form-grid">
          <div className="form-group">
            <label>Business / Studio Name</label>
            <input value={profile.business_name} onChange={e => onChange({ business_name: e.target.value })} placeholder="Karl McKenzie Creative" />
          </div>
          <div className="form-group">
            <label>Profession / Title</label>
            <input value={profile.profession} onChange={e => onChange({ profession: e.target.value })} placeholder="Graphic Designer" />
          </div>
          <div className="form-group form-full">
            <label>Address</label>
            <input value={profile.address} onChange={e => onChange({ address: e.target.value })} placeholder="Kingston 10, Jamaica" />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input value={profile.phone} onChange={e => onChange({ phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Email on Quote</label>
            <input type="email" value={profile.email_on_quote} onChange={e => onChange({ email_on_quote: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="sp-section">
        <div className="sp-section-title">Brand Color</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>Used as accent on your quotes.</div>
        {!isPro && (
          <div style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 8, fontWeight: 500 }}>Pro feature — Upgrade to customize</div>
        )}
        <div className="color-swatches" style={{ opacity: isPro ? 1 : 0.6, pointerEvents: isPro ? 'auto' : 'none' }}>
          {BRAND_COLORS.map(c => (
            <div
              key={c}
              className={`swatch${profile.brand_color === c ? ' active' : ''}`}
              style={{ background: c }}
              onClick={() => isPro && onChange({ brand_color: c })}
              title={!isPro ? 'Upgrade to Pro to customize' : undefined}
            />
          ))}
        </div>
      </div>

      <div className="sp-section">
        <div className="sp-section-title">Logo</div>
        {!isPro && (
          <div style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 8, fontWeight: 500 }}>Pro feature — Upgrade to add your logo</div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleLogoChange}
          style={{ display: 'none' }}
        />
        {profile.logo_url ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, opacity: isPro ? 1 : 0.6 }}>
            <img src={profile.logo_url} alt="Logo" style={{ maxHeight: 64, maxWidth: 160, objectFit: 'contain' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={handleLogoClick} disabled={uploading || !isPro}>
                {uploading ? 'Uploading…' : 'Replace'}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => isPro && handleRemoveLogo()} style={{ color: 'var(--danger)' }} disabled={!isPro}>
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div
            className="logo-upload"
            onClick={() => isPro && handleLogoClick()}
            role="button"
            tabIndex={isPro ? 0 : -1}
            onKeyDown={e => isPro && e.key === 'Enter' && handleLogoClick()}
            style={{ opacity: isPro ? 1 : 0.6, cursor: isPro ? 'pointer' : 'not-allowed' }}
            title={!isPro ? 'Upgrade to Pro to add your logo' : undefined}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>🖼</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{uploading ? 'Uploading…' : (isPro ? 'Click to upload logo' : 'Pro feature — Upgrade to add logo')}</div>
            <div style={{ fontSize: 11, color: 'rgba(138,130,120,.6)', marginTop: 4 }}>PNG, SVG, or JPG — max 2MB</div>
          </div>
        )}
      </div>

      <div className="sp-section">
        <div className="sp-section-title">Notification Preferences</div>
        {[
          { key: 'notify_accepted' as const, label: 'Quote accepted',        sub: 'Email when a client accepts' },
          { key: 'notify_viewed'   as const, label: 'Quote viewed',          sub: 'Email when a client opens your quote' },
          { key: 'notify_expiring' as const, label: 'Expiring soon',         sub: '3 days before a quote expires' },
          { key: 'notify_weekly'   as const, label: 'Weekly digest',         sub: 'Summary every Monday morning' },
        ].map(item => (
          <div key={item.key} className="toggle-row-setting">
            <div>
              <div style={{ fontWeight: 500, fontSize: 13.5 }}>{item.label}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{item.sub}</div>
            </div>
            <Toggle checked={!!profile[item.key]} onChange={v => onChange({ [item.key]: v })} />
          </div>
        ))}
      </div>
    </>
  );
}

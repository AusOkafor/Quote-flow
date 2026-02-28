import React from 'react';
import Toggle from '@/components/ui/Toggle';
import type { Profile } from '@/types';

interface Props {
  profile: Profile;
  onChange: (updates: Partial<Profile>) => void;
}

export default function TaxPanel({ profile, onChange }: Props) {
  return (
    <>
      <div className="sp-title">Tax Settings</div>
      <div className="sp-sub">Configure GCT / VAT for your country.</div>
      <div className="form-grid">
        <div className="form-group">
          <label>Tax Type</label>
          <select value={profile.tax_type} onChange={e => onChange({ tax_type: e.target.value })}>
            <option value="GCT">GCT (Jamaica)</option>
            <option value="VAT">VAT (Trinidad & Tobago)</option>
            <option value="VAT-BB">VAT (Barbados)</option>
            <option value="None">None</option>
          </select>
        </div>
        <div className="form-group">
          <label>Tax Rate (%)</label>
          <input type="number" min={0} max={100} step={0.5} value={profile.tax_rate} onChange={e => onChange({ tax_rate: parseFloat(e.target.value) })} />
        </div>
        <div className="form-group form-full">
          <label>Tax Registration Number</label>
          <input value={profile.tax_number} onChange={e => onChange({ tax_number: e.target.value })} placeholder="e.g. TRN 123-456-789" />
        </div>
      </div>
      <div className="toggle-row-setting" style={{ marginTop: 20 }}>
        <div>
          <div style={{ fontWeight: 500, fontSize: 13.5 }}>Exempt by default</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>New quotes will start with GCT exempt checked</div>
        </div>
        <Toggle checked={profile.tax_exempt_default} onChange={v => onChange({ tax_exempt_default: v })} />
      </div>
      <div className="toggle-row-setting">
        <div>
          <div style={{ fontWeight: 500, fontSize: 13.5 }}>Show tax breakdown</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Display subtotal + tax lines on quotes</div>
        </div>
        <Toggle checked={profile.show_tax_breakdown} onChange={v => onChange({ show_tax_breakdown: v })} />
      </div>
    </>
  );
}

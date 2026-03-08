import { useState } from 'react';
import Toggle from '@/components/ui/Toggle';
import type { Profile } from '@/types';

interface Props {
  profile: Profile;
  onChange: (updates: Partial<Profile>) => void;
}

const TAX_TYPES = [
  // Caribbean
  { value: 'GCT',       label: 'GCT — Jamaica',            rate: 15 },
  { value: 'VAT_TT',    label: 'VAT — Trinidad & Tobago',  rate: 12.5 },
  { value: 'VAT_BB',    label: 'VAT — Barbados',           rate: 17.5 },
  { value: 'VAT_GY',    label: 'VAT — Guyana',             rate: 14 },
  // North America
  { value: 'HST',       label: 'HST — Canada',             rate: 13 },
  { value: 'GST_CA',    label: 'GST — Canada',             rate: 5 },
  { value: 'sales_tax', label: 'Sales Tax — United States', rate: 0 },
  // Europe
  { value: 'VAT_UK',    label: 'VAT — United Kingdom',     rate: 20 },
  { value: 'VAT_EU',    label: 'VAT — European Union',     rate: 20 },
  // Pacific / Asia
  { value: 'GST_AU',    label: 'GST — Australia',          rate: 10 },
  { value: 'GST_NZ',    label: 'GST — New Zealand',        rate: 15 },
  { value: 'GST_IN',    label: 'GST — India',              rate: 18 },
  // Latin America
  { value: 'IVA',       label: 'IVA — Latin America',      rate: 16 },
  // Generic
  { value: 'VAT',       label: 'VAT — Other',              rate: 0 },
  { value: 'tax',       label: 'Tax — Other',              rate: 0 },
  { value: 'none',      label: 'None — No tax',            rate: 0 },
];

export default function TaxPanel({ profile, onChange }: Props) {
  const [rateNote, setRateNote] = useState('');

  const handleTaxTypeChange = (value: string) => {
    const selected = TAX_TYPES.find(t => t.value === value);
    if (!selected) return;
    if (value === 'none') {
      onChange({ tax_type: value, tax_rate: 0 });
      setRateNote('');
    } else if (selected.rate > 0) {
      onChange({ tax_type: value, tax_rate: selected.rate });
      setRateNote(`Suggested rate for ${selected.label.split('—')[0].trim()}. You can change this.`);
    } else {
      onChange({ tax_type: value });
      setRateNote('Enter the applicable tax rate for your region.');
    }
  };

  return (
    <>
      <div className="sp-title">Tax Settings</div>
      <div className="sp-sub">Configure tax settings for your business.</div>
      <div className="form-grid">
        <div className="form-group">
          <label>Tax Type</label>
          <select value={profile.tax_type} onChange={e => handleTaxTypeChange(e.target.value)}>
            {TAX_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        {profile.tax_type !== 'none' && (
          <div className="form-group">
            <label>Tax Rate (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={profile.tax_rate}
              onChange={e => { onChange({ tax_rate: parseFloat(e.target.value) }); setRateNote(''); }}
            />
            {rateNote && (
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, marginBottom: 0 }}>{rateNote}</p>
            )}
          </div>
        )}
        <div className="form-group form-full">
          <label>Tax Registration Number (optional)</label>
          <input value={profile.tax_number} onChange={e => onChange({ tax_number: e.target.value })} placeholder="e.g. TRN 123-456-789" />
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, marginBottom: 0 }}>
            Only required if your local tax authority mandates it on invoices. Leave blank if not applicable.
          </p>
        </div>
      </div>
      <div className="toggle-row-setting" style={{ marginTop: 20 }}>
        <div>
          <div style={{ fontWeight: 500, fontSize: 13.5 }}>Exempt by default</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>New quotes will start with tax exempt checked</div>
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

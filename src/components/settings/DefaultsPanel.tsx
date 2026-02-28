import type { Profile, Currency } from '@/types';

interface Props {
  profile: Profile;
  onChange: (updates: Partial<Profile>) => void;
}

const CURRENCIES: Currency[] = ['JMD', 'USD', 'TTD', 'BBD'];

export default function DefaultsPanel({ profile, onChange }: Props) {
  return (
    <>
      <div className="sp-title">Quote Defaults</div>
      <div className="sp-sub">These auto-fill every new quote you create.</div>
      <div className="form-grid">
        <div className="form-group">
          <label>Default Currency</label>
          <select value={profile.default_currency} onChange={e => onChange({ default_currency: e.target.value as Currency })}>
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Quote Validity (days)</label>
          <input type="number" min={1} max={365} value={profile.default_validity_days} onChange={e => onChange({ default_validity_days: parseInt(e.target.value) })} />
        </div>
        <div className="form-group">
          <label>Default Deposit</label>
          <input value={profile.default_deposit} onChange={e => onChange({ default_deposit: e.target.value })} placeholder="50% upfront" />
        </div>
        <div className="form-group">
          <label>Default Revisions</label>
          <input value={profile.default_revisions} onChange={e => onChange({ default_revisions: e.target.value })} placeholder="2 rounds" />
        </div>
        <div className="form-group">
          <label>Default Payment Method</label>
          <input value={profile.default_payment} onChange={e => onChange({ default_payment: e.target.value })} placeholder="Bank Transfer" />
        </div>
        <div className="form-group form-full">
          <label>Default Notes / Scope</label>
          <textarea value={profile.default_notes} onChange={e => onChange({ default_notes: e.target.value })} placeholder="Files delivered via Google Drive upon final payment." />
        </div>
      </div>
    </>
  );
}

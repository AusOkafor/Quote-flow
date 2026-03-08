import type { ReactNode } from 'react';

interface Props {
  icon: ReactNode;
  color: 'orange' | 'green' | 'blue' | 'purple';
  label: string;
  value: string;
  fullValue?: string;   // shown in title tooltip
  change?: string;
  changeUp?: boolean;
}

const ICON_BG: Record<Props['color'], string> = {
  orange: '#FFF3EE',
  green:  '#EDFAF3',
  blue:   '#EEF4FF',
  purple: '#F5F0FF',
};

const ICON_COLOR: Record<Props['color'], string> = {
  orange: '#E85C2F',
  green:  '#2DAB6F',
  blue:   '#2F7DE8',
  purple: '#7C3AED',
};

export default function MetricCard({ icon, color, label, value, fullValue, change, changeUp }: Props) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-label">{label}</span>
        <div
          className="stat-icon"
          style={{ background: ICON_BG[color], color: ICON_COLOR[color] }}
        >
          {icon}
        </div>
      </div>
      <div
        className="stat-value"
        title={fullValue}
      >
        {value}
      </div>
      {change && (
        <div className={`stat-footer`}>
          <span className={`stat-change ${changeUp ? 'positive' : 'negative'}`}>
            {change}
          </span>
        </div>
      )}
    </div>
  );
}

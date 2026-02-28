import React from 'react';

interface Props {
  icon: string;
  color: 'orange' | 'green' | 'blue' | 'gold';
  label: string;
  value: string;
  change?: string;
  changeUp?: boolean;
}

const COLOR_MAP = { orange: 'mc-orange', green: 'mc-green', blue: 'mc-blue', gold: 'mc-gold' };

export default function MetricCard({ icon, color, label, value, change, changeUp }: Props) {
  return (
    <div className={`metric-card ${COLOR_MAP[color]}`}>
      <div className="metric-icon">{icon}</div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {change && (
        <div className={`metric-change ${changeUp ? 'mc-up' : 'mc-down'}`}>{change}</div>
      )}
    </div>
  );
}

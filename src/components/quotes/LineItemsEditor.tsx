import React from 'react';
import { formatCurrency, calcTotals } from '@/lib/utils';
import type { LineItemInput, Currency } from '@/types';

interface Props {
  items: LineItemInput[];
  onChange: (items: LineItemInput[]) => void;
  currency: Currency;
  taxRate: number;
  taxExempt: boolean;
}

export default function LineItemsEditor({ items, onChange, currency, taxRate, taxExempt }: Props) {
  const update = (i: number, field: keyof LineItemInput, value: string | number) => {
    const next = items.map((item, idx) => idx === i ? { ...item, [field]: field === 'description' ? value : Number(value) } : item);
    onChange(next);
  };

  const add = () => onChange([...items, { description: '', quantity: 1, unit_price: 0 }]);

  const remove = (i: number) => {
    if (items.length <= 1) return;
    onChange(items.filter((_, idx) => idx !== i));
  };

  const { subtotal, taxAmount, total } = calcTotals(items, taxRate, taxExempt);

  return (
    <>
      <div className="li-table">
        <div className="li-head">
          <span>Description</span>
          <span>Qty</span>
          <span>Unit Price</span>
          <span>Total</span>
          <span />
        </div>
        {items.map((item, i) => (
          <div className="li-row" key={i}>
            <input
              placeholder="Service description…"
              value={item.description}
              onChange={e => update(i, 'description', e.target.value)}
            />
            <input
              type="number" min="0.01" step="0.01"
              value={item.quantity || ''}
              onChange={e => update(i, 'quantity', e.target.value)}
              placeholder="1"
            />
            <input
              type="number" min="0" step="0.01"
              value={item.unit_price || ''}
              onChange={e => update(i, 'unit_price', e.target.value)}
              placeholder="0.00"
            />
            <span className="li-total">
              {formatCurrency(item.quantity * item.unit_price, currency)}
            </span>
            <button className="li-del" onClick={() => remove(i)} title="Remove">×</button>
          </div>
        ))}
      </div>

      <button className="li-add" onClick={add}>＋ Add another item</button>

      <div className="totals-wrap">
        <div className="totals-inner">
          <div className="tot-row">
            <span className="tot-label">Subtotal</span>
            <span className="tot-val">{formatCurrency(subtotal, currency)}</span>
          </div>
          <div className="tot-row">
            <span className="tot-label">{taxExempt ? 'GCT (Exempt)' : `GCT (${taxRate}%)`}</span>
            <span className="tot-val">{taxExempt ? '—' : formatCurrency(taxAmount, currency)}</span>
          </div>
          <div className="tot-row grand">
            <span className="tot-label">Total</span>
            <span className="tot-val">{formatCurrency(total, currency)}</span>
          </div>
        </div>
      </div>
    </>
  );
}

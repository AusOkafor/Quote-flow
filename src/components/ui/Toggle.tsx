
interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
}

export default function Toggle({ checked, onChange, id, disabled }: Props) {
  return (
    <label className={`toggle${disabled ? ' disabled' : ''}`} htmlFor={id} style={disabled ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={e => !disabled && onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="toggle-track" />
      <span className="toggle-thumb" />
    </label>
  );
}

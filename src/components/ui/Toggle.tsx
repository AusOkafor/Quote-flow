
interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}

export default function Toggle({ checked, onChange, id }: Props) {
  return (
    <label className="toggle" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
      <span className="toggle-track" />
      <span className="toggle-thumb" />
    </label>
  );
}

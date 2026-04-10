import { h } from 'preact';
import { useState } from 'preact/hooks';
import { CHEVRON_DOWN_ICON } from "../../utils/icons";

interface Option {
  label: string;
  value: any;
}

interface AppSelectProps {
  value?: string;
  options?: Option[];
  name?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

export function AppSelect({
  value = "",
  options = [],
  name = "",
  disabled = false,
  onChange
}: AppSelectProps) {
  const [localValue, setLocalValue] = useState(value);

  function handleChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    setLocalValue(target.value);
    if (onChange) onChange(target.value);
  }

  return (
    <select
      name={name}
      disabled={disabled}
      style={{ backgroundImage: `url('${CHEVRON_DOWN_ICON}')` }}
      onChange={handleChange}
    >
      {options.map(opt => (
        <option
          value={opt.value}
          selected={String(opt.value) === String(localValue)}
        >
          {opt.label}
        </option>
      ))}
    </select>
  );
}
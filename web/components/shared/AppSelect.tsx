import { h } from 'preact';
import { CHEVRON_DOWN_ICON } from "../../utils/icons";

interface AppSelectProps {
  value?: string | number;
  options?: { label: string; value: any }[];
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
  const handleChange = (e: any) => {
    const newValue = e.target.value;
    if (onChange) onChange(newValue);
  };

  return (
    <select
      class="select select-bordered w-full h-12 bg-base-200 border-base-content/5 focus:border-primary focus:outline-none transition-all rounded-xl font-medium text-sm"
      name={name}
      disabled={disabled}
      value={value}
      onChange={handleChange}
    >
      {options.map((opt) => (
        <option
          key={opt.value}
          value={opt.value}
        >
          {opt.label}
        </option>
      ))}
    </select>
  );
}

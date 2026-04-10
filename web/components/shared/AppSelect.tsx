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
    <div className="app-select-wrapper" style={{ width: '100%' }}>
      <style>{`
        .app-select-wrapper select {
          width: 100%;
          height: 48px;
          padding: 0 16px;
          border-radius: 10px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          font-size: 14px;
          font-weight: 500;
          appearance: none;
          cursor: pointer;
          transition: all 0.2s;
          outline: none;
          box-sizing: border-box;
          background-repeat: no-repeat;
          background-position: right .7em top 50%;
          background-size: .65em auto;
        }
        .app-select-wrapper select:focus:not(:disabled) {
          border-color: var(--accent-color);
          box-shadow: 0 0 0 2px rgba(255, 71, 87, 0.1);
        }
        .app-select-wrapper select:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
      <select
        name={name}
        disabled={disabled}
        style={{ backgroundImage: `url('${CHEVRON_DOWN_ICON}')` }}
        value={value}
        onChange={handleChange}
      >
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            selected={String(opt.value) === String(value)}
          >
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

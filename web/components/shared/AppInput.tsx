import { h } from 'preact';

interface AppInputProps {
  value?: string;
  type?: string;
  placeholder?: string;
  name?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  onInput?: (e: any) => void;
}

export function AppInput({ 
  value = "", 
  type = "text", 
  placeholder = "", 
  name = "", 
  disabled = false,
  onChange,
  onInput
}: AppInputProps) {
  const handleChange = (e: any) => {
    const newValue = e.target.value;
    if (onChange) onChange(newValue);
  };

  const handleInput = (e: any) => {
    if (onInput) onInput(e);
  };

  return (
    <div className="app-input-wrapper" style={{ width: '100%' }}>
      <style>{`
        .app-input-wrapper input {
          width: 100%;
          height: 48px;
          padding: 0 16px;
          border-radius: 10px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
          outline: none;
          box-sizing: border-box;
        }
        .app-input-wrapper input:focus:not(:disabled) {
          border-color: var(--accent-color);
          box-shadow: 0 0 0 2px rgba(255, 71, 87, 0.1);
        }
        .app-input-wrapper input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
      <input
        type={type}
        name={name}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onInput={handleInput}
        onChange={handleChange}
      />
    </div>
  );
}

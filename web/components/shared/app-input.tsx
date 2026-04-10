import { h } from 'preact';
import { useState } from 'preact/hooks';

interface AppInputProps {
  value?: string;
  type?: string;
  placeholder?: string;
  name?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

export function AppInput({
  value = "",
  type = "text",
  placeholder = "",
  name = "",
  disabled = false,
  onChange
}: AppInputProps) {
  const [localValue, setLocalValue] = useState(value);

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    setLocalValue(target.value);
    if (onChange) onChange(target.value);
  }

  return (
    <input
      type={type}
      name={name}
      value={localValue}
      placeholder={placeholder}
      disabled={disabled}
      onInput={handleInput}
    />
  );
}
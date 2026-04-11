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
    <input
      class="input input-bordered w-full h-12 bg-base-200 border-base-content/5 focus:border-primary focus:outline-none transition-all rounded-xl font-medium text-sm"
      type={type}
      name={name}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onInput={handleInput}
      onChange={handleChange}
    />
  );
}

import { h, Fragment, type ComponentChildren } from 'preact';

interface AppFieldProps {
  label?: string;
  error?: string;
  children?: ComponentChildren;
  style?: any;
}

export function AppField({
  label = "",
  error = "",
  children,
  style = {}
}: AppFieldProps) {
  return (
    <div className="form-control w-full" style={style}>
      {label && (
        <label class="label pt-0">
          <span class="label-text text-[10px] font-black uppercase tracking-widest opacity-50 text-base-content/60">{label}</span>
        </label>
      )}
      <div class="w-full">
        {children}
      </div>
      {error && (
        <label class="label pb-0">
          <span class="label-text-alt text-error font-bold">{error}</span>
        </label>
      )}
    </div>
  );
}

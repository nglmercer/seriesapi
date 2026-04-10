import { h, ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import i18next from "../../utils/i18n";

interface AppFieldProps {
  label?: string;
  error?: string;
  children?: ComponentChildren;
}

export function AppField({ label = "", error = "", children }: AppFieldProps) {
  return (
    <div>
      {label ? <label class="label">{label}</label> : null}
      <div class="field-content">
        {children}
      </div>
      {error ? <span class="error">{error}</span> : null}
    </div>
  );
}
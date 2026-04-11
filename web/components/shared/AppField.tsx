import { h, Fragment, type ComponentChildren } from 'preact';

interface AppFieldProps {
  label?: string;
  error?: string;
  children?: ComponentChildren;
}

export function AppField({
  label = "",
  error = "",
  children
}: AppFieldProps) {
  return (
    <div className="app-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      <style>{`
        .app-field .label {
          font-size: 12px;
          font-weight: 800;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
          display: block;
        }
        .app-field .error {
          font-size: 11px;
          color: var(--error-color);
          margin-top: 4px;
          font-weight: 600;
          display: block;
        }
        .app-field .field-content {
          width: 100%;
        }
      `}</style>
      {label && <label className="label">{label}</label>}
      <div className="field-content">
        {children}
      </div>
      {error && <span className="error">{error}</span>}
    </div>
  );
}

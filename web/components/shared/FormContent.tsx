import { h } from 'preact';
import { useState } from 'preact/hooks';
import i18next from "../../utils/i18n";
import { AppField } from "./AppField";
import { AppInput } from "./AppInput";
import { AppSelect } from "./AppSelect";

export interface FormField {
  label: string;
  name: string;
  type: string;
  value?: any;
  options?: { label: string; value: any }[];
  width?: string;
  placeholder?: string;
}

interface FormContentProps {
  title: string;
  fields: FormField[];
  onSave: (data: any) => void;
  onCancel: () => void;
  saveLabel?: string;
  cancelLabel?: string;
}

export function FormContent({ 
  title, 
  fields, 
  onSave, 
  onCancel,
  saveLabel = i18next.language === 'es' ? "Guardar" : "Save",
  cancelLabel = i18next.language === 'es' ? "Cancelar" : "Cancel"
}: FormContentProps) {
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    fields.forEach(f => {
      initial[f.name] = f.value ?? (f.type === 'checkbox' ? false : "");
    });
    return initial;
  });

  const handleFieldChange = (name: string, value: any, type: string) => {
    let finalValue = value;
    if (type === "number") {
      finalValue = parseFloat(value || '0');
    }
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const renderField = (f: FormField) => {
    const isCheckbox = f.type === "checkbox";
    
    return (
      <AppField 
        key={f.name}
        label={f.label}
        style={{ 
          flex: `1 1 ${f.width || '100%'}`, 
          display: 'flex', 
          flexDirection: isCheckbox ? 'row-reverse' : 'column',
          justifyContent: isCheckbox ? 'flex-end' : 'flex-start',
          alignItems: isCheckbox ? 'center' : 'stretch',
          gap: isCheckbox ? '12px' : '8px'
        }}
      >
        {f.type === "select" ? (
          <AppSelect
            name={f.name}
            options={f.options || []}
            value={String(formData[f.name] || '')}
            onChange={(val) => handleFieldChange(f.name, val, f.type)}
          />
        ) : f.type === "checkbox" ? (
          <input 
            type="checkbox" 
            name={f.name} 
            checked={!!formData[f.name]} 
            class="checkbox checkbox-primary rounded-lg"
            onChange={(e) => handleFieldChange(f.name, (e.target as HTMLInputElement).checked, f.type)}
          />
        ) : f.type === "textarea" ? (
          <textarea 
            name={f.name} 
            class="textarea textarea-bordered w-full min-h-[120px] bg-base-200 border-base-content/5 focus:border-primary focus:outline-none transition-all rounded-xl font-medium"
            onInput={(e) => handleFieldChange(f.name, (e.target as HTMLTextAreaElement).value, f.type)}
            value={formData[f.name] || ""}
          />
        ) : (
          <AppInput
            name={f.name}
            type={f.type}
            value={String(formData[f.name] || '')}
            placeholder={f.placeholder || ''}
            onChange={(val) => handleFieldChange(f.name, val, f.type)}
          />
        )}
      </AppField>
    );
  };

  return (
    <div class="flex flex-col gap-6">
      <div class="flex flex-wrap gap-x-6 gap-y-4">
        {fields.map(f => renderField(f))}
      </div>
      <div class="flex justify-end gap-3 mt-6 pt-6 border-t border-base-content/5">
        <button 
          class="btn btn-ghost h-12 px-8 rounded-xl font-black text-sm hover:bg-base-content/5 transition-all"
          onClick={onCancel}
        >
          {cancelLabel}
        </button>
        <button 
          class="btn btn-primary h-12 px-10 rounded-xl font-black text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all border-none"
          onClick={() => onSave(formData)}
        >
          {saveLabel}
        </button>
      </div>
    </div>
  );
}

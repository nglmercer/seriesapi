import { h } from "./dom";
import i18next from "i18next";
import { AppField } from "../components/shared/app-field";
import { AppInput } from "../components/shared/app-input";
import { AppSelect } from "../components/shared/app-select";

/**
 * Premium UI Utilities for async alerts and prompts.
 */
class UI {
  private static createModal(content: HTMLElement, wide = false): { modal: HTMLElement; close: () => void } {
    const overlay = h("div", {
      className: "modal-overlay",
      style: `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        backdrop-filter: blur(4px);
        animation: fadeIn 0.2s ease;
      `
    });

    const modal = h("div", {
      className: "card modal-card",
      style: `
        width: 100%;
        max-width: ${wide ? '600px' : '400px'};
        max-height: 90vh;
        overflow-y: auto;
        margin: 20px;
        padding: 24px;
        animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      `
    });

    modal.appendChild(content);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const close = () => {
      overlay.style.opacity = "0";
      modal.style.transform = "translateY(20px)";
      setTimeout(() => document.body.removeChild(overlay), 200);
    };

    return { modal: overlay, close };
  }

  static alert(message: string, title = "Notice"): Promise<void> {
    return new Promise((resolve) => {
      const content = h("div", {},
        h("h3", { style: "margin-top:0;" }, title),
        h("p", { style: "margin-bottom: 24px; color: var(--text-secondary);" }, message),
        h("div", { style: "display:flex; justify-content: flex-end;" },
          h("button", { 
            className: "primary",
            onclick: () => {
              close();
              resolve();
            }
          }, "OK")
        )
      );

      const { close } = this.createModal(content);
    });
  }

  static toast(message: string, type: "success" | "error" | "info" = "info") {
    const toast = h("div", {
      className: `toast toast-${type}`,
      style: `
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 12px 24px;
        border-radius: 12px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        font-weight: 600;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideUp 0.3s ease-out;
      `
    }, message);

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(20px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }

  static prompt(message: string, defaultValue = "", title = "Prompt"): Promise<string | null> {
    return new Promise((resolve) => {
      const input = h("input", { 
        type: "text", 
        value: defaultValue, 
        placeholder: "Type here...",
        style: "width: 100%; margin-bottom: 24px;",
        onkeydown: (e: KeyboardEvent) => {
          if (e.key === "Enter") confirm();
          if (e.key === "Escape") cancel();
        }
      }) as HTMLInputElement;

      const confirm = () => {
        const val = input.value;
        close();
        resolve(val);
      };

      const cancel = () => {
        close();
        resolve(null);
      };

      const content = h("div", {},
        h("h3", { style: "margin-top:0;" }, title),
        h("p", { style: "margin-bottom: 12px; color: var(--text-secondary);" }, message),
        input,
        h("div", { style: "display:flex; justify-content: flex-end; gap: 10px;" },
          h("button", { onclick: cancel }, "Cancel"),
          h("button", { className: "primary", onclick: confirm }, "Confirm")
        )
      );

      const { close } = this.createModal(content);
      setTimeout(() => input.focus(), 50);
    });
  }

  static confirm(message: string, title = "Confirm Action"): Promise<boolean> {
    return new Promise((resolve) => {
       const content = h("div", {},
        h("h3", { style: "margin-top:0;" }, title),
        h("p", { style: "margin-bottom: 24px; color: var(--text-secondary);" }, message),
        h("div", { style: "display:flex; justify-content: flex-end; gap: 10px;" },
          h("button", { onclick: () => { close(); resolve(false); } }, "No"),
          h("button", { className: "danger", onclick: () => { close(); resolve(true); } }, "Yes, Proceed")
        )
      );
      const { close } = this.createModal(content);
    });
  }

  static form<T>(title: string, fields: { label: string; name: string; type: string; value?: any; options?: { label: string; value: any }[]; width?: string; placeholder?: string }[]): Promise<T | null> {
    return new Promise((resolve) => {
      const inputs: Record<string, any> = {};
      
      const fieldElements = fields.map(f => {
        let input: HTMLElement;
        
        if (f.type === "select") {
          const select = document.createElement("app-select") as AppSelect;
          select.name = f.name;
          select.options = f.options || [];
          select.value = f.value || "";
          input = select;
        } else if (f.type === "checkbox") {
          input = h("input", { type: "checkbox", name: f.name, checked: !!f.value, style: "width: 20px; height: 20px; cursor: pointer;" });
        } else if (f.type === "textarea") {
          input = h("textarea", { 
            name: f.name, 
            style: "width: 100%; min-height: 100px; padding: 12px 16px; border-radius: 10px; background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 14px; font-weight: 500; transition: all 0.2s; outline: none; resize: vertical;" 
          }, f.value || "");
          input.addEventListener("focus", () => (input.style.borderColor = "var(--accent-color)"));
          input.addEventListener("blur", () => (input.style.borderColor = "var(--border-color)"));
        } else {
          const appInput = document.createElement("app-input") as AppInput;
          appInput.name = f.name;
          appInput.type = f.type;
          appInput.value = f.value || "";
          appInput.placeholder = f.placeholder || "";
          input = appInput;
        }
        
        inputs[f.name] = input;
        
        const field = document.createElement("app-field") as AppField;
        field.label = f.label;
        field.style.flex = `1 1 ${f.width || '100%'}`;
        if (f.type === "checkbox") {
            field.style.flexDirection = "row-reverse";
            field.style.justifyContent = "flex-end";
            field.style.alignItems = "center";
            field.style.gap = "10px";
        }
        field.appendChild(input);
        
        return field;
      });

      const formContent = h("div", { className: "ui-form", style: "display: flex; flex-direction: column; gap: 24px;" },
        h("h3", { style: "margin: 0; font-size: 20px; font-weight: 800; border-bottom: 2px solid var(--border-color); padding-bottom: 16px; color: var(--text-primary);" }, title),
        h("div", { style: "display: flex; flex-wrap: wrap; gap: 20px;" }, ...fieldElements),
        h("div", { style: "display:flex; justify-content: flex-end; gap: 12px; margin-top: 12px; border-top: 1px solid var(--border-color); padding-top: 20px;" },
          h("button", { 
            style: "background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-primary); font-weight: 600;",
            onclick: () => { close(); resolve(null); } 
          }, i18next.language === 'es' ? "Cancelar" : "Cancel"),
          h("button", { 
            className: "primary", 
            style: "font-weight: 700; padding: 0 32px;",
            onclick: () => {
              const res: any = {};
              fields.forEach(f => {
                const input = inputs[f.name];
                if (f.type === "checkbox") {
                    res[f.name] = (input as HTMLInputElement).checked;
                } else if (input instanceof AppInput || input instanceof AppSelect) {
                    res[f.name] = input.value;
                    if (f.type === "number") res[f.name] = parseFloat(res[f.name] || '0');
                } else {
                    res[f.name] = (input as HTMLInputElement | HTMLTextAreaElement).value;
                    if (f.type === "number") res[f.name] = parseFloat(res[f.name] || '0');
                }
              });
              close();
              resolve(res);
            }
          }, i18next.language === 'es' ? "Guardar" : "Save")
        )
      );

      const { close } = this.createModal(formContent, true);
    });
  }
}
window.alert = (message: any) => {
  if (typeof message === "string")
    UI.alert(message);
  else if (message instanceof Error)
    UI.alert(message.message);
  else
    UI.alert(JSON.stringify(message));
};
export const ui = UI;

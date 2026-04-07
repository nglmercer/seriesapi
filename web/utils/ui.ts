import { h } from "./dom";
import i18next from "i18next";
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

  static form<T>(title: string, fields: { label: string; name: string; type: string; value?: any; options?: { label: string; value: any }[]; width?: string }[]): Promise<T | null> {
    return new Promise((resolve) => {
      const inputs: Record<string, any> = {};
      
      const fieldElements = fields.map(f => {
        let input;
        const style = `width: 100%; ${f.type === 'checkbox' ? 'width: auto;' : ''}`;
        
        if (f.type === "textarea") {
          input = h("textarea", { name: f.name, rows: 4, style }, f.value || "");
        } else if (f.type === "select") {
          input = h("select", { name: f.name, style }, 
            ...(f.options || []).map(opt => h("option", { value: opt.value, selected: opt.value === f.value }, opt.label))
          );
        } else if (f.type === "checkbox") {
          input = h("input", { type: "checkbox", name: f.name, checked: !!f.value });
        } else {
          input = h("input", { type: f.type, name: f.name, value: f.value || "", style });
        }
        
        inputs[f.name] = input;
        
        const containerStyle = `display: flex; flex-direction: ${f.type === 'checkbox' ? 'row-reverse' : 'column'}; gap: 6px; ${f.type === 'checkbox' ? 'justify-content: flex-end; align-items: center;' : ''} flex: 1 1 ${f.width || '100%'};`;
        
        return h("div", { style: containerStyle },
          h("label", { style: `font-size: 13px; font-weight: 600; ${f.type === 'checkbox' ? 'margin: 0;' : ''}` }, f.label),
          input
        );
      });

      const formContent = h("div", { className: "ui-form", style: "display: flex; flex-direction: column; gap: 20px;" },
        h("h3", { style: "margin-top:0; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;" }, title),
        h("div", { style: "display: flex; flex-wrap: wrap; gap: 16px;" }, ...fieldElements),
        h("div", { style: "display:flex; justify-content: flex-end; gap: 10px; margin-top: 10px; border-top: 1px solid var(--border-color); padding-top: 16px;" },
          h("button", { onclick: () => { close(); resolve(null); } }, i18next.language === 'es' ? "Cancelar" : "Cancel"),
          h("button", { 
            className: "primary", 
            onclick: () => {
              const res: any = {};
              fields.forEach(f => {
                if (f.type === "checkbox") {
                    res[f.name] = (inputs[f.name] as HTMLInputElement).checked;
                } else {
                    res[f.name] = inputs[f.name].value;
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

export const ui = UI;

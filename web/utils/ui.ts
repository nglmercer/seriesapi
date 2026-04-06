import { h } from "./dom";

/**
 * Premium UI Utilities for async alerts and prompts.
 */
class UI {
  private static createModal(content: HTMLElement): { modal: HTMLElement; close: () => void } {
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
        max-width: 400px;
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
}

export const ui = UI;

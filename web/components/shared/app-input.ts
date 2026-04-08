import { LitElement, html, css } from "lit";
import { property } from "lit/decorators.js";

export class AppInput extends LitElement {
  @property({ type: String }) value = "";
  @property({ type: String }) type = "text";
  @property({ type: String }) placeholder = "";
  @property({ type: String }) name = "";
  @property({ type: Boolean }) disabled = false;

  static override styles = css`
    :host {
      display: block;
      width: 100%;
    }
    input {
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
    input:focus:not(:disabled) {
      border-color: var(--accent-color);
      box-shadow: 0 0 0 2px rgba(255, 71, 87, 0.1);
    }
    input:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `;

  override render() {
    return html`
      <input
        .type="${this.type}"
        .name="${this.name}"
        .value="${this.value}"
        .placeholder="${this.placeholder}"
        ?disabled="${this.disabled}"
        @input="${this._onInput}"
      />
    `;
  }

  private _onInput(e: InputEvent) {
    this.value = (e.target as HTMLInputElement).value;
    this.dispatchEvent(new CustomEvent("change", { detail: { value: this.value } }));
  }
}

if (!customElements.get("app-input")) {
  customElements.define("app-input", AppInput);
}

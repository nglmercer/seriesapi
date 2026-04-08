import { LitElement, html, css } from "lit";
import { property } from "lit/decorators.js";
import { CHEVRON_DOWN_ICON } from "../../utils/icons";

export class AppSelect extends LitElement {
  @property({ type: String }) value = "";
  @property({ type: Array }) options: { label: string; value: any }[] = [];
  @property({ type: String }) name = "";
  @property({ type: Boolean }) disabled = false;

  static override styles = css`
    :host {
      display: block;
      width: 100%;
    }
    select {
      width: 100%;
      height: 48px;
      padding: 0 16px;
      border-radius: 10px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      font-size: 14px;
      font-weight: 500;
      appearance: none;
      cursor: pointer;
      transition: all 0.2s;
      outline: none;
      box-sizing: border-box;
      background-repeat: no-repeat;
      background-position: right .7em top 50%;
      background-size: .65em auto;
    }
    select:focus:not(:disabled) {
      border-color: var(--accent-color);
      box-shadow: 0 0 0 2px rgba(255, 71, 87, 0.1);
    }
    select:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `;

  override render() {
    return html`
      <select
        .name="${this.name}"
        ?disabled="${this.disabled}"
        style="background-image: url('${CHEVRON_DOWN_ICON}');"
        @change="${this._onChange}"
      >
        ${this.options.map(
          (opt) => html`
            <option
              value="${opt.value}"
              ?selected="${String(opt.value) === String(this.value)}"
            >
              ${opt.label}
            </option>
          `
        )}
      </select>
    `;
  }

  private _onChange(e: Event) {
    this.value = (e.target as HTMLSelectElement).value;
    this.dispatchEvent(new CustomEvent("change", { detail: { value: this.value } }));
  }
}

if (!customElements.get("app-select")) {
  customElements.define("app-select", AppSelect);
}

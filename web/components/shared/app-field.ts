import { LitElement, html, css } from "lit";
import { property } from "lit/decorators.js";

export class AppField extends LitElement {
  @property({ type: String }) label = "";
  @property({ type: String }) error = "";

  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 6px;
      width: 100%;
    }
    .label {
      font-size: 12px;
      font-weight: 800;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
      display: block;
    }
    .error {
      font-size: 11px;
      color: var(--error-color);
      margin-top: 4px;
      font-weight: 600;
      display: block;
    }
    .field-content {
      width: 100%;
    }
  `;

  override render() {
    return html`
      ${this.label ? html`<label class="label">${this.label}</label>` : ""}
      <div class="field-content">
        <slot></slot>
      </div>
      ${this.error ? html`<span class="error">${this.error}</span>` : ""}
    `;
  }
}

if (!customElements.get("app-field")) {
  customElements.define("app-field", AppField);
}

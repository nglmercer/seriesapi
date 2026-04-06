import {LitElement, html, css} from "lit";
import {customElement, property} from "lit/decorators.js";

@customElement("empty-state")
export class EmptyState extends LitElement {
  static override styles = css`
    :host { display: block; }
    .empty { text-align: center; padding: 40px 20px; background: #f8f9fa; border: 1px solid #a2a9b1; border-radius: 2px; }
    .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
    .empty-title { font-size: 18px; font-weight: bold; color: #202122; margin-bottom: 8px; }
    .empty-message { color: #72777d; font-size: 14px; }
  `;

  @property({type: String}) title = "No content found";
  @property({type: String}) message = "The requested content does not exist or has been removed.";

  override render() {
    return html`
      <div class="empty">
        <div class="empty-icon">📭</div>
        <div class="empty-title">${this.title}</div>
        <div class="empty-message">${this.message}</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "empty-state": EmptyState;
  }
}
import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import i18next from "../../utils/i18n";

@customElement("admin-bulk-bar")
export class AdminBulkBar extends LitElement {
  static override styles = css`
    :host { display: block; }
    .bulk-actions { 
      background: var(--accent-color); 
      color: white; 
      padding: 12px 24px; 
      border-radius: 16px; 
      display: flex; 
      align-items: center; 
      justify-content: space-between; 
      margin-bottom: 24px; 
      box-shadow: 0 8px 30px rgba(255, 71, 87, 0.3); 
      animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1); 
    }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    .bulk-edit-btn { 
      background: white; 
      border: none; 
      color: var(--accent-color); 
      padding: 8px 20px; 
      border-radius: 8px; 
      cursor: pointer; 
      font-size: 14px; 
      font-weight: 700; 
      transition: all 0.2s; 
      box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
    }
    .bulk-edit-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,0,0,0.15); }
    .cancel-btn { 
      background: transparent; 
      border: 1px solid rgba(255,255,255,0.4); 
      color: white; 
      padding: 8px 16px; 
      border-radius: 8px; 
      cursor: pointer; 
      font-size: 13px; 
      font-weight: 600; 
      transition: all 0.2s;
    }
    .cancel-btn:hover { background: rgba(255,255,255,0.1); }
  `;

  @property({ type: Number }) selectedCount = 0;

  private onAction(action: string) {
    this.dispatchEvent(new CustomEvent("action", { detail: action }));
  }

  override render() {
    if (this.selectedCount === 0) return html``;

    return html`
      <div class="bulk-actions">
        <div style="display: flex; align-items: center; gap: 20px;">
          <div style="display: flex; flex-direction: column;">
            <strong style="font-size: 16px;">
              ${i18next.t("admin.selected_count", { count: this.selectedCount, defaultValue: `${this.selectedCount} selected` })}
            </strong>
            <span style="font-size: 11px; opacity: 0.8; text-transform: uppercase; font-weight: 700;">Bulk Actions</span>
          </div>
          <div style="height: 30px; width: 1px; background: rgba(255,255,255,0.2);"></div>
          <div style="display: flex; gap: 8px;">
            <button class="bulk-edit-btn" @click=${() => this.onAction("bulk-edit")}>
              ${i18next.t("admin.bulk_edit", { defaultValue: "Bulk Edit" })}
            </button>
          </div>
        </div>
        <button class="cancel-btn" @click=${() => this.onAction("cancel")}>
          ${i18next.t("admin.cancel", { defaultValue: "Cancel" })}
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "admin-bulk-bar": AdminBulkBar;
  }
}

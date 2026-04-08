import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import i18next from "../../utils/i18n";
import type { MediaItem } from "../../services/api-service";

@customElement("admin-media-list")
export class AdminMediaList extends LitElement {
  static override styles = css`
    :host { display: block; width: 100%; }
    .media-admin-list { 
      display: grid; 
      gap: 12px; 
      width: 100%;
      box-sizing: border-box;
    }
    .admin-card {
      display: flex; 
      align-items: center; 
      gap: 16px;
      padding: 10px 16px;
      border-radius: 12px;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      transition: all 0.2s ease;
      box-sizing: border-box;
      width: 100%;
      min-width: 0;
      overflow: hidden;
    }
    .admin-card:hover {
      border-color: var(--accent-color);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .admin-card.selected {
      border: 2px solid var(--accent-color); 
      background: var(--bg-secondary); 
    }
    .card-main { 
      display: flex; 
      align-items: center; 
      gap: 16px; 
      flex: 1; 
      min-width: 0; 
      overflow: hidden;
    }
    .card-info { 
      flex: 1; 
      min-width: 0; 
      overflow: hidden;
    }
    .card-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 2px;
      width: 100%;
    }
    .card-title {
      font-size: 15px;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      min-width: 0;
      color: var(--text-primary);
    }
    .card-meta { 
      color: var(--text-secondary); 
      font-size: 13px; 
      display: flex; 
      gap: 12px;
      align-items: center;
    }
    .badge {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 6px;
      background: var(--bg-secondary);
      color: var(--text-secondary);
    }
    .actions { display: flex; gap: 8px; }
    .action-btn {
      padding: 8px 16px; 
      border-radius: 8px; 
      border: 1px solid var(--border-color); 
      background: var(--bg-secondary); 
      color: var(--text-primary); 
      font-weight: 700; 
      font-size: 13px; 
      cursor: pointer; 
      transition: all 0.2s; 
    }
    .action-btn:hover { background: var(--bg-primary); border-color: var(--accent-color); }
    .action-btn.danger { color: #ff4757; }
    .action-btn.danger:hover { background: #ff4757; color: white; border-color: #ff4757; }
    .checkbox-wrapper { display: flex; align-items: center; }
    input[type="checkbox"] {
      width: 18px; 
      height: 18px; 
      cursor: pointer; 
      accent-color: var(--accent-color); 
    }
  `;

  @property({ type: Array }) media: MediaItem[] = [];
  @property({ type: Object }) selectedIds: Set<number> = new Set();

  override render() {
    if (this.media.length === 0) {
      return html`
        <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
          ${i18next.t("admin.no_results", { defaultValue: "No results found" })}
        </div>
      `;
    }

    return html`
      <div class="media-admin-list">
        ${this.media.map(item => html`
          <div class="admin-card ${this.selectedIds.has(item.id) ? 'selected' : ''}">
            <div class="checkbox-wrapper">
              <input 
                type="checkbox" 
                .checked=${this.selectedIds.has(item.id)}
                @change=${() => this.dispatchEvent(new CustomEvent("toggle-select", { detail: item.id }))}
              >
            </div>
            <div class="card-main">
              <div class="card-info">
                <div class="card-title-row">
                  <div class="card-title">${item.title}</div>
                  <div class="badge">${item.content_type}</div>
                </div>
                <div class="card-meta">
                  <span>ID: ${item.id}</span>
                  <span>${item.status}</span>
                </div>
              </div>
            </div>
            <div class="actions">
              <button class="action-btn" @click=${() => this.dispatchEvent(new CustomEvent("edit-media", { detail: item.id }))}>
                ${i18next.t("admin.edit")}
              </button>
              <button class="action-btn danger" @click=${() => this.dispatchEvent(new CustomEvent("delete-media", { detail: item.id }))}>
                ${i18next.t("admin.delete")}
              </button>
            </div>
          </div>
        `)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "admin-media-list": AdminMediaList;
  }
}

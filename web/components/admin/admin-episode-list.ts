import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import i18next from "../../utils/i18n";
import { type EpisodeItem } from "../../services/api-service";

@customElement("admin-episode-list")
export class AdminEpisodeList extends LitElement {
  static override styles = css`
    :host { display: block; }
    .episodes-container { display: block; }
    .episodes-grid { display: flex; flex-direction: column; gap: 8px; }
    .card { 
      margin: 0; 
      padding: 12px; 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      border: 1px solid var(--border-color); 
      background: var(--bg-primary); 
      border-radius: 10px; 
      transition: all 0.2s; 
    }
    .empty-state {
      text-align: center; 
      padding: 40px; 
      color: var(--text-secondary); 
      background: var(--bg-secondary); 
      border-radius: 12px; 
      border: 1px dashed var(--border-color);
    }
    .primary { 
      height: 32px; 
      padding: 0 12px; 
      border-radius: 8px; 
      font-weight: 700; 
      font-size: 13px;
      background: var(--accent-color);
      color: white;
      border: none;
      cursor: pointer;
    }
    .danger {
      padding: 6px 10px; 
      font-size: 12px; 
      font-weight: 700; 
      background: var(--error-color); 
      color: white; 
      border-radius: 6px; 
      cursor: pointer; 
      border: none;
    }
    .edit-btn {
      padding: 6px 10px; 
      font-size: 12px; 
      font-weight: 700; 
      border: 1px solid var(--border-color); 
      border-radius: 6px; 
      cursor: pointer;
      background: var(--bg-secondary);
      color: var(--text-primary);
    }
    .episode-badge {
      font-weight: 800; 
      font-size: 14px; 
      color: var(--accent-color); 
      background: rgba(255, 71, 87, 0.1); 
      padding: 4px 8px; 
      border-radius: 6px; 
      min-width: 45px; 
      text-align: center;
    }
  `;

  @property({ type: Array }) episodes: EpisodeItem[] = [];
  @property({ type: Number }) seasonId: number | null = null;

  override render() {
    if (!this.seasonId) {
      return html`
        <div class="empty-state">
          <div style="font-size: 32px; margin-bottom: 12px;">👈</div>
          <p style="font-weight:700;">${i18next.t("admin.select_season_desc")}</p>
        </div>
      `;
    }

    return html`
      <div class="episodes-container">
        <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom:15px;">
          <h3 style="margin:0; font-size:18px; font-weight:800;">${i18next.t("admin.episodes")}</h3>
          <button class="primary" @click=${() => this.dispatchEvent(new CustomEvent("add-episode"))}>
            ${i18next.t("admin.add_episode")}
          </button>
        </div>
        <div class="episodes-grid">
          ${this.episodes.map(ep => html`
            <div class="card">
              <div style="display:flex; align-items:center; gap:12px; min-width:0; flex:1;">
                <div class="episode-badge">E${ep.episode_number}</div>
                <span style="font-weight:600; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                  ${ep.title || i18next.t("admin.no_title")}
                </span>
              </div>
              <div style="display:flex; gap: 8px; flex-shrink:0;">
                <button class="edit-btn" @click=${() => this.dispatchEvent(new CustomEvent("edit-episode", { detail: ep }))}>
                  ${i18next.t("admin.edit")}
                </button>
                <button class="danger" @click=${() => this.dispatchEvent(new CustomEvent("delete-episode", { detail: ep.id }))}>
                  ${i18next.t("admin.delete")}
                </button>
              </div>
            </div>
          `)}
          ${this.episodes.length === 0 ? html`
            <div style="text-align:center; padding: 20px; color: var(--text-secondary); border: 1px dashed var(--border-color); border-radius:10px;">
              ${i18next.t("admin.no_episodes_found", { defaultValue: "No episodes added yet" })}
            </div>
          ` : ""}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "admin-episode-list": AdminEpisodeList;
  }
}

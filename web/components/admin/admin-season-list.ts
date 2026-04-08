import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import i18next from "../../utils/i18n";
import { ICONS } from "../../utils/icons";
import { type SeasonItem } from "../../services/api-service";

@customElement("admin-season-list")
export class AdminSeasonList extends LitElement {
  static override styles = css`
    :host { display: block; }
    .seasons-container { display: block; }
    .seasons-grid { display: flex; flex-direction: column; gap: 8px; }
    .card { 
      margin: 0; 
      padding: 12px; 
      cursor: pointer; 
      border: 1px solid var(--border-color); 
      background: var(--bg-primary); 
      transition: all 0.2s; 
      border-radius: 8px;
    }
    .card.active { 
      border-color: var(--accent-color); 
      background: rgba(255, 71, 87, 0.05); 
    }
    .primary { 
      width: 32px; 
      height: 32px; 
      padding: 0; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      border-radius: 8px;
      background: var(--accent-color);
      color: white;
      border: none;
      cursor: pointer;
    }
    .edit-btn {
      padding: 6px; 
      background: var(--bg-secondary); 
      border: none; 
      border-radius: 6px; 
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `;

  @property({ type: Array }) seasons: SeasonItem[] = [];
  @property({ type: Number }) selectedId: number | null = null;

  override render() {
    return html`
      <div class="seasons-container">
        <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom:15px;">
          <h3 style="margin:0; font-size:18px; font-weight:800;">${i18next.t("admin.seasons")}</h3>
          <button class="primary" @click=${() => this.dispatchEvent(new CustomEvent("add-season"))}>+</button>
        </div>
        <div class="seasons-grid">
          ${this.seasons.map(s => {
            const isSelected = this.selectedId === s.id;
            return html`
              <div 
                class="card ${isSelected ? 'active' : ''}" 
                @click=${() => this.dispatchEvent(new CustomEvent("select-season", { detail: s.id }))}
              >
                <div style="display:flex; justify-content: space-between; align-items:center;">
                  <div style="display:flex; flex-direction:column; gap:2px;">
                    <span style="font-weight:800; font-size:14px;">S${s.season_number}</span>
                    <span style="font-size:12px; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:120px;">
                      ${s.name || i18next.t("admin.no_title")}
                    </span>
                  </div>
                  <button 
                    class="edit-btn"
                    @click=${(e: Event) => { e.stopPropagation(); this.dispatchEvent(new CustomEvent("edit-season", { detail: s })); }}
                  >
                    ${ICONS.edit}
                  </button>
                </div>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "admin-season-list": AdminSeasonList;
  }
}

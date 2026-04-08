import {LitElement, html, css} from "lit";
import {customElement, property, state} from "lit/decorators.js";
import {type MediaItem} from "../../services/api-service";
import "./wiki-infobox";
import "../shared/empty-state";
import "../shared/report-modal";
import "../shared/rating-widget";
import "../shared/comments-section";
import i18next from "../../utils/i18n";
import { eventBus } from "../../utils/events";
import { ICONS } from "../../utils/icons";

interface SeasonData {
  id: number;
  season_number: number;
  episode_count: number;
  name: string;
}

@customElement("media-detail")
export class MediaDetail extends LitElement {
  static override styles = css`
    :host { display: block; --accent: #ff4757; }
    .container { display: flex; gap: 32px; padding: 24px 0; }
    .wiki-main { flex: 1; min-width: 0; }
    .wiki-sidebar { width: 320px; flex-shrink: 0; }
    
    .back-link { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 24px; color: var(--text-secondary); font-size: 14px; font-weight: 500; cursor: pointer; transition: color 0.2s; }
    .back-link:hover { color: var(--accent); }
    
    .page-title { font-size: 42px; font-weight: 800; margin: 0 0 24px 0; letter-spacing: -1px; }
    
    .section { margin-bottom: 40px; }
    .section-title { font-size: 22px; font-weight: 700; margin-bottom: 20px; color: var(--text-primary); display: flex; align-items: center; gap: 10px; }
    .section-title::after { content: ""; flex: 1; height: 1px; background: var(--border-color); }
    
    .synopsis { font-size: 16px; line-height: 1.8; color: var(--text-secondary); white-space: pre-wrap; }
    
    .seasons-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; }
    .season-card { 
      background: var(--bg-secondary); 
      border: 1px solid var(--border-color); 
      border-radius: 12px; 
      padding: 20px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }
    .season-card:hover { border-color: var(--accent); transform: translateY(-4px); box-shadow: 0 10px 20px -5px rgba(0,0,0,0.1); }
    .season-name { font-size: 18px; font-weight: 700; display: block; margin-bottom: 8px; }
    .season-count { font-size: 14px; color: var(--text-secondary); font-weight: 500; }
    
    .filter-bar { margin-bottom: 24px; display: flex; align-items: center; gap: 12px; }
    .filter-bar select {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      outline: none;
    }
    .filter-bar select:focus { border-color: var(--accent); }

    /* ── Mobile Layout ── */
    @media (max-width: 900px) {
      .container { flex-direction: column; gap: 24px; padding: 16px 0; }
      .wiki-sidebar { width: 100%; order: -1; }
      .page-title { font-size: 32px; margin-bottom: 16px; }
      .section { margin-bottom: 32px; }
      .seasons-grid { grid-template-columns: 1fr; }
    }
  `;

  @property({type: Number}) mediaId = 0;
  @property({type: Object}) media: MediaItem | null = null;
  @property({type: Array}) allSeasons: SeasonData[] = [];
  @state() selectedSeason: number | null = null;
  @state() showReportModal = false;

  private handleBack() {
    eventBus.emit("back", undefined);
  }

  private handleSeasonChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    this.selectedSeason = target.value ? parseInt(target.value, 10) : null;
  }

  private handleSeasonClick(seasonId: number) {
    eventBus.emit("season-select", {mediaId: this.mediaId, seasonId});
  }

  override render() {
    if (!this.media) {
      return html``;
    }

    const uniqueSeasons = this.allSeasons.filter((s, i, arr) => 
      arr.findIndex(x => x.season_number === s.season_number) === i
    );

    return html`
      <div class="back-link" @click=${this.handleBack}>
        ${ICONS.back}
        ${i18next.t("media.back_to_explorer")}
      </div>
      <div class="container">
        <div class="wiki-sidebar">
          <wiki-infobox .media=${this.media}></wiki-infobox>
        </div>
        
        <div class="wiki-main">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
            <h1 class="page-title" style="margin-bottom: 0;">${this.media.title}</h1>
            <div style="display: flex; align-items: center; gap: 16px;">
              <button @click=${() => this.showReportModal = true} style="background: transparent; border: none; cursor: pointer; color: var(--text-secondary);" title="Report Issue">
                ${ICONS.report}
              </button>
            </div>
          </div>
          
          <div style="margin-bottom: 30px;">
            <rating-widget 
              entityType="media" 
              .entityId=${this.media.id}
              .average=${this.media.rating_average || 0}
              .count=${this.media.rating_count || 0}
            ></rating-widget>
          </div>
          
          <report-modal 
            .open=${this.showReportModal} 
            entityType="media" 
            .entityId=${this.media.id}
            @closed=${() => this.showReportModal = false}
          ></report-modal>
          
          ${this.media.synopsis ? html`
            <div class="section">
              <h2 class="section-title">${i18next.t("media.synopsis")}</h2>
              <div class="synopsis">${this.media.synopsis}</div>
            </div>
          ` : ""}

          ${uniqueSeasons.length > 0 ? html`
            <div class="section">
              <h2 class="section-title">${i18next.t("media.seasons")}</h2>
              <div class="filter-bar">
                <select @change=${this.handleSeasonChange}>
                  <option value="">${i18next.t("media.all_seasons")}</option>
                  ${uniqueSeasons.map(s => html`
                    <option value=${s.season_number}>${s.name || `${i18next.t("media.season")} ${s.season_number}`}</option>
                  `)}
                </select>
              </div>
              <div class="seasons-grid">
                ${uniqueSeasons.filter(s => this.selectedSeason === null || s.season_number === this.selectedSeason).map(s => html`
                  <div class="season-card" @click=${() => this.handleSeasonClick(s.id)}>
                    <span class="season-name">${s.name || `${i18next.t("media.season")} ${s.season_number}`}</span>
                    <span class="season-count">${i18next.t("media.episodes_count", { count: s.episode_count })}</span>
                  </div>
                `)}
              </div>
            </div>
          ` : ""}
          
          <comments-section entityType="media" .entityId=${this.media.id}></comments-section>

        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "media-detail": MediaDetail;
  }
}

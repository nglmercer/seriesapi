import {LitElement, html, css} from "lit";
import {customElement, property, state} from "lit/decorators.js";
import {api, type MediaItem} from "../../services/api-service";
import i18next from "../../utils/i18n";
import "./wiki-infobox";
import "../shared/empty-state";

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

    .loading { text-align: center; padding: 60px; color: var(--text-secondary); font-size: 18px; }
  `;

  @property({type: Number}) mediaId = 0;
  @state() media: MediaItem | null = null;
  @state() allSeasons: SeasonData[] = [];
  @state() selectedSeason: number | null = null;
  @state() loading = true;
  @state() error = false;

  override connectedCallback() {
    super.connectedCallback();
    this.load();
  }

  async load() {
    if (!this.mediaId) {
      this.error = true;
      this.loading = false;
      return;
    }
    this.loading = true;
    this.error = false;
    
    const [detailRes, seasonsRes] = await Promise.all([
      api.getMediaDetail(this.mediaId),
      api.getMediaSeasons(this.mediaId)
    ]);
    
    if (detailRes.ok && detailRes.data) {
      this.media = detailRes.data;
    } else {
      this.error = true;
    }
    if (seasonsRes.ok && seasonsRes.data) {
      this.allSeasons = seasonsRes.data as SeasonData[];
    }
    this.loading = false;
  }

  private handleBack() {
    this.dispatchEvent(new CustomEvent("back", {bubbles: true, composed: true}));
  }

  private handleSeasonChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    this.selectedSeason = target.value ? parseInt(target.value, 10) : null;
  }

  private handleSeasonClick(seasonId: number) {
    this.dispatchEvent(new CustomEvent("season-select", {detail: {mediaId: this.mediaId, seasonId}, bubbles: true, composed: true}));
  }

  override render() {
    if (this.loading) return html`<div class="loading">${i18next.t("media.loading") || "Loading..."}</div>`;
    if (this.error || !this.media) {
      return html`<empty-state title="Page not found" message="This page does not exist or has been removed."></empty-state>`;
    }

    const uniqueSeasons = this.allSeasons.filter((s, i, arr) => 
      arr.findIndex(x => x.season_number === s.season_number) === i
    );

    return html`
      <div class="back-link" @click=${this.handleBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        ${i18next.t("media.back_to_explorer")}
      </div>
      <div class="container">
        <div class="wiki-sidebar">
          <wiki-infobox .media=${this.media}></wiki-infobox>
        </div>
        
        <div class="wiki-main">
          <h1 class="page-title">${this.media.title}</h1>
          
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

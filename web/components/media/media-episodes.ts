import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { api, type EpisodeItem, type MediaItem } from "../../services/api-service";
import i18next from "../../utils/i18n";
import "../shared/empty-state";

@customElement("media-episodes")
export class MediaEpisodes extends LitElement {
  static override styles = css`
    :host { display: block; --accent: #ff4757; }
    .header { margin-bottom: 32px; }
    
    .back-link { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 24px; color: var(--text-secondary); font-size: 14px; font-weight: 500; cursor: pointer; transition: color 0.2s; }
    .back-link:hover { color: var(--accent); }
    
    .title { font-size: 36px; font-weight: 800; margin: 0 0 12px 0; letter-spacing: -1px; display: flex; align-items: center; gap: 16px; }
    .title small { font-size: 18px; font-weight: 500; color: var(--text-secondary); background: var(--bg-secondary); padding: 4px 12px; border-radius: 6px; }
    
    .episodes-list { display: flex; flex-direction: column; gap: 16px; }
    .episode-card { 
      display: flex; 
      gap: 24px; 
      background: var(--bg-secondary); 
      border: 1px solid var(--border-color); 
      padding: 24px; 
      border-radius: 12px;
      transition: all 0.3s ease;
    }
    .episode-card:hover { border-color: var(--accent); transform: translateX(8px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    
    .episode-thumb-container { width: 220px; height: 124px; flex-shrink: 0; position: relative; border-radius: 8px; overflow: hidden; background: #222; }
    .episode-thumb { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
    .episode-card:hover .episode-thumb { transform: scale(1.05); }
    
    .episode-info { flex: 1; min-width: 0; }
    .episode-title { font-size: 20px; font-weight: 700; margin-bottom: 8px; color: var(--text-primary); display: flex; align-items: center; gap: 12px; }
    .episode-number { width: 28px; height: 28px; background: var(--accent); color: white; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 13px; }
    
    .episode-meta { font-size: 14px; color: var(--text-secondary); margin-bottom: 12px; display: flex; gap: 16px; }
    .episode-synopsis { font-size: 15px; line-height: 1.6; color: var(--text-secondary); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    
    .loading { text-align: center; padding: 60px; color: var(--text-secondary); font-size: 18px; }
  `;

  @property({ type: Number }) mediaId = 0;
  @property({ type: Number }) seasonId = 0;
  @state() episodes: EpisodeItem[] = [];
  @state() media: MediaItem | null = null;
  @state() season: any = null;
  @state() loading = true;
  @state() error = false;

  override connectedCallback() {
    super.connectedCallback();
    this.load();
  }

  async load() {
    if (!this.seasonId) return;
    this.loading = true;
    
    const [epRes, mediaRes, seasonRes] = await Promise.all([
      api.getSeasonEpisodes(this.seasonId),
      api.getMediaDetail(this.mediaId),
      api.getSeason(this.seasonId)
    ]);

    if (epRes.ok) this.episodes = epRes.data;
    if (mediaRes.ok) this.media = mediaRes.data;
    if (seasonRes.ok) this.season = seasonRes.data;
    
    this.loading = false;
  }

  private handleBack() {
    this.dispatchEvent(new CustomEvent("back", { bubbles: true, composed: true }));
  }

  override render() {
    if (this.loading) return html`<div class="loading">${i18next.t("media.loading") || "Loading episodes..."}</div>`;
    if (this.error) return html`<empty-state title="Error" message="Failed to load episodes."></empty-state>`;

    return html`
      <div class="header">
        <div class="back-link" @click=${this.handleBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          ${i18next.t("episodes.back_to_series")}
        </div>
        <h1 class="title">
          ${this.media?.title}
          <small>${this.season?.name || `${i18next.t("media.season")} ${this.season?.season_number || ''}`}</small>
        </h1>
      </div>

      <div class="episodes-list">
        ${this.episodes.map(ep => html`
          <div class="episode-card">
            <div class="episode-thumb-container">
              <img class="episode-thumb" src=${ep.still_url || "https://via.placeholder.com/220x124?text=No+Thumbnail"} alt=${ep.title}>
            </div>
            <div class="episode-info">
              <div class="episode-title">
                <span class="episode-number">${ep.episode_number}</span>
                ${ep.title}
              </div>
              <div class="episode-meta">
                ${ep.air_date ? html`<span>${i18next.t("episodes.air_date", { date: new Date(ep.air_date).toLocaleDateString() })}</span>` : ""}
                ${ep.runtime_minutes ? html`<span> • ${i18next.t("episodes.min", { count: ep.runtime_minutes })}</span>` : ""}
              </div>
              <div class="episode-synopsis">${ep.synopsis || i18next.t("episodes.no_synopsis")}</div>
            </div>
          </div>
        `)}
      </div>
      
      ${this.episodes.length === 0 ? html`<empty-state title=${i18next.t("episodes.no_episodes_title") || "No episodes"} message=${i18next.t("episodes.no_episodes")}></empty-state>` : ""}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "media-episodes": MediaEpisodes;
  }
}

import {LitElement, html, css} from "lit";
import {customElement, property, state} from "lit/decorators.js";
import {api, type MediaItem} from "./api-service";

@customElement("media-detail")
export class MediaDetail extends LitElement {
  static override styles = css`
    :host { display: block; }
    .container { display: flex; gap: 24px; padding: 24px; background: #121212; min-height: 100vh; }
    .poster { width: 280px; flex-shrink: 0; border-radius: 12px; object-fit: cover; }
    .info { flex: 1; }
    .title { font-size: 32px; font-weight: 700; color: #fff; margin-bottom: 8px; }
    .original-title { font-size: 18px; color: #888; margin-bottom: 16px; }
    .meta { display: flex; gap: 16px; margin-bottom: 16px; color: #aaa; }
    .rating { color: #fbbf24; font-weight: 600; }
    .synopsis { font-size: 16px; line-height: 1.6; color: #ccc; margin-bottom: 24px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 20px; font-weight: 600; color: #fff; margin-bottom: 12px; }
    .genres { display: flex; gap: 8px; flex-wrap: wrap; }
    .genre { background: #2a2a2a; padding: 6px 12px; border-radius: 16px; color: #fff; font-size: 14px; }
    .seasons { display: flex; flex-direction: column; gap: 8px; }
    .season { display: flex; justify-content: space-between; background: #1e1e1e; padding: 12px 16px; border-radius: 8px; cursor: pointer; }
    .season:hover { background: #2a2a2a; }
    .back { position: fixed; top: 20px; left: 20px; background: #333; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; z-index: 100; }
    .loading { text-align: center; padding: 40px; color: #888; }
  `;

  @property({type: Number}) mediaId = 0;
  @state() media: MediaItem | null = null;
  @state() seasons: Array<{id: number; number: number; title: string; episodeCount: number}> = [];
  @state() loading = true;

  override connectedCallback() {
    super.connectedCallback();
    this.load();
  }

  async load() {
    if (!this.mediaId) return;
    this.loading = true;
    
    const [detailRes, seasonsRes] = await Promise.all([
      api.getMediaDetail(this.mediaId),
      api.getMediaSeasons(this.mediaId)
    ]);
    
    if (detailRes.ok) {
      this.media = detailRes.data;
    }
    if (seasonsRes.ok) {
      this.seasons = seasonsRes.data as Array<{id: number; number: number; title: string; episodeCount: number}>;
    }
    this.loading = false;
  }

  private handleBack() {
    this.dispatchEvent(new CustomEvent("back", {bubbles: true, composed: true}));
  }

  private handleSeasonClick(seasonId: number) {
    this.dispatchEvent(new CustomEvent("season-select", {detail: {mediaId: this.mediaId, seasonId}, bubbles: true, composed: true}));
  }

  override render() {
    if (this.loading) return html`<div class="loading">Loading...</div>`;
    if (!this.media) return html`<div class="loading">Not found</div>`;

    return html`
      <button class="back" @click=${this.handleBack}>← Back</button>
      <div class="container">
        <img class="poster" src=${this.media.poster || ""} alt=${this.media.title} />
        <div class="info">
          <div class="title">${this.media.title}</div>
          <div class="original-title">${this.media.originalTitle || ""}</div>
          <div class="meta">
            <span>${this.media.year}</span>
            <span>${this.media.type}</span>
            <span>${this.media.status}</span>
            ${this.media.rating ? html`<span class="rating">★ ${this.media.rating}</span>` : ""}
          </div>
          
          ${this.media.genres && this.media.genres.length > 0 ? html`
            <div class="section">
              <div class="genres">
                ${this.media.genres.map(g => html`<span class="genre">${g}</span>`)}
              </div>
            </div>
          ` : ""}

          ${this.media.synopsis ? html`
            <div class="synopsis">${this.media.synopsis}</div>
          ` : ""}

          ${this.seasons.length > 0 ? html`
            <div class="section">
              <div class="section-title">Seasons</div>
              <div class="seasons">
                ${this.seasons.map(s => html`
                  <div class="season" @click=${() => this.handleSeasonClick(s.id)}>
                    <span>${s.title || `Season ${s.number}`}</span>
                    <span>${s.episodeCount} episodes</span>
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
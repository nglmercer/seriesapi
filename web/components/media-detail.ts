import {LitElement, html, css} from "lit";
import {customElement, property, state} from "lit/decorators.js";
import {api, type MediaItem} from "./api-service";
import "./wiki-infobox";
import "./empty-state";

@customElement("media-detail")
export class MediaDetail extends LitElement {
  static override styles = css`
    :host { display: block; }
    .container { display: flex; gap: 24px; padding: 16px; }
    .wiki-main { flex: 1; min-width: 0; }
    .wiki-sidebar { width: 300px; flex-shrink: 0; }
    .page-title { font-family: sans-serif; font-size: 28px; font-weight: normal; border-bottom: 1px solid #a2a9b1; padding-bottom: 8px; margin-bottom: 16px; color: #202122; }
    .back-link { display: inline-block; margin-bottom: 12px; color: #0645ad; font-size: 14px; cursor: pointer; }
    .back-link:hover { text-decoration: underline; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 20px; font-weight: bold; border-bottom: 1px solid #a2a9b1; padding-bottom: 8px; margin-bottom: 12px; color: #202122; }
    .synopsis { font-size: 15px; line-height: 1.7; color: #202122; background: #f8f9fa; padding: 16px; border: 1px solid #a2a9b1; border-radius: 2px; }
    .seasons { display: flex; flex-direction: column; gap: 8px; }
    .season { display: flex; justify-content: space-between; background: #f8f9fa; padding: 12px 16px; border: 1px solid #a2a9b1; border-radius: 2px; cursor: pointer; }
    .season:hover { background: #eaecf0; }
    .season-title { color: #0645ad; }
    .season-episodes { color: #72777d; font-size: 14px; }
    .loading { text-align: center; padding: 40px; color: #72777d; }
  `;

  @property({type: Number}) mediaId = 0;
  @state() media: MediaItem | null = null;
  @state() seasons: Array<{id: number; number: number; title: string; episodeCount: number}> = [];
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
    if (this.error || !this.media) {
      return html`<empty-state title="Page not found" message="This page does not exist or has been removed."></empty-state>`;
    }

    return html`
      <a class="back-link" @click=${this.handleBack}>← Back</a>
      <div class="container">
        <div class="wiki-sidebar">
          <wiki-infobox .media=${this.media}></wiki-infobox>
        </div>
        
        <div class="wiki-main">
          <h1 class="page-title">${this.media.title}</h1>
          
          ${this.media.synopsis ? html`
            <div class="section">
              <h2 class="section-title">Synopsis</h2>
              <div class="synopsis">${this.media.synopsis}</div>
            </div>
          ` : ""}

          ${this.seasons.length > 0 ? html`
            <div class="section">
              <h2 class="section-title">Seasons</h2>
              <div class="seasons">
                ${this.seasons.map(s => html`
                  <div class="season" @click=${() => this.handleSeasonClick(s.id)}>
                    <span class="season-title">${s.title || `Season ${s.number}`}</span>
                    <span class="season-episodes">${s.episodeCount} episodes</span>
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
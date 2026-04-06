import {LitElement, html, css} from "lit";
import {customElement, property} from "lit/decorators.js";
import type {MediaItem} from "./api-service";

@customElement("wiki-infobox")
export class WikiInfobox extends LitElement {
  static override styles = css`
    :host { display: block; }
    .infobox { background: #f8f9fa; border: 1px solid #a2a9b1; padding: 8px; border-radius: 2px; font-size: 14px; }
    .infobox-title { background: #eaecf0; text-align: center; font-weight: bold; padding: 8px; border-bottom: 1px solid #a2a9b1; font-size: 16px; }
    .infobox-image { text-align: center; padding: 8px 0; }
    .infobox-image img { max-width: 220px; height: auto; border-radius: 2px; }
    .infobox-data { width: 100%; border-collapse: collapse; }
    .infobox-data td { padding: 6px 8px; vertical-align: top; }
    .infobox-label { font-weight: bold; width: 40%; color: #202122; }
    .infobox-value { color: #202122; }
    .infobox-section { border-top: 1px solid #a2a9b1; padding-top: 8px; margin-top: 8px; }
    .infobox-section-title { font-weight: bold; font-size: 13px; margin-bottom: 8px; }
    .infobox-list { list-style: none; padding: 0; margin: 0; }
    .infobox-list li { padding: 4px 0; color: #0645ad; }
  `;

  @property({type: Object}) media: MediaItem | null = null;

  override render() {
    if (!this.media) return html``;
    return html`
      <div class="infobox">
        <div class="infobox-title">${this.media.title}</div>
        
        ${this.media.poster ? html`
          <div class="infobox-image">
            <img src=${this.media.poster} alt=${this.media.title} />
          </div>
        ` : ""}
        
        <table class="infobox-data">
          ${this.media.originalTitle ? html`
            <tr>
              <td class="infobox-label">Original title</td>
              <td class="infobox-value">${this.media.originalTitle}</td>
            </tr>
          ` : ""}
          
          ${this.media.type ? html`
            <tr>
              <td class="infobox-label">Type</td>
              <td class="infobox-value">${this.media.type}</td>
            </tr>
          ` : ""}
          
          ${this.media.year ? html`
            <tr>
              <td class="infobox-label">Year</td>
              <td class="infobox-value">${this.media.year}</td>
            </tr>
          ` : ""}
          
          ${this.media.status ? html`
            <tr>
              <td class="infobox-label">Status</td>
              <td class="infobox-value">${this.media.status}</td>
            </tr>
          ` : ""}
          
          ${this.media.rating ? html`
            <tr>
              <td class="infobox-label">Rating</td>
              <td class="infobox-value">★ ${this.media.rating}/10</td>
            </tr>
          ` : ""}
          
          ${this.media.episodes ? html`
            <tr>
              <td class="infobox-label">Episodes</td>
              <td class="infobox-value">${this.media.episodes}</td>
            </tr>
          ` : ""}
          
          ${this.media.duration ? html`
            <tr>
              <td class="infobox-label">Duration</td>
              <td class="infobox-value">${this.media.duration} min</td>
            </tr>
          ` : ""}
          
          ${this.media.genres && Array.isArray(this.media.genres) && this.media.genres.length > 0 ? html`
            <tr>
              <td class="infobox-label">Genres</td>
              <td class="infobox-value">
                ${this.media.genres.map((g: unknown) => typeof g === 'string' ? g : (g as {name: string}).name).join(", ")}
              </td>
            </tr>
          ` : ""}
        </table>
        
        ${this.media.synopsis ? html`
          <div class="infobox-section">
            <div class="infobox-section-title">Synopsis</div>
            <p style="font-size: 13px; line-height: 1.5;">${this.media.synopsis}</p>
          </div>
        ` : ""}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wiki-infobox": WikiInfobox;
  }
}
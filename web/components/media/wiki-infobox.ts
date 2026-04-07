import {LitElement, html, css} from "lit";
import {customElement, property} from "lit/decorators.js";
import type {MediaItem} from "../../services/api-service";
import i18next from "../../utils/i18n";

@customElement("wiki-infobox")
export class WikiInfobox extends LitElement {
  static override styles = css`
    :host { display: block; --accent: #ff4757; }
    .infobox { 
      background: var(--bg-secondary); 
      border: 1px solid var(--border-color); 
      border-radius: 12px; 
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .infobox-title { 
      background: var(--accent); 
      color: white;
      text-align: center; 
      font-weight: 800; 
      padding: 16px; 
      font-size: 18px; 
      letter-spacing: -0.5px;
    }
    .infobox-image { text-align: center; background: #000; display: flex; justify-content: center; }
    .infobox-image img { max-width: 100%; height: auto; display: block; }
    
    .infobox-data { width: 100%; border-collapse: collapse; margin: 8px 0; }
    .infobox-data tr { border-bottom: 1px solid var(--border-color); }
    .infobox-data tr:last-child { border-bottom: none; }
    .infobox-data td { padding: 12px 16px; vertical-align: middle; font-size: 14px; }
    
    .infobox-label { 
      font-weight: 700; 
      width: 40%; 
      color: var(--text-secondary);
      background: rgba(0,0,0,0.02);
    }
    .infobox-value { color: var(--text-primary); font-weight: 500; }
    
    .infobox-section { border-top: 10px solid var(--bg-primary); padding: 16px; }
    .infobox-section-title { 
      font-weight: 800; 
      font-size: 14px; 
      margin-bottom: 8px; 
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-secondary);
    }
    .infobox-section-content { font-size: 14px; line-height: 1.6; color: var(--text-secondary); }

    @media (max-width: 900px) {
      .infobox-image img { max-height: 400px; width: auto; margin: 0 auto; }
    }
  `;

  @property({type: Object}) media: MediaItem | null = null;

  override render() {
    if (!this.media) return html``;
    return html`
      <div class="infobox">
        <div class="infobox-title">${this.media.title}</div>
        
        <div class="infobox-image">
          <img src=${this.media.poster_url || this.media.poster} alt=${this.media.title} />
        </div>
        
        <table class="infobox-data">
          ${this.media.original_title || this.media.originalTitle ? html`
            <tr>
              <td class="infobox-label">${i18next.t("infobox.original_title")}</td>
              <td class="infobox-value">${this.media.original_title || this.media.originalTitle}</td>
            </tr>
          ` : ""}
          
          ${this.media.content_type || this.media.type ? html`
            <tr>
              <td class="infobox-label">${i18next.t("infobox.type")}</td>
              <td class="infobox-value">${this.media.content_type || this.media.type}</td>
            </tr>
          ` : ""}
          
          ${this.media.release_date || this.media.year ? html`
            <tr>
              <td class="infobox-label">${i18next.t("infobox.release")}</td>
              <td class="infobox-value">${this.media.release_date || this.media.year}</td>
            </tr>
          ` : ""}
          
          ${this.media.status ? html`
            <tr>
              <td class="infobox-label">${i18next.t("infobox.status")}</td>
              <td class="infobox-value">${this.media.status}</td>
            </tr>
          ` : ""}
          
          ${this.media.score || this.media.rating ? html`
            <tr>
              <td class="infobox-label">${i18next.t("infobox.score")}</td>
              <td class="infobox-value">★ ${this.media.score || this.media.rating}/10</td>
            </tr>
          ` : ""}
        </table>
        
        ${this.media.synopsis ? html`
          <div class="infobox-section">
            <div class="infobox-section-title">${i18next.t("infobox.synopsis_snapshot")}</div>
            <div class="infobox-section-content">${this.media.synopsis}</div>
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
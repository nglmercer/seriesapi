import {LitElement, html, css} from "lit";
import {customElement, property, state} from "lit/decorators.js";
import {api} from "./api-service";
import i18next from "../utils/i18n";

export interface MediaFiltersState {
  type: string;
  status: string;
  genre: string;
  yearFrom: string;
  yearTo: string;
  scoreFrom: string;
  sortBy: string;
}

@customElement("media-filters")
export class MediaFilters extends LitElement {
  static override styles = css`
    :host { display: block; --accent: #ff4757; }
    .filters-container { 
      background: var(--bg-primary); 
      padding: 24px; 
      border-radius: 16px; 
      box-shadow: 0 4px 20px rgba(0,0,0,0.08); 
      border: 1px solid var(--border-color);
    }
    .filters-grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); 
      gap: 16px; 
      align-items: flex-end;
    }
    .filter-group { display: flex; flex-direction: column; gap: 8px; }
    .filter-group label { 
      font-size: 12px; 
      font-weight: 700; 
      color: var(--text-secondary); 
      text-transform: uppercase; 
      letter-spacing: 0.5px;
    }
    select, input { 
      background: var(--bg-secondary); 
      color: var(--text-primary); 
      border: 1px solid var(--border-color); 
      padding: 10px 14px; 
      border-radius: 8px; 
      font-size: 14px; 
      font-weight: 500;
      transition: all 0.2s;
      outline: none;
    }
    select:focus, input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(255, 71, 87, 0.1); }
    input { width: 100%; }
    
    .actions { display: flex; gap: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-color); justify-content: flex-end; }
    .btn-reset { 
      background: transparent; 
      color: var(--text-secondary); 
      border: none; 
      padding: 8px 16px; 
      font-size: 14px; 
      font-weight: 600; 
      cursor: pointer; 
      transition: color 0.2s;
    }
    .btn-reset:hover { color: var(--accent); }
  `;

  @property({type: String}) type = "";
  @property({type: String}) status = "";
  @property({type: String}) genre = "";
  @property({type: String}) yearFrom = "";
  @property({type: String}) yearTo = "";
  @property({type: String}) scoreFrom = "";
  @property({type: String}) sortBy = "popularity";

  @state() genres: Array<{slug: string; name: string}> = [];

  override connectedCallback() {
    super.connectedCallback();
    this.loadGenres();
  }

  async loadGenres() {
    const res = await api.getGenres();
    if (res.ok) {
      this.genres = res.data as Array<{slug: string; name: string}>;
    }
  }

  private emitChange() {
    this.dispatchEvent(new CustomEvent("filters-change", {
      detail: {
        type: this.type,
        status: this.status,
        genre: this.genre,
        yearFrom: this.yearFrom,
        yearTo: this.yearTo,
        scoreFrom: this.scoreFrom,
        sortBy: this.sortBy,
      } as MediaFiltersState,
      bubbles: true,
      composed: true,
    }));
  }

  private handleChange(field: keyof MediaFilters, value: string) {
    switch (field) {
      case "type": this.type = value; break;
      case "status": this.status = value; break;
      case "genre": this.genre = value; break;
      case "yearFrom": this.yearFrom = value; break;
      case "yearTo": this.yearTo = value; break;
      case "scoreFrom": this.scoreFrom = value; break;
      case "sortBy": this.sortBy = value; break;
    }
    this.emitChange();
  }

  private handleReset() {
    this.type = "";
    this.status = "";
    this.genre = "";
    this.yearFrom = "";
    this.yearTo = "";
    this.scoreFrom = "";
    this.sortBy = "popularity";
    this.emitChange();
  }

  override render() {
    const currentYear = new Date().getFullYear();

    return html`
      <div class="filters-container">
        <div class="filters-grid">
          <div class="filter-group">
            <label>${i18next.t("filters.type")}</label>
            <select @change=${(e: Event) => this.handleChange("type", (e.target as HTMLSelectElement).value)} .value=${this.type}>
              <option value="">${i18next.t("filters.all")}</option>
              <option value="anime">Anime</option>
              <option value="manga">Manga</option>
              <option value="movie">${i18next.language === 'es' ? 'Película' : 'Movie'}</option>
              <option value="ova">OVA</option>
              <option value="ona">ONA</option>
              <option value="special">${i18next.language === 'es' ? 'Especial' : 'Special'}</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>${i18next.t("filters.status")}</label>
            <select @change=${(e: Event) => this.handleChange("status", (e.target as HTMLSelectElement).value)} .value=${this.status}>
              <option value="">${i18next.t("filters.all")}</option>
              <option value="ongoing">${i18next.language === 'es' ? 'En emisión' : 'Ongoing'}</option>
              <option value="completed">${i18next.language === 'es' ? 'Finalizado' : 'Completed'}</option>
              <option value="upcoming">${i18next.language === 'es' ? 'Próximamente' : 'Upcoming'}</option>
              <option value="tba">TBA</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>${i18next.t("filters.genre")}</label>
            <select @change=${(e: Event) => this.handleChange("genre", (e.target as HTMLSelectElement).value)} .value=${this.genre}>
              <option value="">${i18next.t("filters.all")}</option>
              ${this.genres.map(g => html`<option value=${g.slug}>${g.name}</option>`)}
            </select>
          </div>
          
          <div class="filter-group">
            <label>${i18next.t("filters.year_range")}</label>
            <div style="display: flex; gap: 8px;">
              <input type="number" placeholder=${i18next.language === 'es' ? "Desde" : "From"} min="1990" max=${currentYear} .value=${this.yearFrom} @change=${(e: Event) => this.handleChange("yearFrom", (e.target as HTMLInputElement).value)} />
              <input type="number" placeholder=${i18next.language === 'es' ? "Hasta" : "To"} min="1990" max=${currentYear} .value=${this.yearTo} @change=${(e: Event) => this.handleChange("yearTo", (e.target as HTMLInputElement).value)} />
            </div>
          </div>
          
          <div class="filter-group">
            <label>${i18next.t("filters.score")}</label>
            <select @change=${(e: Event) => this.handleChange("scoreFrom", (e.target as HTMLSelectElement).value)} .value=${this.scoreFrom}>
              <option value="">${i18next.t("filters.any")}</option>
              <option value="9">9+ ★</option>
              <option value="8">8+ ★</option>
              <option value="7">7+ ★</option>
              <option value="6">6+ ★</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>${i18next.t("filters.sort_by")}</label>
            <select @change=${(e: Event) => this.handleChange("sortBy", (e.target as HTMLSelectElement).value)} .value=${this.sortBy}>
              <option value="popularity">${i18next.t("filters.popularity")}</option>
              <option value="score">${i18next.t("filters.score")}</option>
              <option value="release_date">${i18next.t("filters.date")}</option>
              <option value="title">${i18next.t("filters.title")}</option>
            </select>
          </div>
        </div>
        
        <div class="actions">
          <button class="btn-reset" @click=${this.handleReset}>${i18next.t("filters.reset")}</button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "media-filters": MediaFilters;
  }
}
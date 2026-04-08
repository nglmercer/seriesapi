import {LitElement, html, css} from "lit";
import {customElement, property, state} from "lit/decorators.js";
import {api} from "../../services/api-service";
import i18next from "../../utils/i18n";

export interface MediaFiltersState {
  type: string;
  status: string;
  genre: string;
  tag: string;
  year_from: string;
  year_to: string;
  score_from: string;
  sort_by: string;
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
  @property({type: String}) tag = "";
  @property({type: String, attribute: "year-from"}) year_from = "";
  @property({type: String, attribute: "year-to"}) year_to = "";
  @property({type: String, attribute: "score-from"}) score_from = "";
  @property({type: String, attribute: "sort-by"}) sort_by = "popularity";

  @state() genres: Array<{slug: string; name: string}> = [];
  @state() tags: Array<{slug: string; label: string}> = [];

  override connectedCallback() {
    super.connectedCallback();
    this.loadGenres();
    this.loadTags();
  }

  async loadGenres() {
    const res = await api.getGenres();
    if (res.ok) {
      this.genres = res.data as Array<{slug: string; name: string}>;
    }
  }

  async loadTags() {
    const res = await api.getTags();
    if (res.ok) {
      this.tags = res.data;
    }
  }

  private emitChange() {
    this.dispatchEvent(new CustomEvent("filters-change", {
      detail: {
        type: this.type,
        status: this.status,
        genre: this.genre,
        tag: this.tag,
        year_from: this.year_from,
        year_to: this.year_to,
        score_from: this.score_from,
        sort_by: this.sort_by,
      } as MediaFiltersState,
      bubbles: true,
      composed: true,
    }));
  }

  private handleChange(field: keyof MediaFilters, value: string) {
    (this as any)[field] = value;
    this.emitChange();
  }

  private handleReset() {
    this.type = "";
    this.status = "";
    this.genre = "";
    this.tag = "";
    this.year_from = "";
    this.year_to = "";
    this.score_from = "";
    this.sort_by = "popularity";
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
              <option value="series">${i18next.language === 'es' ? 'Serie' : 'Series'}</option>
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
            <label>${i18next.t("filters.tag", { defaultValue: "Tag" })}</label>
            <select @change=${(e: Event) => this.handleChange("tag", (e.target as HTMLSelectElement).value)} .value=${this.tag}>
              <option value="">${i18next.t("filters.all")}</option>
              ${this.tags.map(t => html`<option value=${t.slug}>${t.label}</option>`)}
            </select>
          </div>
          
          <div class="filter-group">
            <label>${i18next.t("filters.year_range")}</label>
            <div style="display: flex; gap: 8px;">
              <input type="number" placeholder=${i18next.language === 'es' ? "Desde" : "From"} min="1900" max=${currentYear} .value=${this.year_from} @change=${(e: Event) => this.handleChange("year_from", (e.target as HTMLInputElement).value)} />
              <input type="number" placeholder=${i18next.language === 'es' ? "Hasta" : "To"} min="1900" max=${currentYear} .value=${this.year_to} @change=${(e: Event) => this.handleChange("year_to", (e.target as HTMLInputElement).value)} />
            </div>
          </div>
          
          <div class="filter-group">
            <label>${i18next.t("filters.score")}</label>
            <select @change=${(e: Event) => this.handleChange("score_from", (e.target as HTMLSelectElement).value)} .value=${this.score_from}>
              <option value="">${i18next.t("filters.any")}</option>
              <option value="9">9+ ★</option>
              <option value="8">8+ ★</option>
              <option value="7">7+ ★</option>
              <option value="6">6+ ★</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>${i18next.t("filters.sort_by")}</label>
            <select @change=${(e: Event) => this.handleChange("sort_by", (e.target as HTMLSelectElement).value)} .value=${this.sort_by}>
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
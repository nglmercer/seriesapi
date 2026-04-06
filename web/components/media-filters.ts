import {LitElement, html, css} from "lit";
import {customElement, property, state} from "lit/decorators.js";
import {api} from "./api-service";

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
    :host { display: block; }
    .filters { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px; background: #f8f9fa; border: 1px solid #a2a9b1; margin-bottom: 16px; border-radius: 2px; }
    .filter-group { display: flex; flex-direction: column; gap: 4px; }
    .filter-group label { font-size: 11px; color: #72777d; text-transform: uppercase; }
    select, input { background: #fff; color: #202122; border: 1px solid #a2a9b1; padding: 6px 10px; border-radius: 2px; font-size: 14px; }
    input { width: 70px; }
    select:focus, input:focus { border-color: #36c; outline: none; }
    .reset { background: #fff; color: #0645ad; border: 1px solid #a2a9b1; padding: 6px 12px; border-radius: 2px; cursor: pointer; font-size: 14px; align-self: flex-end; }
    .reset:hover { background: #f8f9fa; }
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
    const years = Array.from({length: currentYear - 1989}, (_, i) => currentYear - i);

    return html`
      <div class="filters">
        <div class="filter-group">
          <label>Tipo</label>
          <select @change=${(e: Event) => this.handleChange("type", (e.target as HTMLSelectElement).value)} .value=${this.type}>
            <option value="">Todos</option>
            <option value="anime">Anime</option>
            <option value="manga">Manga</option>
            <option value="movie">Película</option>
            <option value="ova">OVA</option>
            <option value="ona">ONA</option>
            <option value="special">Especial</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Estado</label>
          <select @change=${(e: Event) => this.handleChange("status", (e.target as HTMLSelectElement).value)} .value=${this.status}>
            <option value="">Todos</option>
            <option value="ongoing">En emisión</option>
            <option value="completed">Finalizado</option>
            <option value="upcoming">Próximamente</option>
            <option value="tba">Por anunciarse</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Género</label>
          <select @change=${(e: Event) => this.handleChange("genre", (e.target as HTMLSelectElement).value)} .value=${this.genre}>
            <option value="">Todos</option>
            ${this.genres.map(g => html`<option value=${g.slug}>${g.name}</option>`)}
          </select>
        </div>
        <div class="filter-group">
          <label>Año</label>
          <div style="display: flex; gap: 4px;">
            <input type="number" placeholder="Desde" min="1990" max=${currentYear} .value=${this.yearFrom} @change=${(e: Event) => this.handleChange("yearFrom", (e.target as HTMLInputElement).value)} />
            <input type="number" placeholder="Hasta" min="1990" max=${currentYear} .value=${this.yearTo} @change=${(e: Event) => this.handleChange("yearTo", (e.target as HTMLInputElement).value)} />
          </div>
        </div>
        <div class="filter-group">
          <label>Puntuación</label>
          <select @change=${(e: Event) => this.handleChange("scoreFrom", (e.target as HTMLSelectElement).value)} .value=${this.scoreFrom}>
            <option value="">Cualquiera</option>
            <option value="9">9+</option>
            <option value="8">8+</option>
            <option value="7">7+</option>
            <option value="6">6+</option>
            <option value="5">5+</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Ordenar por</label>
          <select @change=${(e: Event) => this.handleChange("sortBy", (e.target as HTMLSelectElement).value)} .value=${this.sortBy}>
            <option value="popularity">Popularidad</option>
            <option value="score">Puntuación</option>
            <option value="release_date">Fecha</option>
            <option value="title">Título</option>
          </select>
        </div>
        <button class="reset" @click=${this.handleReset}>Limpiar</button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "media-filters": MediaFilters;
  }
}
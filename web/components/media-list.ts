import {LitElement, html, css} from "lit";
import {customElement, property, state} from "lit/decorators.js";
import {api, type MediaItem} from "./api-service";
import {MediaFilters, type MediaFiltersState} from "./media-filters";

@customElement("media-list")
export class MediaList extends LitElement {
  static override styles = css`
    :host { display: block; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 20px; padding: 16px; }
    .card { cursor: pointer; text-align: center; }
    .card-poster { width: 120px; height: 180px; object-fit: cover; border-radius: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.2); transition: box-shadow 0.2s; }
    .card:hover .card-poster { box-shadow: 0 2px 6px rgba(0,0,0,0.3); }
    .card-title { font-size: 13px; color: #0645ad; margin-top: 8px; line-height: 1.3; }
    .card-title:hover { text-decoration: underline; }
    .card-meta { font-size: 12px; color: #72777d; margin-top: 4px; }
    .loading { text-align: center; padding: 40px; color: #72777d; }
    .pagination { display: flex; justify-content: center; gap: 8px; padding: 16px; }
    .pagination button { background: #fff; color: #0645ad; border: 1px solid #a2a9b1; padding: 8px 16px; border-radius: 2px; cursor: pointer; font-size: 14px; }
    .pagination button:hover { background: #f8f9fa; }
    .pagination button:disabled { color: #c8ccd1; cursor: not-allowed; }
    .pagination-info { color: #72777d; font-size: 14px; padding: 8px; }
    .no-results { text-align: center; padding: 40px; color: #72777d; }
  `;

  @property({type: Number}) page = 1;
  @property({type: Number}) pageSize = 20;
  @state() items: MediaItem[] = [];
  @state() totalItems = 0;
  @state() loading = true;
  @state() filters: MediaFiltersState = {type: "", status: "", genre: "", yearFrom: "", yearTo: "", scoreFrom: "", sortBy: "popularity"};

  constructor() {
    super();
    this.page = 1;
    this.pageSize = 20;
    this.items = [];
    this.totalItems = 0;
    this.loading = true;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.load();
  }

  async load() {
    this.loading = true;
    const filters_: Record<string, string> = {};
    if (this.filters.type) filters_.type = this.filters.type;
    if (this.filters.status) filters_.status = this.filters.status;
    if (this.filters.genre) filters_.genre = this.filters.genre;
    if (this.filters.yearFrom) filters_.year_from = this.filters.yearFrom;
    if (this.filters.yearTo) filters_.year_to = this.filters.yearTo;
    if (this.filters.scoreFrom) filters_.score_from = this.filters.scoreFrom;
    if (this.filters.sortBy) filters_.sort_by = this.filters.sortBy;

    const res = await api.getMedia(this.page, this.pageSize, filters_);
    if (res.ok) {
      this.items = res.data;
      this.totalItems = (res.meta?.total as number) ?? (res.params?.total as number) ?? 0;
    }
    this.loading = false;
  }

  private handleFiltersChange(e: CustomEvent<MediaFiltersState>) {
    this.filters = e.detail;
    this.page = 1;
    this.load();
  }

  private handleCardClick(item: MediaItem) {
    this.dispatchEvent(new CustomEvent("media-select", {detail: item, bubbles: true, composed: true}));
  }

  private handlePageChange(delta: number) {
    this.page = Math.max(1, this.page + delta);
    this.load();
  }

  override render() {
    if (this.loading) return html`<div class="loading">Cargando...</div>`;

    if (this.items.length === 0) {
      return html`<div class="no-results">No se encontraron resultados</div>`;
    }

    return html`
      <media-filters @filters-change=${this.handleFiltersChange}></media-filters>
      <div class="grid">
        ${this.items.map(item => html`
          <div class="card" @click=${() => this.handleCardClick(item)}>
            <img class="card-poster" src=${item.poster_url} alt=${item.title} loading="lazy" />
            <div class="card-title">${item.title}</div>
            <div class="card-meta">${item.release_date ? item.release_date.split("-")[0] : ""} · ${item.content_type}</div>
          </div>
        `)}
      </div>
      <div class="pagination">
        <button ?disabled=${this.page <= 1} @click=${() => this.handlePageChange(-1)}>Anterior</button>
        <span class="pagination-info">Página ${this.page} de ${Math.max(1, Math.ceil(this.totalItems / this.pageSize))}</span>
        <button ?disabled=${this.page * this.pageSize >= this.totalItems} @click=${() => this.handlePageChange(1)}>Siguiente</button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "media-list": MediaList;
  }
}
import {LitElement, html, css} from "lit";
import {customElement, property, state} from "lit/decorators.js";
import {api, type MediaItem} from "./api-service";

@customElement("media-list")
export class MediaList extends LitElement {
  static override styles = css`
    :host { display: block; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px; padding: 16px; }
    .card { background: #1e1e1e; border-radius: 8px; overflow: hidden; cursor: pointer; transition: transform 0.2s; }
    .card:hover { transform: scale(1.02); }
    .poster { width: 100%; aspect-ratio: 2/3; object-fit: cover; background: #333; }
    .info { padding: 8px; }
    .title { font-size: 14px; font-weight: 500; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .meta { font-size: 12px; color: #888; margin-top: 4px; }
    .loading { text-align: center; padding: 40px; color: #888; }
    .filter { display: flex; gap: 8px; padding: 12px; background: #252525; }
    .filter select { background: #333; color: #fff; border: none; padding: 8px 12px; border-radius: 4px; }
    .pagination { display: flex; justify-content: center; gap: 8px; padding: 16px; }
    .pagination button { background: #333; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
    .pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
  `;

  @property({type: Number}) page = 1;
  @property({type: Number}) pageSize = 20;
  @property({type: String}) typeFilter = "";
  @property({type: String}) status = "";
  @property({type: String}) genre = "";
  @state() items: MediaItem[] = [];
  @state() totalItems = 0;
  @state() loading = true;

  constructor() {
    super();
    this.page = 1;
    this.pageSize = 20;
    this.typeFilter = "";
    this.status = "";
    this.genre = "";
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
    const filters: Record<string, string> = {};
    if (this.typeFilter) filters.type = this.typeFilter;
    if (this.status) filters.status = this.status;
    if (this.genre) filters.genre = this.genre;

    const res = await api.getMedia(this.page, this.pageSize, filters);
    if (res.ok) {
      this.items = res.data;
      this.totalItems = (res.meta?.total as number) ?? (res.params?.total as number) ?? 0;
    }
    this.loading = false;
  }

  private handleTypeChange(e: GlobalEventHandlers & Event) {
    const target = e.target as HTMLSelectElement;
    this.typeFilter = target.value;
    this.page = 1;
    this.load();
  }

  private handleStatusChange(e: GlobalEventHandlers & Event) {
    const target = e.target as HTMLSelectElement;
    this.status = target.value;
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
    if (this.loading) return html`<div class="loading">Loading...</div>`;

    return html`
      <div class="filter">
        <select @change=${this.handleTypeChange}>
          <option value="">All Types</option>
          <option value="anime">Anime</option>
          <option value="manga">Manga</option>
          <option value="movie">Movie</option>
          <option value="ova">OVA</option>
          <option value="ona">ONA</option>
          <option value="special">Special</option>
        </select>
        <select @change=${this.handleStatusChange}>
          <option value="">All Status</option>
          <option value="current">Current</option>
          <option value="finished">Finished</option>
          <option value="upcoming">Upcoming</option>
          <option value="tba">TBA</option>
        </select>
      </div>
      <div class="grid">
        ${this.items.map(item => html`
          <div class="card" @click=${() => this.handleCardClick(item)}>
            <img class="poster" src=${item.poster || ""} alt=${item.title} loading="lazy" />
            <div class="info">
              <div class="title">${item.title}</div>
              <div class="meta">${item.year} · ${item.type}</div>
            </div>
          </div>
        `)}
      </div>
      <div class="pagination">
        <button ?disabled=${this.page <= 1} @click=${() => this.handlePageChange(-1)}>Prev</button>
        <span>Page ${this.page} of ${Math.ceil(this.totalItems / this.pageSize)}</span>
        <button ?disabled=${this.page * this.pageSize >= this.totalItems} @click=${() => this.handlePageChange(1)}>Next</button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "media-list": MediaList;
  }
}
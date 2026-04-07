import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { translate } from "lit-i18n";
import { type MediaItem } from "../../services/api-service";
import { mediaService } from "../../services/media-service";
import i18next from "../../utils/i18n";
import { eventBus } from "../../utils/events";

@customElement("media-list")
export class MediaList extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .media-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 20px;
      padding: 20px 0;
    }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 12px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .card img {
      width: 100%;
      height: 260px;
      object-fit: cover;
      border-radius: 4px;
    }

    .card .title {
      margin-top: 10px;
      font-weight: bold;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card .meta {
      font-size: 12px;
      color: var(--text-secondary);
    }

    .loading-container, .no-items {
      text-align: center;
      padding: 40px;
      color: var(--text-secondary);
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 4px;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 30px 0;
      padding-bottom: 20px;
      gap: 10px;
    }

    .pagination button {
      cursor: pointer;
      border: 1px solid var(--border-color);
      background: var(--bg-secondary);
      color: var(--text-primary);
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }

    .pagination button:hover:not(:disabled) {
      filter: brightness(0.9);
    }

    .pagination button.active {
      background: var(--accent-color);
      color: white;
      border-color: var(--accent-color);
    }

    .pagination button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `;

  @property({ type: Array })
  set list(newList: MediaItem[]) {
    this._items = newList || [];
    this._page = 1;
    this._totalPages = 1;
  }

  @state() private _items: MediaItem[] = [];
  @state() private _filters: Record<string, string> = {};
  @state() private _loading = false;
  @state() private _page = 1;
  @state() private _totalPages = 1;

  override async connectedCallback() {
    super.connectedCallback();
    if (this._items.length === 0) {
      this.load();
    }
  }

  public setFilters(newFilters: Record<string, string>) {
    this._filters = newFilters;
    this._page = 1;
    this.load();
  }

  async load() {
    console.log("[media-list] load called, page:", this._page);
    this._loading = true;

    try {
      const result = await mediaService.fetchMediaList(this._page, 20, this._filters);
      this._items = result.items;
      this._totalPages = result.pages;
    } catch (err) {
      console.error("[media-list] load error:", err);
      this._items = [];
      this._totalPages = 1;
    } finally {
      this._loading = false;
    }
  }

  private goToPage(newPage: number) {
    if (newPage >= 1 && newPage <= this._totalPages && newPage !== this._page) {
      this._page = newPage;
      this.load();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private renderPagination() {
    if (this._totalPages <= 1) return null;

    const pages = [];
    const startPage = Math.max(1, this._page - 2);
    const endPage = Math.min(this._totalPages, startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return html`
      <div class="pagination">
        <button 
          ?disabled=${this._page === 1} 
          @click=${() => this.goToPage(this._page - 1)}
        >
          &lt;
        </button>
        
        ${pages.map(p => html`
          <button 
            class=${p === this._page ? 'active' : ''} 
            @click=${() => this.goToPage(p)}
          >
            ${p}
          </button>
        `)}

        <button 
          ?disabled=${this._page === this._totalPages} 
          @click=${() => this.goToPage(this._page + 1)}
        >
          &gt;
        </button>
      </div>
    `;
  }

  override render() {
    if (this._loading) {
      return html`
        <div class="loading-container">
          ${translate("media.loading", "Loading...")}
        </div>
      `;
    }

    if (this._items.length === 0) {
      return html`
        <div class="no-items">
          No items found
        </div>
      `;
    }
    console.log("[media-list] render called, items:", this._items);
    return html`
      <div class="media-grid">
        ${this._items.map(item => html`
          <div class="card" @click=${() => eventBus.emit("media-select", { id: item.id })}>
            <img src=${item.poster_url} alt=${item.title} loading="lazy">
            <div class="title">${item.title}</div>
            <div class="meta">
              ${item.content_type} | ${item.status || ""}
            </div>
          </div>
        `)}
      </div>
      ${this.renderPagination()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "media-list": MediaList;
  }
}
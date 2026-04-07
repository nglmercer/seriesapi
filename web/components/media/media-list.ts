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

    /* Skeleton Styles */
    .skeleton {
      background: linear-gradient(90deg, var(--card-bg) 25%, var(--border-color) 50%, var(--card-bg) 75%);
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s infinite;
      border-radius: 4px;
    }

    @keyframes skeleton-loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .skeleton-img {
      width: 100%;
      height: 260px;
    }

    .skeleton-title {
      height: 20px;
      margin-top: 10px;
      width: 80%;
    }

    .skeleton-meta {
      height: 15px;
      margin-top: 5px;
      width: 60%;
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
  @state() private _pageSize = 20;

  private _resizeObserver: ResizeObserver | null = null;
  private _resizeTimeout: any;

  override async connectedCallback() {
    super.connectedCallback();
    this._setupResizeObserver();
  }

  protected override firstUpdated() {
    // Wait a frame for layout to settle
    setTimeout(() => {
      this._calculatePageSize();
      if (this._items.length === 0) {
        this.load();
      }
    }, 0);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }
    clearTimeout(this._resizeTimeout);
  }

  private _setupResizeObserver() {
    this._resizeObserver = new ResizeObserver(() => {
      clearTimeout(this._resizeTimeout);
      this._resizeTimeout = setTimeout(() => {
        const oldPageSize = this._pageSize;
        this._calculatePageSize();
        if (oldPageSize !== this._pageSize) {
          console.log("[media-list] page size changed, recalculating page");
          // Recalculate current page to stay on roughly the same items
          const currentOffset = (this._page - 1) * oldPageSize;
          this._page = Math.floor(currentOffset / this._pageSize) + 1;
          this.load();
        }
      }, 300);
    });
    this._resizeObserver.observe(this);
  }

  private _calculatePageSize() {
    // Get the actual width from the element or its parent
    const containerWidth = this.getBoundingClientRect().width || this.offsetWidth || window.innerWidth;
    const minItemWidth = 180;
    const gap = 20;
    
    // Exact column calculation matching CSS: repeat(auto-fill, minmax(180px, 1fr))
    const itemsPerRow = Math.floor((containerWidth + gap) / (minItemWidth + gap)) || 1;
    
    // Target is around 20 elements (standard page size)
    const targetElements = 20;
    
    // We want a number of rows that results in a total close to targetElements,
    // but ensuring we fill the visible space.
    
    // Find out how much space is left in the viewport
    const rect = this.getBoundingClientRect();
    const topOffset = rect.height > 0 ? Math.max(0, rect.top) : 250; 
    const availableHeight = window.innerHeight - topOffset;
    const itemHeight = 350; 
    
    // Minimum rows to fill the viewport
    const minRowsToFill = Math.max(1, Math.ceil((availableHeight - 100) / itemHeight));
    
    // Let's try to find a row count that gets us closest to targetElements (20)
    // but is at least minRowsToFill to avoid empty space.
    let idealRows = Math.round(targetElements / itemsPerRow);
    
    // Ensure we don't have too few rows (to avoid leaving space)
    // but also not too many if it's not needed.
    const finalRows = Math.max(minRowsToFill, idealRows);
    
    // Final page size is a perfect multiple of columns
    this._pageSize = itemsPerRow * finalRows;
    
    console.log(`[media-list] Calculated pageSize: ${this._pageSize} (${itemsPerRow} cols x ${finalRows} rows), target: ~20, minRows: ${minRowsToFill}`);
  }

  public setFilters(newFilters: Record<string, string>) {
    this._filters = newFilters;
    this._page = 1;
    this.load();
  }

  async load() {
    console.log("[media-list] load called, page:", this._page, "pageSize:", this._pageSize);
    this._loading = true;

    try {
      const result = await mediaService.fetchMediaList(this._page, this._pageSize, this._filters);
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
    if (this._loading && this._items.length === 0) {
      return html`
        <div class="media-grid">
          ${Array(this._pageSize).fill(0).map(() => html`
            <div class="card">
              <div class="skeleton skeleton-img"></div>
              <div class="skeleton skeleton-title"></div>
              <div class="skeleton skeleton-meta"></div>
            </div>
          `)}
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
    
    // Strictly slice the items to match the pageSize to ensure a perfect grid
    const visibleItems = this._items.slice(0, this._pageSize);
    
    console.log(`[media-list] render called, items: ${this._items.length}, showing: ${visibleItems.length}, pageSize: ${this._pageSize}`);
    return html`
      <div class="media-grid" style="${this._loading ? 'opacity: 0.7; pointer-events: none;' : ''}">
        ${visibleItems.map(item => html`
          <div class="card" @click=${() => eventBus.emit("media-select", { id: item.id })}>
            <img src=${item.poster_url || item.image_url} alt=${item.title} loading="lazy">
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
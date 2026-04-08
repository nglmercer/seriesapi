import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import i18next from "../../utils/i18n";

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
}

@customElement("app-pagination")
export class AppPagination extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .pagination-container {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
      margin-top: 30px;
      padding: 20px;
      border-top: 1px solid var(--border-color);
    }

    .pagination-btn {
      padding: 10px 18px;
      border-radius: 10px;
      font-weight: 600;
      transition: all 0.2s;
      border: 1px solid var(--border-color);
    }

    .prev-btn {
      cursor: pointer;
      background: var(--bg-primary);
      color: var(--text-primary);
    }

    .prev-btn:disabled {
      cursor: not-allowed;
      background: var(--bg-secondary);
      color: var(--text-secondary);
    }

    .next-btn {
      cursor: pointer;
      background: var(--accent-color);
      color: white;
      border: none;
    }

    .next-btn:disabled {
      cursor: not-allowed;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: white;
    }

    .info-text {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }

    .current-page {
      color: var(--text-primary);
      font-size: 15px;
      font-weight: 700;
    }

    .total-items {
      color: var(--text-secondary);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  `;

  @property({ type: Number })
  currentPage = 1;

  @property({ type: Number })
  pageSize = 20;

  @property({ type: Number })
  totalItems = 0;

  // For backward compatibility if needed, but we'll focus on the new props
  set info(val: PaginationInfo) {
    this.currentPage = val.page;
    this.pageSize = val.pageSize;
    this.totalItems = val.total;
  }

  get info(): PaginationInfo {
    return { page: this.currentPage, pageSize: this.pageSize, total: this.totalItems };
  }

  private onPageChange(page: number) {
    this.dispatchEvent(new CustomEvent("page-change", { 
      detail: page,
      bubbles: true,
      composed: true
    }));
  }

  override render() {
    const page = this.currentPage;
    const pageSize = this.pageSize;
    const total = this.totalItems;
    const totalPages = Math.ceil(total / pageSize);
    if (totalPages <= 1) return html``;

    return html`
      <div class="pagination-container">
        <button
          class="pagination-btn prev-btn"
          ?disabled=${page <= 1}
          @click=${() => this.onPageChange(page - 1)}
        >
          ${i18next.t("pagination.prev", { defaultValue: "← Previous" })}
        </button>

        <div class="info-text">
          <span class="current-page">
            ${i18next.t("pagination.current", {
              page,
              totalPages,
              defaultValue: `${page} / ${totalPages}`,
            })}
          </span>
          <span class="total-items">
            ${i18next.t("pagination.total", {
              total,
              defaultValue: `${total} items`,
            })}
          </span>
        </div>

        <button
          class="pagination-btn next-btn"
          ?disabled=${page >= totalPages}
          @click=${() => this.onPageChange(page + 1)}
        >
          ${i18next.t("pagination.next", { defaultValue: "Next →" })}
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-pagination": AppPagination;
  }
}

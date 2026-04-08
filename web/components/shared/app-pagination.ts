import { h } from "../../utils/dom";
import i18next from "../../utils/i18n";

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
}

export class AppPagination extends HTMLElement {
  private _info: PaginationInfo = { page: 1, pageSize: 20, total: 0 };

  set info(val: PaginationInfo) {
    this._info = val;
    this.render();
  }

  private onPageChange(page: number) {
    this.dispatchEvent(new CustomEvent("page-change", { detail: page }));
  }

  render() {
    this.innerHTML = "";
    const { page, pageSize, total } = this._info;
    const totalPages = Math.ceil(total / pageSize);
    if (totalPages <= 1) return;

    const container = h("div", { 
      style: "display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 30px; padding: 20px; border-top: 1px solid var(--border-color);" 
    });

    const prevBtn = h("button", {
      className: "pagination-btn",
      disabled: page <= 1,
      onclick: () => this.onPageChange(page - 1),
      style: `
        padding: 10px 18px; 
        border-radius: 10px; 
        cursor: ${page <= 1 ? 'not-allowed' : 'pointer'}; 
        background: ${page <= 1 ? 'var(--bg-secondary)' : 'var(--bg-primary)'};
        color: ${page <= 1 ? 'var(--text-secondary)' : 'var(--text-primary)'};
        border: 1px solid var(--border-color);
        font-weight: 600;
        transition: all 0.2s;
      `
    }, i18next.t("pagination.prev", { defaultValue: "← Previous" }));

    const nextBtn = h("button", {
      className: "pagination-btn",
      disabled: page >= totalPages,
      onclick: () => this.onPageChange(page + 1),
      style: `
        padding: 10px 18px; 
        border-radius: 10px; 
        cursor: ${page >= totalPages ? 'not-allowed' : 'pointer'}; 
        background: ${page >= totalPages ? 'var(--bg-secondary)' : 'var(--accent-color)'};
        color: white;
        border: none;
        font-weight: 600;
        transition: all 0.2s;
      `
    }, i18next.t("pagination.next", { defaultValue: "Next →" }));

    const infoText = h("div", {
      style: "display: flex; flex-direction: column; align-items: center; gap: 2px;"
    }, 
      h("span", {
        style: "color: var(--text-primary); font-size: 15px; font-weight: 700;"
      }, i18next.t("pagination.current", { 
        page, 
        totalPages, 
        defaultValue: `${page} / ${totalPages}` 
      })),
      h("span", {
        style: "color: var(--text-secondary); font-size: 11px; text-transform: uppercase; letter-spacing: 1px;"
      }, i18next.t("pagination.total", { 
        total, 
        defaultValue: `${total} items` 
      }))
    );

    container.appendChild(prevBtn);
    container.appendChild(infoText);
    container.appendChild(nextBtn);
    this.appendChild(container);
  }
}

customElements.define("app-pagination", AppPagination);

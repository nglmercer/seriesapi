import {LitElement, html, css} from "lit";
import {customElement, property, state} from "lit/decorators.js";
import {api, type PeopleItem} from "./api-service";

@customElement("people-list")
export class PeopleList extends LitElement {
  static override styles = css`
    :host { display: block; }
    .list { display: flex; flex-direction: column; gap: 12px; padding: 16px; }
    .person { display: flex; gap: 12px; background: #1e1e1e; padding: 12px; border-radius: 8px; cursor: pointer; }
    .person:hover { background: #2a2a2a; }
    .avatar { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; background: #333; }
    .info { display: flex; flex-direction: column; justify-content: center; }
    .name { font-size: 16px; font-weight: 500; color: #fff; }
    .occupation { font-size: 12px; color: #888; }
    .loading { text-align: center; padding: 40px; color: #888; }
    .pagination { display: flex; justify-content: center; gap: 8px; padding: 16px; }
    .pagination button { background: #333; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
    .pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
  `;

  @property({type: Number}) page = 1;
  @property({type: Number}) pageSize = 20;
  @state() items: PeopleItem[] = [];
  @state() totalItems = 0;
  @state() loading = true;

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
    const res = await api.getPeople(this.page, this.pageSize);
    console.log({res})
    if (res.ok) {
      this.items = res.data;
      this.totalItems = res.params?.total as number;
    }
    this.loading = false;
  }

  private handleCardClick(item: PeopleItem) {
    this.dispatchEvent(new CustomEvent("people-select", {detail: item, bubbles: true, composed: true}));
  }

  private handlePageChange(delta: number) {
    this.page = Math.max(1, this.page + delta);
    this.load();
  }

  override render() {
    if (this.loading) return html`<div class="loading">Loading...</div>`;

    return html`
      <div class="list">
        ${this.items.map(item => html`
          <div class="person" @click=${() => this.handleCardClick(item)}>
            <img class="avatar" src=${item.image || ""} alt=${item.name} loading="lazy" />
            <div class="info">
              <div class="name">${item.name}</div>
              <div class="occupation">${item.occupation || "Unknown"}</div>
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
    "people-list": PeopleList;
  }
}
import {LitElement, html, css} from "lit";
import {customElement, state} from "lit/decorators.js";
import {api} from "./api-service";

@customElement("genres-list")
export class GenresList extends LitElement {
  static override styles = css`
    :host { display: block; }
    .list { display: flex; flex-wrap: wrap; gap: 8px; padding: 16px; }
    .tag { background: #1e1e1e; padding: 8px 16px; border-radius: 20px; color: #fff; cursor: pointer; transition: background 0.2s; }
    .tag:hover { background: #333; }
    .loading { text-align: center; padding: 40px; color: #888; }
  `;

  @state() items: Array<{id: number; slug: string; name: string; count: number}> = [];
  @state() loading = true;

  override connectedCallback() {
    super.connectedCallback();
    this.load();
  }

  async load() {
    this.loading = true;
    const res = await api.getGenres();
    if (res.ok) {
      this.items = res.data as Array<{id: number; slug: string; name: string; count: number}>;
    }
    this.loading = false;
  }

  private handleClick(slug: string) {
    this.dispatchEvent(new CustomEvent("genre-select", {detail: slug, bubbles: true, composed: true}));
  }

  override render() {
    if (this.loading) return html`<div class="loading">Loading...</div>`;

    return html`
      <div class="list">
        ${this.items.map(item => html`
          <div class="tag" @click=${() => this.handleClick(item.slug)}>
            ${item.name} (${item.count})
          </div>
        `)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "genres-list": GenresList;
  }
}
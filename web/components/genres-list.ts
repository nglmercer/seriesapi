import {LitElement, html, css} from "lit";
import {customElement, state} from "lit/decorators.js";
import {api} from "./api-service";

@customElement("genres-list")
export class GenresList extends LitElement {
  static override styles = css`
    :host { display: block; }
    .list { display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 0; }
    .tag { background: #f8f9fa; border: 1px solid #a2a9b1; padding: 4px 12px; border-radius: 2px; color: #0645ad; font-size: 13px; cursor: pointer; }
    .tag:hover { background: #eaf3ff; text-decoration: underline; }
    .loading { text-align: center; padding: 20px; color: #72777d; font-size: 13px; }
  `;

  @state() items: Array<{id: number; slug: string; name: string; count?: number}> = [];
  @state() loading = true;

  override connectedCallback() {
    super.connectedCallback();
    this.load();
  }

  async load() {
    this.loading = true;
    const res = await api.getGenres();
    if (res.ok) {
      this.items = res.data as Array<{id: number; slug: string; name: string; count?: number}>;
    }
    this.loading = false;
  }

  private handleClick(slug: string) {
    this.dispatchEvent(new CustomEvent("genre-select", {detail: slug, bubbles: true, composed: true}));
  }

  override render() {
    if (this.loading) return html`<div class="loading">Cargando...</div>`;

    return html`
      <div class="list">
        ${this.items.map(item => html`
          <div class="tag" @click=${() => this.handleClick(item.slug)}>
            ${item.name}
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
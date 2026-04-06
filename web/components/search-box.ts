import {LitElement, html, css} from "lit";
import {customElement, state} from "lit/decorators.js";
import {api} from "./api-service";

@customElement("search-box")
export class SearchBox extends LitElement {
  static override styles = css`
    :host { display: block; }
    .search { display: flex; gap: 8px; padding: 12px; }
    input { flex: 1; background: #1e1e1e; border: none; padding: 12px 16px; border-radius: 8px; color: #fff; font-size: 16px; }
    input::placeholder { color: #666; }
    button { background: #007aff; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; }
    button:hover { background: #0062cc; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .results { background: #1e1e1e; margin: 0 12px; border-radius: 8px; overflow: hidden; }
    .result { display: flex; gap: 12px; padding: 12px; cursor: pointer; border-bottom: 1px solid #333; }
    .result:last-child { border-bottom: none; }
    .result:hover { background: #252525; }
    .result-type { font-size: 10px; text-transform: uppercase; color: #888; }
    .result-title { color: #fff; font-size: 14px; }
  `;

  @state() query = "";
  @state() results: Array<{id: number; entityType: string; title: string; type: string; poster?: string}> = [];
  @state() loading = false;

  private handleInput(e: GlobalEventHandlers & Event) {
    const target = e.target as HTMLInputElement;
    this.query = target.value;
  }

  private handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      this.search();
    }
  }

  async search() {
    if (!this.query.trim()) return;
    this.loading = true;
    const res = await api.search(this.query);
    if (res.ok) {
      this.results = res.data as Array<{id: number; entityType: string; title: string; type: string; poster?: string}>;
    }
    this.loading = false;
  }

  private handleResultClick(result: {id: number; entityType: string; title: string}) {
    this.dispatchEvent(new CustomEvent("search-result", {detail: result, bubbles: true, composed: true}));
  }

  override render() {
    return html`
      <div class="search">
        <input 
          type="text" 
          placeholder="Search anime, manga, people..." 
          .value=${this.query}
          @input=${this.handleInput}
          @keydown=${this.handleKeydown}
        />
        <button ?disabled=${this.loading} @click=${this.search}>
          ${this.loading ? "..." : "Search"}
        </button>
      </div>
      ${this.results.length > 0 ? html`
        <div class="results">
          ${this.results.map(result => html`
            <div class="result" @click=${() => this.handleResultClick(result)}>
              <div>
                <div class="result-type">${result.entityType}</div>
                <div class="result-title">${result.title}</div>
              </div>
            </div>
          `)}
        </div>
      ` : ""}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "search-box": SearchBox;
  }
}
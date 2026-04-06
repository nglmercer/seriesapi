import {LitElement, html, css} from "lit";
import {customElement, state} from "lit/decorators.js";
import {api} from "./api-service";

@customElement("search-box")
export class SearchBox extends LitElement {
  static override styles = css`
    :host { display: block; }
    .search { display: flex; gap: 8px; }
    input { flex: 1; background: #fff; border: 1px solid #a2a9b1; padding: 8px 12px; border-radius: 2px; color: #202122; font-size: 14px; }
    input:focus { border-color: #36c; outline: none; }
    input::placeholder { color: #72777d; }
    button { background: #36c; color: #fff; border: none; padding: 8px 20px; border-radius: 2px; cursor: pointer; font-size: 14px; }
    button:hover { background: #447ff5; }
    button:disabled { background: #c8ccd1; cursor: not-allowed; }
    .results { background: #fff; border: 1px solid #a2a9b1; margin-top: 4px; border-radius: 2px; }
    .result { display: flex; gap: 12px; padding: 10px 14px; cursor: pointer; border-bottom: 1px solid #eaecf0; }
    .result:last-child { border-bottom: none; }
    .result:hover { background: #eaecf0; }
    .result-type { font-size: 11px; text-transform: uppercase; color: #72777d; }
    .result-title { color: #0645ad; font-size: 14px; }
    .result-title:hover { text-decoration: underline; }
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
          placeholder="Search for anime, manga, people..." 
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
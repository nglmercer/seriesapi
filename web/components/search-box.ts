import {LitElement, html, css} from "lit";
import {customElement, state} from "lit/decorators.js";
import {api} from "./api-service";

@customElement("search-box")
export class SearchBox extends LitElement {
  static override styles = css`
    :host { display: block; --accent: #ff4757; }
    .search-container { position: relative; }
    .search { display: flex; gap: 12px; }
    input { 
      flex: 1; 
      background: var(--bg-primary); 
      border: 1px solid var(--border-color); 
      padding: 14px 20px; 
      border-radius: 12px; 
      color: var(--text-primary); 
      font-size: 16px; 
      font-weight: 500;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    input:focus { border-color: var(--accent); outline: none; box-shadow: 0 4px 20px rgba(255, 71, 87, 0.15); }
    input::placeholder { color: var(--text-secondary); }
    
    button { 
      background: var(--accent); 
      color: #fff; 
      border: none; 
      padding: 14px 32px; 
      border-radius: 12px; 
      cursor: pointer; 
      font-size: 16px; 
      font-weight: 700;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(255, 71, 87, 0.3);
    }
    button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255, 71, 87, 0.4); }
    button:active { transform: translateY(0); }
    button:disabled { background: var(--border-color); cursor: not-allowed; transform: none; box-shadow: none; }
    
    .results { 
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--bg-primary); 
      border: 1px solid var(--border-color); 
      margin-top: 12px; 
      border-radius: 12px; 
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
      z-index: 1000;
      overflow: hidden;
      animation: fadeIn 0.2s ease-out;
    }
    .result { display: flex; gap: 16px; padding: 14px 20px; cursor: pointer; border-bottom: 1px solid var(--border-color); transition: background 0.2s; }
    .result:last-child { border-bottom: none; }
    .result:hover { background: var(--bg-secondary); }
    .result-type { font-size: 10px; text-transform: uppercase; color: var(--accent); font-weight: 800; letter-spacing: 1px; margin-bottom: 4px; }
    .result-title { color: var(--text-primary); font-size: 15px; font-weight: 600; }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
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
      <div class="search-container">
        <div class="search">
          <input 
            type="text" 
            placeholder="Search for your favorite series or movies..." 
            .value=${this.query}
            @input=${this.handleInput}
            @keydown=${this.handleKeydown}
          />
          <button ?disabled=${this.loading} @click=${this.search}>
            ${this.loading ? "Searching..." : "Explore"}
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
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "search-box": SearchBox;
  }
}
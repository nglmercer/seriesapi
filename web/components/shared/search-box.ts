import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { api } from "../../services/api-service";
import i18next from "../../utils/i18n";

@customElement("search-box")
export class SearchBox extends LitElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
    }
    
    .search-container {
      position: relative;
      width: 100%;
    }

    .search-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
      position: relative;
    }

    .input-group {
      position: relative;
      flex: 1;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 16px;
      color: var(--text-secondary);
      pointer-events: none;
      opacity: 0.6;
      display: flex;
      align-items: center;
    }

    input {
      width: 100%;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      padding: 12px 16px 12px 42px;
      border-radius: 10px;
      color: var(--text-primary);
      font-size: 15px;
      font-weight: 500;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    input:focus {
      border-color: var(--accent-color);
      outline: none;
      box-shadow: 0 4px 16px rgba(51, 102, 204, 0.15);
      background: var(--bg-primary);
    }

    input::placeholder {
      color: var(--text-secondary);
      opacity: 0.7;
    }

    button {
      background: var(--accent-color);
      color: #ffffff;
      border: none;
      padding: 12px 24px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 15px;
      font-weight: 600;
      transition: all 0.2s;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(51, 102, 204, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 100px;
    }

    button:hover {
      background: var(--accent-hover);
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(51, 102, 204, 0.3);
    }

    button:active {
      transform: translateY(0);
    }

    button:disabled {
      background: var(--border-color);
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
      opacity: 0.7;
    }

    .results {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      margin-top: 8px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      z-index: 1000;
      overflow: hidden;
      backdrop-filter: blur(10px);
      animation: slideDown 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .result {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 16px;
      cursor: pointer;
      border-bottom: 1px solid var(--border-color);
      transition: all 0.2s;
    }

    .result:last-child {
      border-bottom: none;
    }

    .result:hover {
      background: var(--bg-secondary);
      padding-left: 20px;
    }

    .result-info {
      flex: 1;
    }

    .result-type {
      font-size: 10px;
      text-transform: uppercase;
      color: var(--accent-color);
      font-weight: 700;
      letter-spacing: 0.05em;
      margin-bottom: 2px;
    }

    .result-title {
      color: var(--text-primary);
      font-size: 14px;
      font-weight: 600;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Minimal mode styles */
    :host([minimal]) button {
      display: none;
    }
    :host([minimal]) input {
       padding-right: 16px;
    }
  `;

  @property({ type: String }) placeholder = "";
  @property({ type: String }) buttonText = "";
  @property({ type: Boolean }) showResults = true;
  @property({ type: Boolean, reflect: true }) minimal = false;

  @property({ type: String }) query = "";
  @state() results: Array<{ id: number; entity_type: string; title: string; content_type?: string; image_url?: string }> = [];
  @state() loading = false;

  private handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    this.query = target.value;
    
    // Auto-search for filters or just emit change
    this.dispatchEvent(new CustomEvent("search-input", {
      detail: this.query,
      bubbles: true,
      composed: true
    }));
  }

  private handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      this.handleSearch();
    }
  }

  async handleSearch() {
    this.dispatchEvent(new CustomEvent("search", {
      detail: this.query,
      bubbles: true,
      composed: true
    }));

    if (this.showResults && this.query.trim()) {
      this.loading = true;
      const res = await api.search(this.query);
      if (res.ok) {
        this.results = res.data as any[];
      }
      this.loading = false;
    }
  }

  private handleResultClick(result: any) {
    this.dispatchEvent(new CustomEvent("search-result", {
      detail: result,
      bubbles: true,
      composed: true
    }));
    this.results = [];
    this.query = "";
  }

  override render() {
    return html`
      <div class="search-container">
        <div class="search-wrapper">
          <div class="input-group">
            <div class="search-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <input 
              type="text" 
              placeholder=${this.placeholder || i18next.t("hero.search_placeholder")}
              .value=${this.query}
              @input=${this.handleInput}
              @keydown=${this.handleKeydown}
            />
          </div>
          <button ?disabled=${this.loading} @click=${this.handleSearch}>
            ${this.loading ? html`
              <svg class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
              </svg>
            ` : (this.buttonText || i18next.t("hero.explore_btn"))}
          </button>
        </div>
        ${this.showResults && this.results.length > 0 ? html`
          <div class="results">
            ${this.results.map(result => html`
              <div class="result" @click=${() => this.handleResultClick(result)}>
                <div class="result-info">
                  <div class="result-type">${result.entity_type}</div>
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
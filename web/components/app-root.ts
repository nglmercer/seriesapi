import {LitElement, html, css} from "lit";
import {customElement, state} from "lit/decorators.js";
import "./media-list";
import "./people-list";
import "./genres-list";
import "./search-box";
import "./media-detail";
import type {MediaItem} from "./api-service";

type View = "home" | "media" | "people" | "search";

@customElement("app-root")
export class AppRoot extends LitElement {
  static override styles = css`
    :host { display: block; min-height: 100vh; background: #0a0a0a; color: #fff; }
    .nav { display: flex; gap: 16px; padding: 12px 24px; background: #1a1a1a; border-bottom: 1px solid #222; }
    .nav-item { color: #888; text-decoration: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; }
    .nav-item.active { background: #2a2a2a; color: #fff; }
    .nav-item:hover { color: #fff; }
    .header { display: flex; align-items: center; gap: 24px; padding: 16px 24px; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding-bottom: 40px; }
    .hero-search { max-width: 600px; margin: 0 auto; padding-top: 40px; }
  `;

  @state() view: View = "home";
  @state() selectedMediaId: number | null = null;

  private handleMediaSelect(e: CustomEvent<MediaItem>) {
    this.selectedMediaId = e.detail.id;
    this.view = "media";
  }

  private handleBack() {
    this.selectedMediaId = null;
    this.view = "home";
  }

  private handleSearchResult(e: CustomEvent<{id: number; entityType: string}>) {
    if (e.detail.entityType === "media") {
      this.selectedMediaId = e.detail.id;
      this.view = "media";
    }
  }

  private handleNavClick(view: View) {
    this.view = view;
    this.selectedMediaId = null;
  }

  override render() {
    return html`
      <nav class="nav">
        <span class="nav-item ${this.view === "home" ? "active" : ""}" @click=${() => this.handleNavClick("home")}>Anime</span>
        <span class="nav-item ${this.view === "people" ? "active" : ""}" @click=${() => this.handleNavClick("people")}>People</span>
      </nav>
      
      <div class="content">
        ${this.selectedMediaId && this.view === "media" ? html`
          <media-detail 
            .mediaId=${this.selectedMediaId} 
            @back=${this.handleBack}
          ></media-detail>
        ` : this.view === "people" ? html`
          <people-list @people-select=${(e: CustomEvent) => console.log(e)}></people-list>
        ` : html`
          <div class="hero-search">
            <search-box @search-result=${this.handleSearchResult}></search-box>
          </div>
          <genres-list @genre-select=${(e: CustomEvent<string>) => console.log(e)}></genres-list>
          <media-list @media-select=${this.handleMediaSelect}></media-list>
        `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-root": AppRoot;
  }
}
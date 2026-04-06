import {LitElement, html, css} from "lit";
import {customElement, state} from "lit/decorators.js";
import "./media-list";
import "./people-list";
import "./genres-list";
import "./search-box";
import "./media-detail";
import "./wiki-infobox";
import "./empty-state";
import "./auth-modal";
import type {MediaItem} from "./api-service";

type View = "home" | "media" | "people" | "search" | "upload";

interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
  role: string;
}

@customElement("app-root")
export class AppRoot extends LitElement {
  static override styles = css`
    :host { display: block; min-height: 100vh; background: #fff; color: #202122; font-family: sans-serif; }
    .wiki-header { background: #eaecf0; border: 1px solid #a7d7f9; border-bottom: 1px solid #a2a9b1; padding: 8px 16px; display: flex; justify-content: space-between; align-items: center; }
    .wiki-logo { font-size: 24px; font-weight: bold; color: #0645ad; text-decoration: none; }
    .wiki-logo:hover { text-decoration: underline; }
    .wiki-search-header { display: flex; gap: 8px; align-items: center; }
    .wiki-search-header input { padding: 6px 12px; border: 1px solid #a2a9b1; border-radius: 2px; width: 200px; }
    .wiki-search-header button { background: #36c; color: #fff; border: none; padding: 6px 16px; border-radius: 2px; cursor: pointer; }
    .user-area { display: flex; align-items: center; gap: 12px; }
    .user-info { font-size: 13px; color: #202122; }
    .user-info strong { color: #0645ad; }
    .login-btn { background: #36c; color: #fff; border: none; padding: 6px 16px; border-radius: 2px; cursor: pointer; font-size: 14px; }
    .login-btn:hover { background: #447ff5; }
    .logout-btn { background: #f8f9fa; color: #0645ad; border: 1px solid #a2a9b1; padding: 5px 12px; border-radius: 2px; cursor: pointer; font-size: 13px; }
    .logout-btn:hover { background: #eaf3ff; }
    .wiki-nav { background: #f8f9fa; border-bottom: 1px solid #a2a9b1; padding: 6px 16px; display: flex; gap: 4px; }
    .nav-item { color: #0645ad; text-decoration: none; padding: 4px 12px; border-radius: 2px; font-size: 14px; cursor: pointer; }
    .nav-item:hover { background: #eaf3ff; }
    .nav-item.active { background: #fff; border: 1px solid #a2a9b1; border-bottom: none; color: #202122; }
    .wiki-content { display: flex; max-width: 1200px; margin: 0 auto; padding: 16px; gap: 24px; }
    .wiki-main { flex: 1; min-width: 0; }
    .wiki-sidebar { width: 280px; flex-shrink: 0; }
    .page-title { font-family: sans-serif; font-size: 28px; font-weight: normal; border-bottom: 1px solid #a2a9b1; padding-bottom: 8px; margin-bottom: 16px; color: #202122; }
    .breadcrumb { font-size: 12px; color: #72777d; margin-bottom: 8px; }
    .breadcrumb a { color: #0645ad; }
    .hero-search { max-width: 500px; margin: 40px auto; text-align: center; }
    .hero-search h2 { font-weight: normal; font-size: 20px; margin-bottom: 16px; }
    .hero-search input { width: 100%; padding: 8px 12px; border: 1px solid #a2a9b1; border-radius: 2px; font-size: 16px; }
    .hero-search button { display: none; }
    .home-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
    .home-card { text-align: center; cursor: pointer; }
    .home-card img { width: 120px; height: 180px; object-fit: cover; border-radius: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
    .home-card:hover img { box-shadow: 0 2px 6px rgba(0,0,0,0.3); }
    .home-card-title { font-size: 14px; color: #0645ad; margin-top: 8px; }
    .category-list { margin-top: 24px; }
    .category-title { font-size: 18px; font-weight: bold; border-bottom: 1px solid #a2a9b1; margin-bottom: 12px; padding-bottom: 4px; }
    .welcome-box { background: #f8f9fa; border: 1px solid #a2a9b1; padding: 16px; margin-bottom: 24px; border-radius: 2px; }
    .welcome-title { font-weight: bold; font-size: 18px; margin-bottom: 8px; }
    .section-nav { background: #f8f9fa; border: 1px solid #a2a9b1; padding: 12px; margin-bottom: 16px; border-radius: 2px; }
    .section-nav-title { font-weight: bold; margin-bottom: 8px; color: #202122; }
    .section-nav a { display: block; color: #0645ad; font-size: 14px; padding: 4px 0; }
  `;

  @state() view: View = "home";
  @state() selectedMediaId: number | null = null;
  @state() searchQuery = "";
  @state() user: User | null = null;
  @state() showAuthModal = false;

  constructor() {
    super();
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    const token = localStorage.getItem("auth_token");
    const userStr = localStorage.getItem("auth_user");
    if (token && userStr) {
      try {
        this.user = JSON.parse(userStr);
      } catch {
        this.user = null;
      }
    }
  }

  private handleMediaSelect(e: CustomEvent<MediaItem>) {
    this.selectedMediaId = e.detail.id;
    this.view = "media";
  }

  private handleBack() {
    this.selectedMediaId = null;
    this.view = "home";
  }

  private handleNavClick(view: View) {
    this.view = view;
    this.selectedMediaId = null;
  }

  private handleHeaderSearch() {
    const input = this.shadowRoot?.querySelector(".wiki-search-header input") as HTMLInputElement;
    if (input?.value.trim()) {
      this.searchQuery = input.value.trim();
      this.view = "search";
      this.selectedMediaId = null;
    }
  }

  private handleSearchKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      this.handleHeaderSearch();
    }
  }

  private handleHomeSearch(e: CustomEvent<{id: number; entityType: string}>) {
    if (e.detail.entityType === "media") {
      this.selectedMediaId = e.detail.id;
      this.view = "media";
    }
  }

  private openAuthModal() {
    this.showAuthModal = true;
  }

  private closeAuthModal() {
    this.showAuthModal = false;
  }

  private handleAuthSuccess(e: CustomEvent<User>) {
    this.user = e.detail;
    this.showAuthModal = false;
  }

  private handleLogout() {
    const token = localStorage.getItem("auth_token");
    if (token) {
      fetch("/api/v1/auth/logout", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    this.user = null;
  }

  override render() {
    return html`
      <header class="wiki-header">
        <a class="wiki-logo" href="#" @click=${(e: Event) => { e.preventDefault(); this.handleNavClick("home"); }}>SeriesAPI Wiki</a>
        <div class="wiki-search-header">
          <input type="text" placeholder="Search wiki" @keydown=${this.handleSearchKeydown} />
          <button @click=${this.handleHeaderSearch}>Search</button>
        </div>
        <div class="user-area">
          ${this.user ? html`
            <span class="user-info">Logged in as <strong>${this.user.display_name || this.user.username}</strong></span>
            ${this.user.role === "admin" || this.user.role === "editor" ? html`
              <span style="font-size: 12px; color: #14866d; background: #d5fdf4; padding: 2px 8px; border-radius: 2px;">${this.user.role}</span>
            ` : ""}
            <button class="logout-btn" @click=${this.handleLogout}>Log out</button>
          ` : html`
            <button class="login-btn" @click=${this.openAuthModal}>Log in / Register</button>
          `}
        </div>
      </header>
      
      <nav class="wiki-nav">
        <span class="nav-item ${this.view === "home" ? "active" : ""}" @click=${() => this.handleNavClick("home")}>Main page</span>
        <span class="nav-item ${this.view === "search" ? "active" : ""}" @click=${() => this.handleNavClick("search")}>Search</span>
        <span class="nav-item ${this.view === "people" ? "active" : ""}" @click=${() => this.handleNavClick("people")}>People</span>
        ${this.user && (this.user.role === "admin" || this.user.role === "editor") ? html`
          <span class="nav-item ${this.view === "upload" ? "active" : ""}" @click=${() => this.handleNavClick("upload")}>Upload</span>
        ` : ""}
      </nav>
      
      ${this.showAuthModal ? html`
        <auth-modal @close=${this.closeAuthModal} @auth-success=${this.handleAuthSuccess}></auth-modal>
      ` : ""}
      
      <div class="wiki-content">
        <main class="wiki-main">
          ${this.renderMainContent()}
        </main>
        <aside class="wiki-sidebar">
          ${this.renderSidebar()}
        </aside>
      </div>
    `;
  }

  private renderMainContent() {
    if (this.view === "media" && this.selectedMediaId) {
      return html`
        <div class="breadcrumb">
          <a href="#" @click=${(e: Event) => { e.preventDefault(); this.handleNavClick("home"); }}>Main page</a> > 
          <a href="#" @click=${(e: Event) => { e.preventDefault(); this.handleNavClick("search"); }}>Search</a> > 
          Media #${this.selectedMediaId}
        </div>
        <media-detail 
          .mediaId=${this.selectedMediaId} 
          @back=${this.handleBack}
          .user=${this.user}
        ></media-detail>
      `;
    }

    if (this.view === "search") {
      return html`
        <h1 class="page-title">Search Results</h1>
        <search-box @search-result=${this.handleHomeSearch}></search-box>
        ${this.searchQuery ? html`<p style="color: #72777d;">Results for "${this.searchQuery}"</p>` : ""}
      `;
    }

    if (this.view === "people") {
      return html`
        <h1 class="page-title">People</h1>
        <people-list @people-select=${(e: CustomEvent) => console.log(e)}></people-list>
      `;
    }

    if (this.view === "upload") {
      return html`
        <h1 class="page-title">Upload Media</h1>
        <p style="color: #72777d;">Upload functionality for editors and admins.</p>
      `;
    }

    return html`
      <div class="welcome-box">
        <div class="welcome-title">Welcome to SeriesAPI Wiki</div>
        <p style="color: #72777d;">Your encyclopedia for anime, manga, movies, and more.</p>
      </div>
      
      <div class="hero-search">
        <h2>Search for your favorite series</h2>
        <search-box @search-result=${this.handleHomeSearch}></search-box>
      </div>
      
      <div class="category-list">
        <div class="category-title">Browse by Genre</div>
        <genres-list @genre-select=${(e: CustomEvent<string>) => console.log(e)}></genres-list>
      </div>
      
      <div class="category-list">
        <div class="category-title">All Media</div>
        <media-list @media-select=${this.handleMediaSelect}></media-list>
      </div>
    `;
  }

  private renderSidebar() {
    return html`
      <div class="section-nav">
        <div class="section-nav-title">Navigation</div>
        <a href="#" @click=${(e: Event) => { e.preventDefault(); this.handleNavClick("home"); }}>Main page</a>
        <a href="#" @click=${(e: Event) => { e.preventDefault(); this.handleNavClick("search"); }}>Search</a>
        <a href="#" @click=${(e: Event) => { e.preventDefault(); this.handleNavClick("people"); }}>People</a>
        ${this.user && (this.user.role === "admin" || this.user.role === "editor") ? html`
          <a href="#" @click=${(e: Event) => { e.preventDefault(); this.handleNavClick("upload"); }}>Upload</a>
        ` : ""}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-root": AppRoot;
  }
}
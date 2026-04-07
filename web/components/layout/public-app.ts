import { LitElement, html, css, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { translate } from "lit-i18n";
import { type AuthUser } from "../../services/auth-store";
import { type MediaItem } from "../../services/api-service";
import { type SearchResult } from "../shared/search-box";
import { mediaService } from "../../services/media-service";
import { initials, avatarColor } from "../shared/comment-avatar";
import { toggleTheme } from "../../utils/dom";
import i18next from "../../utils/i18n";
import { eventBus } from "../../utils/events";

/**
 * Interface representing season data for a media item.
 */
export interface SeasonData {
  id: number;
  season_number: number;
  episode_count: number;
  name?: string | null;
}

/**
 * PublicApp is the main entry point for the public-facing side of the application.
 * It manages navigation between the home/hero view, media detail view, and episodes view.
 */
@customElement("public-app")
export class PublicApp extends LitElement {
  static override styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background: var(--bg-primary);
      color: var(--text-primary);
      font-family: var(--font-family, sans-serif);
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }
    
    header {
      padding: 16px 0;
      border-bottom: 1px solid var(--border-color);
      background: var(--header-bg);
      position: sticky;
      top: 0;
      z-index: 50;
      backdrop-filter: blur(8px);
    }
    
    .header-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }
    
    .logo {
      font-size: 22px;
      font-weight: 900;
      color: var(--accent-color);
      letter-spacing: -1px;
      text-decoration: none;
      cursor: pointer;
    }
    
    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    
    .lang-btn {
      background: transparent;
      border: 1px solid transparent;
      padding: 4px 8px;
      font-weight: bold;
      font-size: 12px;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s;
      color: var(--text-primary);
    }
    
    .lang-btn.active {
      background: var(--accent-color);
      color: white;
      border-color: var(--accent-color);
    }
    
    .lang-btn:hover:not(.active) {
      background: var(--bg-secondary);
      border-color: var(--border-color);
    }
    
    .theme-btn {
      border: none;
      background: transparent;
      font-size: 20px;
      cursor: pointer;
      padding: 4px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .theme-btn:hover {
      background: var(--bg-secondary);
    }
    
    .admin-link {
      font-weight: 600;
      font-size: 13px;
      color: var(--text-secondary);
      text-decoration: none;
      padding: 6px 12px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      transition: all 0.2s;
    }
    
    .admin-link:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }
    
    .auth-chip {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      position: relative;
    }
    
    .avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 800;
      color: #fff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .user-name {
      font-size: 13px;
      font-weight: 600;
      max-width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .sign-out-btn {
      background: none;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      font-size: 11px;
      cursor: pointer;
      padding: 3px 8px;
      border-radius: 6px;
      margin-left: 4px;
      transition: all 0.2s;
    }
    
    .sign-out-btn:hover {
      background: var(--bg-secondary);
      color: var(--error-color, #d33);
      border-color: var(--error-color, #d33);
    }
    
    .sign-in-btn {
      background: var(--accent-color);
      color: #fff;
      font-weight: 700;
      font-size: 13px;
      padding: 8px 18px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .sign-in-btn:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    
    .hero {
      padding: 60px 0;
      text-align: center;
      background: var(--bg-secondary);
    }
    
    .hero h1 {
      font-size: 48px;
      margin-bottom: 10px;
      font-weight: 800;
    }
    
    .hero p {
      color: var(--text-secondary);
      max-width: 600px;
      margin: 0 auto 30px;
      font-size: 18px;
    }
    
    .hero-content {
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    
    main {
      padding: 40px 0;
    }
    
    .media-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 40px;
    }
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    
    .section-header h2 {
      font-size: 24px;
      font-weight: 700;
      margin: 0;
    }
    
    .section-subtitle {
      color: var(--text-secondary);
      font-size: 14px;
    }
    
    .loading {
      padding: 80px 0;
      text-align: center;
      color: var(--text-secondary);
      font-size: 18px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border-color);
      border-top-color: var(--accent-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .lang-separator {
      display: flex;
      gap: 4px;
      border-right: 1px solid var(--border-color);
      padding-right: 12px;
      margin-right: 4px;
    }

    @media (max-width: 768px) {
      .hero h1 { font-size: 32px; }
      .header-actions .admin-link, 
      .header-actions .user-name { display: none; }
    }
  `;

  /**
   * Currently selected media ID. Triggers media data loading when changed.
   */
  @property({ type: Number }) selectedMediaId: number | null = null;

  /**
   * Currently selected season ID.
   */
  @property({ type: Number }) selectedSeasonId: number | null = null;

  /**
   * Current active filters for media exploration.
   */
  @property({ type: Object }) currentFilters: Record<string, unknown> = {};

  /**
   * Current authenticated user.
   */
  @state() private user: AuthUser | null = null;

  /**
   * Whether the authentication modal is visible.
   */
  @state() private showAuthModal = false;

  /**
   * Whether the profile view is visible.
   */
  @state() private showProfile = false;

  /**
   * Loaded media item details.
   */
  @state() private currentMedia: MediaItem | null = null;

  /**
   * Loaded seasons for the current media item.
   */
  @state() private currentSeasons: SeasonData[] = [];

  /**
   * Loaded media list for search or filters.
   */
  @state() private mediaList: SearchResult[] = [];

  /**
   * Loading state for media details.
   */
  @state() private mediaLoading = false;

  private _unsubs: (() => void)[] = [];
  private _unsubAuth?: () => void;

  override async connectedCallback() {
    super.connectedCallback();
    this._setupAuthSubscription();
    this._setupEventBusListeners();
    this.addEventListener("need-login", () => this.openAuth());
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._unsubs.forEach(unsub => unsub());
    this._unsubAuth?.();
  }

  override updated(changedProperties: PropertyValues) {
    if (changedProperties.has("selectedMediaId") && this.selectedMediaId !== null) {
      this.loadMediaData();
    }
  }

  private async _setupAuthSubscription() {
    try {
      const { authStore } = await import("../../services/auth-store");
      this.user = authStore.user;
      this._unsubAuth = authStore.subscribe(u => {
        this.user = u;
      });
    } catch (error) {
      console.error("[public-app] auth-store import failed:", error);
    }
  }

  private _setupEventBusListeners() {
    const listeners = [
      eventBus.on("media-select", (data) => {
        this.selectedMediaId = data.id;
        this.selectedSeasonId = null;
        this.currentMedia = null;
        this.currentSeasons = [];
        this.showProfile = false;
      }),

      eventBus.on("search-result", (data) => {
        if (data.entity_type === "media") {
          this.selectedMediaId = data.id || null;
          this.selectedSeasonId = null;
          this.currentMedia = null;
          this.currentSeasons = [];
          this.showProfile = false;
        }
      }),

      eventBus.on("filters-change", (data) => {
        this.currentFilters = { ...data };
        if (this.selectedMediaId || this.showProfile) {
          this.selectedMediaId = null;
          this.selectedSeasonId = null;
          this.currentMedia = null;
          this.currentSeasons = [];
          this.showProfile = false;
        }
      }),

      eventBus.on("season-select", (data) => {
        this.selectedSeasonId = data.seasonId;
      }),

      eventBus.on("back", () => {
        if (this.selectedSeasonId) {
          this.selectedSeasonId = null;
        } else {
          this.selectedMediaId = null;
          this.currentMedia = null;
          this.currentSeasons = [];
        }
      }),

      eventBus.on("auth-close", () => {
        this.showAuthModal = false;
      }),

      eventBus.on("media-list", (data) => {
        this.mediaList = data;
        this.selectedMediaId = null;
        this.selectedSeasonId = null;
        this.currentMedia = null;
        this.currentSeasons = [];
        this.showProfile = false;
      })
    ];

    this._unsubs.push(...listeners);
  }

  private async loadMediaData() {
    if (!this.selectedMediaId || this.mediaLoading) return;

    this.mediaLoading = true;

    try {
      const [mediaData, seasonsData] = await Promise.all([
        mediaService.fetchMediaDetail(this.selectedMediaId),
        mediaService.fetchMediaSeasons(this.selectedMediaId)
      ]);
      this.currentMedia = mediaData;
      this.currentSeasons = seasonsData;
    } catch (error) {
      console.error("[public-app] load media error:", error);
    } finally {
      this.mediaLoading = false;
    }
  }

  private handleLanguageChange(lng: string) {
    i18next.changeLanguage(lng);
    localStorage.setItem("lang", lng);
    // Force re-render of components using translate directive
    this.requestUpdate();
  }

  private openAuth() {
    this.showAuthModal = true;
  }

  private async doLogout() {
    try {
      const { authStore } = await import("../../services/auth-store");
      await authStore.logout();
      this.user = null;
    } catch (error) {
      console.error("[public-app] logout failed:", error);
    }
  }

  private handleHomeClick() {
    this.selectedMediaId = null;
    this.selectedSeasonId = null;
    this.currentMedia = null;
    this.currentSeasons = [];
    this.showProfile = false;
  }

  private handleProfileClick() {
    this.showProfile = true;
    this.selectedMediaId = null;
    this.selectedSeasonId = null;
    this.currentMedia = null;
    this.currentSeasons = [];
  }

  override render() {
    return html`
      ${this.showAuthModal ? html`<auth-modal @auth-close=${() => this.showAuthModal = false}></auth-modal>` : ""}
      
      <header>
        <div class="header-inner container">
          <a class="logo" href="/" @click=${(e: Event) => { e.preventDefault(); this.handleHomeClick(); }}>
            ${translate("header.explorer")}
          </a>
          <div class="header-actions">
            <div class="lang-separator">
              <button 
                class="lang-btn ${i18next.language === "en" ? "active" : ""}"
                @click=${() => this.handleLanguageChange("en")}
                aria-label="English"
              >EN</button>
              <button 
                class="lang-btn ${i18next.language === "es" ? "active" : ""}"
                @click=${() => this.handleLanguageChange("es")}
                aria-label="Español"
              >ES</button>
            </div>
            <button class="theme-btn" @click=${toggleTheme} title="Toggle Theme">🌗</button>
            <a class="admin-link" href="/admin">${translate("header.admin_panel")}</a>
            ${this.renderAuth()}
          </div>
        </div>
      </header>

      ${this.renderContent()}
    `;
  }

  private renderAuth() {
    if (this.user) {
      const color = avatarColor(this.user.display_name);
      const init = initials(this.user.display_name);
      return html`
        <div class="auth-chip" @click=${this.handleProfileClick}>
          <div class="avatar" style="background: ${color};">${init}</div>
          <span class="user-name">${this.user.display_name}</span>
          <button class="sign-out-btn" @click=${(e: Event) => { e.stopPropagation(); this.doLogout(); }}>
            ${translate("auth.sign_out", "Sign Out")}
          </button>
        </div>
      `;
    }
    return html`
      <button class="sign-in-btn" @click=${this.openAuth}>
        ${translate("auth.sign_in", "Sign In")}
      </button>
    `;
  }

  private renderContent() {
    if (this.showProfile) {
      return html`
        <div class="container" style="padding: 40px 0;">
          <user-profile></user-profile>
        </div>
      `;
    }

    if (this.selectedSeasonId) {
      return html`
        <div class="container" style="padding: 40px 0;">
          <media-episodes .mediaId=${this.selectedMediaId} .seasonId=${this.selectedSeasonId}></media-episodes>
        </div>
      `;
    }

    if (this.selectedMediaId) {
      if (this.mediaLoading) {
        return html`
          <div class="container loading">
            <div class="loading-spinner"></div>
            <span>${translate("media.loading", "Loading...")}</span>
          </div>
        `;
      }
      return html`
        <div class="container" style="padding: 40px 0;">
          <media-detail 
            .mediaId=${this.selectedMediaId} 
            .media=${this.currentMedia}
            .allSeasons=${this.currentSeasons}
          ></media-detail>
        </div>
      `;
    }

    return html`
      <section class="hero">
        <div class="container">
          <h1>${translate("hero.title")}</h1>
          <p>${translate("hero.subtitle")}</p>
          <div class="hero-content">
            <search-box></search-box>
            <media-filters .filters=${this.currentFilters}></media-filters>
          </div>
        </div>
      </section>

      <main class="container">
        <div class="media-grid">
          <div>
            <div class="section-header">
              <div>
                <h2>${translate("media.explore_contents", "Explore Contents")}</h2>
                <span class="section-subtitle">${translate("media.personalized_for_you", "Personalized for you")}</span>
              </div>
              <div style="width: 300px;">
                <search-box minimal></search-box>
              </div>
            </div>
            <media-list .filters=${this.currentFilters} .list=${this.mediaList}></media-list>
          </div>
        </div>
      </main>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "public-app": PublicApp;
  }
}
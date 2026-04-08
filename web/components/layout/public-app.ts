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
import "./public-header";
import "./mobile-menu";

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

    @media (max-width: 768px) {
      .hero h1 { font-size: 32px; }
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
   * Whether the mobile menu is open.
   */
  @state() private isMenuOpen = false;

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

  private openAuth() {
    this.showAuthModal = true;
  }

  private toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
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
      
      <public-header 
        .user=${this.user} 
        .isMenuOpen=${this.isMenuOpen}
        @toggle-menu=${this.toggleMenu}
        @home-click=${this.handleHomeClick}
        @profile-click=${this.handleProfileClick}
        @need-login=${this.openAuth}
        @logout=${this.doLogout}
        @lang-change=${() => this.requestUpdate()}
      ></public-header>

      <mobile-menu
        .open=${this.isMenuOpen}
        .user=${this.user}
        @close=${() => this.isMenuOpen = false}
        @home-click=${this.handleHomeClick}
        @profile-click=${this.handleProfileClick}
        @need-login=${this.openAuth}
        @logout=${this.doLogout}
        @lang-change=${() => this.requestUpdate()}
      ></mobile-menu>

      ${this.renderContent()}
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
            <media-list .list=${this.mediaList}></media-list>
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
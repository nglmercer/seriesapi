import { h, toggleTheme } from "../../utils/dom";
import i18next from "../../utils/i18n";
import { authStore, type AuthUser } from "../../services/auth-store";
import { mediaStore, type MediaItem } from "../../services/api-service";
import { mediaService } from "../../services/media-service";
import { initials, avatarColor } from "../shared/comment-avatar";
import { eventBus } from "../../utils/events";

interface SeasonData {
  id: number;
  season_number: number;
  episode_count: number;
  name: string;
}

export class PublicApp extends HTMLElement {
  private selectedMediaId: number | null = null;
  private selectedSeasonId: number | null = null;
  private currentFilters: Record<string, any> = {};
  private user: AuthUser | null = null;
  private showAuthModal = false;
  private unsub?: () => void;
  private unsubMediaSelect?: () => void;
  private unsubSearchResult?: () => void;
  private unsubFiltersChange?: () => void;
  private unsubSeasonSelect?: () => void;
  private unsubBack?: () => void;
  private unsubAuthClose?: () => void;
  private currentMedia: MediaItem | null = null;
  private currentSeasons: SeasonData[] = [];
  private mediaLoading = false;

  connectedCallback() {
    authStore.init();
    this.user = authStore.user;
    this.unsub = authStore.subscribe(u => { this.user = u; this.render(); });

    i18next.on("languageChanged", () => this.render());

    // Use global event bus instead of DOM events to prevent infinite loops
    this.unsubMediaSelect = eventBus.on("media-select", (data: any) => {
      this.selectedMediaId = data.id;
      this.selectedSeasonId = null;
      this.currentMedia = null;
      this.currentSeasons = [];
      this.loadMediaData();
    });

    this.unsubSearchResult = eventBus.on("search-result", (data: any) => {
      if (data.entity_type === "media") {
        this.selectedMediaId = data.id;
        this.selectedSeasonId = null;
        this.currentMedia = null;
        this.currentSeasons = [];
        this.loadMediaData();
      }
    });

    this.unsubFiltersChange = eventBus.on("filters-change", (data: any) => {
      this.currentFilters = data;
      if (this.selectedMediaId) {
        this.selectedMediaId = null;
        this.selectedSeasonId = null;
        this.currentMedia = null;
        this.currentSeasons = [];
      }
      this.render();
    });

    this.unsubSeasonSelect = eventBus.on("season-select", (data: any) => {
      this.selectedSeasonId = data.seasonId;
      this.render();
    });

    this.unsubBack = eventBus.on("back", () => {
      if (this.selectedSeasonId) {
        this.selectedSeasonId = null;
      } else {
        this.selectedMediaId = null;
        this.currentMedia = null;
        this.currentSeasons = [];
      }
      this.render();
    });

    this.unsubAuthClose = eventBus.on("auth-close", () => {
      this.showAuthModal = false;
      this.user = authStore.user;
      this.render();
    });

    this.render();
  }

  disconnectedCallback() {
    this.unsub?.();
    this.unsubMediaSelect?.();
    this.unsubSearchResult?.();
    this.unsubFiltersChange?.();
    this.unsubSeasonSelect?.();
    this.unsubBack?.();
    this.unsubAuthClose?.();
  }

  private async loadMediaData() {
    if (!this.selectedMediaId || this.mediaLoading) return;

    const cached = mediaStore.getCachedDetail(this.selectedMediaId);
    if (cached) {
      this.currentMedia = cached;
      return;
    }

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
      this.render();
    }
  }

  private changeLanguage(lng: string) {
    i18next.changeLanguage(lng);
    localStorage.setItem("lang", lng);
  }

  private openAuth() {
    this.showAuthModal = true;
    this.render();
  }

  private async doLogout() {
    await authStore.logout();
    this.user = null;
    this.render();
  }

  // ── Header ───────────────────────────────────────────────────────────────────

  private buildHeader(): HTMLElement {
    const langBtns = h("div",
      { style: "display:flex; gap:6px; border-right:1px solid var(--border-color); padding-right:16px; margin-right:4px;" },
      h("button", {
        onclick: () => this.changeLanguage("en"),
        style: `background:${i18next.language === "en" ? "var(--accent-color)" : "transparent"}; color:${i18next.language === "en" ? "white" : "inherit"}; border:none; padding:4px 8px; font-weight:bold; font-size:12px; cursor:pointer; border-radius:4px;`
      }, "EN"),
      h("button", {
        onclick: () => this.changeLanguage("es"),
        style: `background:${i18next.language === "es" ? "var(--accent-color)" : "transparent"}; color:${i18next.language === "es" ? "white" : "inherit"}; border:none; padding:4px 8px; font-weight:bold; font-size:12px; cursor:pointer; border-radius:4px;`
      }, "ES")
    );

    const themeBtn = h("button", {
      onclick: () => toggleTheme(),
      style: "border:none; background:transparent; font-size:20px; cursor:pointer; padding:0 4px;"
    }, "🌗");

    const adminLink = h("a", {
      href: "/admin",
      style: "font-weight:600; font-size:13px; color:var(--text-secondary); text-decoration:none; padding:6px 12px; border:1px solid var(--border-color); border-radius:8px;"
    }, i18next.t("header.admin_panel"));

    let authEl: HTMLElement;
    if (this.user) {
      const color = avatarColor(this.user.display_name);
      const init = initials(this.user.display_name);
      const chip = h("div",
        { style: "display:flex; align-items:center; gap:8px; cursor:pointer; position:relative;" },
        h("div", {
          style: `width:34px; height:34px; border-radius:50%; background:${color}; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:800; color:#fff;`
        }, init),
        h("span", { style: "font-size:13px; font-weight:600; max-width:100px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" },
          this.user.display_name
        ),
        h("button", {
          onclick: (e: Event) => { e.stopPropagation(); this.doLogout(); },
          style: "background:none; border:1px solid var(--border-color); color:var(--text-secondary); font-size:11px; cursor:pointer; padding:3px 8px; border-radius:6px; margin-left:4px;"
        }, i18next.t("auth.sign_out", { defaultValue: "Sign Out" }))
      );
      authEl = chip;
    } else {
      authEl = h("button", {
        onclick: () => this.openAuth(),
        style: "background:var(--accent-color); color:#fff; font-weight:700; font-size:13px; padding:8px 18px; border:none; border-radius:8px; cursor:pointer;"
      }, i18next.t("auth.sign_in", { defaultValue: "Sign In" }));
    }

    return h("header",
      { style: "padding:16px 0; border-bottom:1px solid var(--border-color); background:var(--header-bg); position:sticky; top:0; z-index:50; backdrop-filter:blur(8px);" },
      h("div",
        { className: "container", style: "display:flex; justify-content:space-between; align-items:center; gap:16px;" },
        h("a", {
          href: "/",
          onclick: (e: Event) => { e.preventDefault(); this.selectedMediaId = null; this.selectedSeasonId = null; this.currentMedia = null; this.currentSeasons = []; this.render(); },
          style: "font-size:22px; font-weight:900; color:var(--accent-color); letter-spacing:-1px; text-decoration:none;"
        }, i18next.t("header.explorer")),
        h("div", { style: "display:flex; gap:12px; align-items:center;" },
          langBtns,
          themeBtn,
          adminLink,
          authEl
        )
      )
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  private render() {
    this.innerHTML = "";

    if (this.showAuthModal) {
      const modal = document.createElement("auth-modal");
      this.appendChild(modal);
    }

    const header = this.buildHeader();

    let content: HTMLElement;
    console.log(`[public-app] render, selectedMediaId=${this.selectedMediaId}, selectedSeasonId=${this.selectedSeasonId}`);
    if (this.selectedSeasonId) {
      content = h("div", { className: "container", style: "padding:40px 0;" },
        h("media-episodes", { mediaId: this.selectedMediaId, seasonId: this.selectedSeasonId } as any)
      );
    } else if (this.selectedMediaId) {
      if (this.mediaLoading) {
        content = h("div", { className: "container", style: "padding:40px 0; text-align:center; color:var(--text-secondary); font-size:18px;" },
          i18next.t("media.loading") || "Loading..."
        );
      } else {
        const detail = h("media-detail", { mediaId: this.selectedMediaId } as any);
        (detail as any).media = this.currentMedia;
        (detail as any).allSeasons = this.currentSeasons;
        content = h("div", { className: "container", style: "padding:40px 0;" },
          detail
        );
      }
    } else {
      const hero = h("section",
        { style: "padding:60px 0; text-align:center; background:var(--bg-secondary);" },
        h("div", { className: "container" },
          h("h1", { style: "font-size:48px; margin-bottom:10px;" }, i18next.t("hero.title")),
          h("p", { style: "color:var(--text-secondary); max-width:600px; margin:0 auto 30px;" }, i18next.t("hero.subtitle")),
          h("div", { style: "max-width:800px; margin:0 auto; display:flex; flex-direction:column; gap:24px;" },
            h("search-box", {}),
            h("media-filters", { ...this.currentFilters } as any)
          )
        )
      );

      const mediaList = h("media-list") as any;
      if (Object.keys(this.currentFilters).length > 0) {
        mediaList.setFilters(this.currentFilters);
      }

      const main = h("main", { className: "container", style: "padding:40px 0;" },
        h("div", { style: "display:grid; grid-template-columns:1fr; gap:40px;" },
          h("div", {},
            h("div", { style: "display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;" },
              h("h2", {}, i18next.t("media.explore_contents", { defaultValue: "Explore Contents" })),
              h("span", { style: "color:var(--text-secondary);" }, i18next.t("media.personalized_for_you", { defaultValue: "Personalized for you" }))
            ),
            mediaList
          )
        )
      );

      this.appendChild(header);
      this.appendChild(hero);
      this.appendChild(main);
      return;
    }

    this.appendChild(header);
    this.appendChild(content!);
  }
}

customElements.define("public-app", PublicApp);
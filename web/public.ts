import "./components/index";
import { h, toggleTheme } from "./utils/dom";
import i18next from "./utils/i18n";

class PublicApp extends HTMLElement {
  private selectedMediaId: number | null = null;
  private selectedSeasonId: number | null = null;
  private currentFilters: Record<string, any> = {};

  connectedCallback() {
    i18next.on('languageChanged', () => this.render());
    this.addEventListener("media-select", (e: any) => {
      this.selectedMediaId = e.detail.id;
      this.selectedSeasonId = null;
      this.render();
    });

    this.addEventListener("search-result", (e: any) => {
      if (e.detail.entity_type === "media") {
        this.selectedMediaId = e.detail.id;
        this.selectedSeasonId = null;
        this.render();
      }
    });

    this.addEventListener("filters-change", (e: any) => {
      this.currentFilters = e.detail;
      // If we are in detail view, maybe go back? User didn't specify.
      // But typically filtering implies exploring the list.
      if (this.selectedMediaId) {
        this.selectedMediaId = null;
        this.selectedSeasonId = null;
      }
      this.render();
    });

    this.addEventListener("season-select", (e: any) => {
      this.selectedSeasonId = e.detail.seasonId;
      this.render();
    });

    this.addEventListener("back", () => {
      if (this.selectedSeasonId) {
        this.selectedSeasonId = null;
      } else {
        this.selectedMediaId = null;
      }
      this.render();
    });

    this.render();
  }

  private changeLanguage(lng: string) {
    i18next.changeLanguage(lng);
    localStorage.setItem("lang", lng);
  }

  private render() {
    this.innerHTML = "";
    
    const header = h("header", { style: "padding: 20px 0; border-bottom: 1px solid var(--border-color); background: var(--header-bg);" },
      h("div", { className: "container", style: "display:flex; justify-content: space-between; align-items:center;" },
        h("a", { href: "/", onclick: (e: Event) => { e.preventDefault(); this.selectedMediaId = null; this.selectedSeasonId = null; this.render(); }, style: "font-size: 24px; font-weight: 800; color: var(--accent-color); letter-spacing: -1px;" }, i18next.t("header.explorer")),
        h("div", { style: "display:flex; gap: 20px; align-items:center;" },
           h("div", { style: "display:flex; gap: 8px; border-right: 1px solid var(--border-color); padding-right: 20px; margin-right: 20px;" },
             h("button", { onclick: () => this.changeLanguage("en"), style: `background: ${i18next.language === 'en' ? 'var(--accent-color)' : 'transparent'}; color: ${i18next.language === 'en' ? 'white' : 'inherit'}; border:none; padding:4px 8px; font-weight:bold; font-size:12px; cursor:pointer; border-radius:4px;` }, "EN"),
             h("button", { onclick: () => this.changeLanguage("es"), style: `background: ${i18next.language === 'es' ? 'var(--accent-color)' : 'transparent'}; color: ${i18next.language === 'es' ? 'white' : 'inherit'}; border:none; padding:4px 8px; font-weight:bold; font-size:12px; cursor:pointer; border-radius:4px;` }, "ES")
           ),
           h("button", { onclick: () => toggleTheme(), style: "border:none; background:transparent; font-size:20px;" }, "🌗"),
           h("a", { href: "/admin", style: "font-weight: 600; font-size: 14px;" }, i18next.t("header.admin_panel"))
        )
      )
    );

    let content: HTMLElement;

    if (this.selectedSeasonId) {
       content = h("div", { className: "container", style: "padding: 40px 0;" },
         h("media-episodes", { 
           mediaId: this.selectedMediaId, 
           seasonId: this.selectedSeasonId 
         } as any)
       );
    } else if (this.selectedMediaId) {
      content = h("div", { className: "container", style: "padding: 40px 0;" },
          h("media-detail", { mediaId: this.selectedMediaId } as any)
      );
    } else {
      const hero = h("section", { style: "padding: 60px 0; text-align:center; background: var(--bg-secondary);" },
          h("div", { className: "container" },
              h("h1", { style: "font-size: 48px; margin-bottom: 10px;" }, i18next.t("hero.title")),
              h("p", { style: "color: var(--text-secondary); max-width: 600px; margin: 0 auto 30px;" }, i18next.t("hero.subtitle")),
              h("div", { style: "max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px;" },
                  h("search-box", {}),
                  h("media-filters", { ...this.currentFilters } as any)
              )
          )
      );
      
      const mediaList = h("media-list") as any;
      // Wait for a tick if needed, or just set filters if connectedCallback will handle it
      if (Object.keys(this.currentFilters).length > 0) {
        mediaList.setFilters(this.currentFilters);
      }
      
      const main = h("main", { className: "container", style: "padding: 40px 0;" },
          h("div", { style: "display: grid; grid-template-columns: 1fr; gap: 40px;" },
              h("div", {},
                  h("div", { style: "display:flex; justify-content: space-between; align-items: center; margin-bottom: 20px;" },
                      h("h2", {}, "Explore Contents"),
                      h("span", { style: "color: var(--text-secondary);" }, "Personalized for you")
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
    this.appendChild(content);
  }
}

customElements.define("public-app", PublicApp);
document.body.appendChild(document.createElement("public-app"));

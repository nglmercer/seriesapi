import i18next from "../utils/i18n";
import { h, toggleTheme } from "../utils/dom";
import { api, type MediaItem } from "./api-service";
import "./admin-view";

type View = "home" | "admin" | "media";

export class AdminApp extends HTMLElement {
  private user: any = null;
  private selectedMediaId: number | null = null;

  constructor() {
    super();
    this.loadUser();
  }

  connectedCallback() {
    i18next.on('languageChanged', () => this.render());
    this.render();
  }

  private loadUser() {
    const userStr = localStorage.getItem("auth_user");
    if (userStr) {
      try {
        this.user = JSON.parse(userStr);
      } catch {
        this.user = null;
      }
    }
  }

  private render() {
    this.innerHTML = "";
    
    const header = h("header", { className: "card", style: "border-radius: 0; margin-bottom: 0px; display: flex; justify-content: space-between; align-items: center; padding: 10px 20px;" },
      h("a", { 
        href: "/", 
        style: "font-size: 24px; font-weight: bold; color: var(--accent-color);"
      }, i18next.t("admin.title")),
      h("div", { style: "display: flex; gap: 20px; align-items: center;" },
        h("div", { style: "display:flex; gap: 8px; border-right: 1px solid var(--border-color); padding-right: 20px; margin-right: 20px;" },
          h("button", { onclick: () => { i18next.changeLanguage("en"); localStorage.setItem("lang", "en"); }, style: `background: ${i18next.language === 'en' ? 'var(--accent-color)' : 'transparent'}; color: ${i18next.language === 'en' ? 'white' : 'inherit'}; border:none; padding:4px 8px; font-weight:bold; font-size:12px; cursor:pointer; border-radius:4px;` }, "EN"),
          h("button", { onclick: () => { i18next.changeLanguage("es"); localStorage.setItem("lang", "es"); }, style: `background: ${i18next.language === 'es' ? 'var(--accent-color)' : 'transparent'}; color: ${i18next.language === 'es' ? 'white' : 'inherit'}; border:none; padding:4px 8px; font-weight:bold; font-size:12px; cursor:pointer; border-radius:4px;` }, "ES")
        ),
        h("button", { onclick: () => toggleTheme() }, i18next.t("admin.theme")),
        h("a", { href: "/" }, i18next.t("admin.public_page")),
        this.user ? h("span", {}, i18next.t("admin.hi_user", { username: this.user.username })) : h("button", { className: "primary" }, i18next.t("admin.login"))
      )
    );

    const main = h("main", { style: "padding-top: 20px;" });
    main.appendChild(h("admin-view"));

    this.appendChild(header);
    this.appendChild(main);
  }
}

customElements.define("admin-app", AdminApp);
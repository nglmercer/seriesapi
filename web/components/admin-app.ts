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
      }, "SeriesAPI Admin"),
      h("div", { style: "display: flex; gap: 20px; align-items: center;" },
        h("button", { onclick: () => toggleTheme() }, "🌓 Theme"),
        h("a", { href: "/" }, "Public Page"),
        this.user ? h("span", {}, `Hi, ${this.user.username}`) : h("button", { className: "primary" }, "Login")
      )
    );

    const main = h("main", { style: "padding-top: 20px;" });
    main.appendChild(h("admin-view"));

    this.appendChild(header);
    this.appendChild(main);
  }
}

customElements.define("admin-app", AdminApp);
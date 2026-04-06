import { h, toggleTheme } from "../utils/dom";
import { api, type MediaItem } from "./api-service";
import "./admin-view";

type View = "home" | "admin" | "media";

export class AppRoot extends HTMLElement {
  private view: View = "home";
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

  private setView(view: View) {
    this.view = view;
    this.render();
  }

  private render() {
    this.innerHTML = "";
    
    const header = h("header", { className: "card", style: "border-radius: 0; margin-bottom: 0px; display: flex; justify-content: space-between; align-items: center; padding: 10px 20px;" },
      h("a", { 
        href: "#", 
        onclick: (e: Event) => { e.preventDefault(); this.setView("home"); },
        style: "font-size: 24px; font-weight: bold; color: var(--accent-color);"
      }, "SeriesAPI Manager"),
      h("div", { style: "display: flex; gap: 20px; align-items: center;" },
        h("button", { onclick: () => toggleTheme() }, "🌓 Theme"),
        h("a", { 
          href: "#", 
          onclick: (e: Event) => { e.preventDefault(); this.setView("home"); },
          style: this.view === 'home' ? 'font-weight:bold' : ''
        }, "Public View"),
        h("a", { 
          href: "#", 
          onclick: (e: Event) => { e.preventDefault(); this.setView("admin"); },
          style: this.view === 'admin' ? 'font-weight:bold' : ''
        }, "Admin Panel"),
        this.user ? h("span", {}, `Hi, ${this.user.username}`) : h("button", { className: "primary" }, "Login")
      )
    );

    const main = h("main", { style: "padding-top: 20px;" });

    if (this.view === "admin") {
      main.appendChild(h("admin-view"));
    } else {
      main.appendChild(h("div", { className: "container" },
        h("h1", {}, "Public Wiki Content"),
        h("p", {}, "This is the public view for explore content."),
        h("media-list")
      ));
    }

    this.appendChild(header);
    this.appendChild(main);
  }
}

customElements.define("app-root", AppRoot);
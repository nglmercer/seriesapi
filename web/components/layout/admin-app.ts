import i18next from "../../utils/i18n";
import { h, toggleTheme } from "../../utils/dom";
import { authStore, type AuthUser } from "../../services/auth-store";
import "../admin/admin-view";
import "./admin-header";
import "./mobile-menu";
import { AdminHeader } from "./admin-header";
import { MobileMenu } from "./mobile-menu";
export class AdminApp extends HTMLElement {
  private user: AuthUser | null = null;
  private unsub?: () => void;
  private isMenuOpen = false;

  // ── Login form state (for inline admin login) ──────────────────────────────
  private loginUsername = "";
  private loginPassword = "";
  private loginError = "";
  private loginLoading = false;

  constructor() {
    super();
  }

  async connectedCallback() {
    i18next.on("languageChanged", () => this.render());

    // Subscribe to auth changes
    this.user = authStore.user;
    this.unsub = authStore.subscribe(u => {
      this.user = u;
      this.render();
    });

    // Init will resolve from localStorage token or clear it
    await authStore.init();
    this.user = authStore.user;
    this.render();
  }

  disconnectedCallback() {
    this.unsub?.();
  }

  private toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    this.render();
  }

  // ── Login handler ──────────────────────────────────────────────────────────

  private async doLogin() {
    if (!this.loginUsername || !this.loginPassword || this.loginLoading) return;
    this.loginLoading = true;
    this.loginError = "";
    this.render();

    const res = await authStore.login(this.loginUsername, this.loginPassword);
    if (res.ok) {
      if (authStore.user?.role !== "admin") {
        // Logged in but not admin
        await authStore.logout();
        this.loginError = "Admin access required.";
      }
      this.user = authStore.user;
    } else {
      this.loginError = res.error || "Login failed";
    }
    this.loginLoading = false;
    this.render();
  }

  private async doLogout() {
    await authStore.logout();
    this.user = null;
    this.loginUsername = "";
    this.loginPassword = "";
    this.loginError = "";
    this.isMenuOpen = false;
    this.render();
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  private render() {
    this.innerHTML = "";

    // 1. Render Lit components for header and mobile menu
    const header = document.createElement("admin-header") as AdminHeader;
    header.user = this.user;
    header.isMenuOpen = this.isMenuOpen;
    header.addEventListener("toggle-menu", () => this.toggleMenu());
    header.addEventListener("logout", () => this.doLogout());
    header.addEventListener("lang-change", () => this.render());
    this.appendChild(header);

    const mobileMenu = document.createElement("mobile-menu") as MobileMenu;
    mobileMenu.open = this.isMenuOpen;
    mobileMenu.user = this.user;
    mobileMenu.addEventListener("close", () => { this.isMenuOpen = false; this.render(); });
    mobileMenu.addEventListener("logout", () => this.doLogout());
    mobileMenu.addEventListener("lang-change", () => this.render());
    this.appendChild(mobileMenu);

    // If not logged in or not admin — show a login gate
    if (!this.user || this.user.role !== "admin") {
      this.appendChild(this.buildLoginGate());
      return;
    }

    // User is admin — render full admin panel
    const main = h("main", { style: "padding-top:20px;" });
    main.appendChild(h("admin-view"));
    this.appendChild(main);
  }

  private buildLoginGate(): HTMLElement {
    const wrap = h("div", {
      style: "min-height:80vh; display:flex; align-items:center; justify-content:center; padding:24px;"
    });

    const card = h("div", {
      style: "background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:20px; padding:40px; width:100%; max-width:380px; box-shadow:0 20px 60px rgba(0,0,0,0.4);"
    });

    const icon = h("div", {
      style: "width:52px; height:52px; border-radius:14px; background:linear-gradient(135deg,var(--accent-color),#c0392b); display:flex; align-items:center; justify-content:center; font-size:22px; margin:0 auto 20px;"
    }, "🔒");

    const title = h("h2", { style: "margin:0 0 4px; text-align:center; font-size:20px; font-weight:800;" },
      "Admin Access"
    );
    const subtitle = h("p", { style: "margin:0 0 28px; text-align:center; color:var(--text-secondary); font-size:14px;" },
      "Sign in with an administrator account"
    );

    // Error message
    const errEl = h("div", {
      style: `background:rgba(231,76,60,.1); border:1px solid rgba(231,76,60,.3); color:#e74c3c; border-radius:8px; padding:10px 14px; font-size:13px; margin-bottom:16px; display:${this.loginError ? "block" : "none"};`
    }, `⚠ ${this.loginError}`);

    // Username field
    const uField = h("div", { style: "margin-bottom:14px;" });
    const uLabel = h("label", { style: "display:block; font-size:11px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:var(--text-secondary); margin-bottom:6px;" }, "Username or Email");
    const uInput = h("input", {
      type: "text",
      value: this.loginUsername,
      placeholder: "admin",
      autocomplete: "username",
      style: "width:100%; box-sizing:border-box; padding:11px 13px; background:var(--bg-primary); border:1.5px solid var(--border-color); border-radius:10px; color:var(--text-primary); font-size:15px; font-family:inherit;",
      oninput: (e: CustomEvent) => { this.loginUsername = (e.target as HTMLInputElement).value; },
      onkeydown: (e: KeyboardEvent) => { if (e.key === "Enter") this.doLogin(); }
    }) as HTMLInputElement;
    uField.append(uLabel, uInput);

    // Password field
    const pField = h("div", { style: "margin-bottom:20px;" });
    const pLabel = h("label", { style: "display:block; font-size:11px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:var(--text-secondary); margin-bottom:6px;" }, "Password");
    const pInput = h("input", {
      type: "password",
      value: this.loginPassword,
      placeholder: "••••••••",
      autocomplete: "current-password",
      style: "width:100%; box-sizing:border-box; padding:11px 13px; background:var(--bg-primary); border:1.5px solid var(--border-color); border-radius:10px; color:var(--text-primary); font-size:15px; font-family:inherit;",
      oninput: (e: CustomEvent) => { this.loginPassword = (e.target as HTMLInputElement).value; },
      onkeydown: (e: KeyboardEvent) => { if (e.key === "Enter") this.doLogin(); }
    }) as HTMLInputElement;
    pField.append(pLabel, pInput);

    const submitBtn = h("button", {
      onclick: () => this.doLogin(),
      disabled: this.loginLoading,
      style: "width:100%; padding:13px; background:linear-gradient(135deg,var(--accent-color),#c0392b); color:#fff; font-weight:700; font-size:15px; border:none; border-radius:10px; cursor:pointer; opacity:" + (this.loginLoading ? ".6" : "1") + ";"
    }, this.loginLoading ? "Signing in…" : "Sign In");

    card.append(icon, title, subtitle, errEl, uField, pField, submitBtn);
    wrap.appendChild(card);
    return wrap;
  }
}

customElements.define("admin-app", AdminApp);
import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { translate } from "lit-i18n";
import { type AuthUser } from "../../services/auth-store";
import { toggleTheme } from "../../utils/dom";
import i18next from "../../utils/i18n";

@customElement("mobile-menu")
export class MobileMenu extends LitElement {
  static override styles = css`
    :host {
      display: contents;
    }

    .mobile-menu {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      background: var(--bg-primary);
      z-index: 100;
      display: flex;
      flex-direction: column;
      padding: 100px 24px 24px;
      gap: 16px;
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow-y: auto;
    }

    .mobile-menu.open {
      transform: translateX(0);
    }

    .mobile-menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 18px;
      font-weight: 600;
      text-decoration: none;
      color: var(--text-primary);
      padding: 16px;
      background: var(--bg-secondary);
      border-radius: 12px;
      border: 1px solid var(--border-color);
      transition: all 0.2s;
      cursor: pointer;
    }

    .mobile-menu-item:active {
      transform: scale(0.98);
      background: var(--border-color);
    }

    .mobile-menu-footer {
      margin-top: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-top: 24px;
      border-top: 1px solid var(--border-color);
    }

    .lang-switcher {
      display: flex;
      gap: 8px;
    }

    .lang-btn {
      flex: 1;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      padding: 12px;
      font-weight: bold;
      font-size: 14px;
      cursor: pointer;
      border-radius: 8px;
      color: var(--text-primary);
    }

    .lang-btn.active {
      background: var(--accent-color);
      color: white;
      border-color: var(--accent-color);
    }
  `;

  @property({ type: Boolean }) open = false;
  @property({ type: Object }) user: AuthUser | null = null;

  private handleClose() {
    this.dispatchEvent(new CustomEvent("close"));
  }

  private handleHome() {
    this.dispatchEvent(new CustomEvent("home-click"));
    this.handleClose();
  }

  private handleProfile() {
    this.dispatchEvent(new CustomEvent("profile-click"));
    this.handleClose();
  }

  private handleAdmin() {
    this.handleClose();
  }

  private handleTheme() {
    toggleTheme();
  }

  private handleLanguage(lng: string) {
    i18next.changeLanguage(lng);
    localStorage.setItem("lang", lng);
    this.dispatchEvent(new CustomEvent("lang-change", { detail: { lng } }));
    this.requestUpdate();
  }

  private openAuth() {
    this.dispatchEvent(new CustomEvent("need-login"));
    this.handleClose();
  }

  private doLogout() {
    this.dispatchEvent(new CustomEvent("logout"));
    this.handleClose();
  }

  override render() {
    const isAdmin = window.location.pathname.startsWith("/admin");

    return html`
      <div class="mobile-menu ${this.open ? "open" : ""}">
        <div class="mobile-menu-item" @click=${this.handleHome}>
          🏠 ${translate("header.explorer")}
        </div>
        
        ${isAdmin 
          ? html`
            <a class="mobile-menu-item" href="/" @click=${this.handleClose}>
              🌐 ${translate("admin.public_page", "Public Page")}
            </a>
          `
          : html`
            <a class="mobile-menu-item" href="/admin" @click=${this.handleAdmin}>
              ⚙️ ${translate("header.admin_panel")}
            </a>
          `
        }

        ${this.user 
          ? html`
            <div class="mobile-menu-item" @click=${this.handleProfile}>
              👤 ${translate("profile.title", "Profile")}
            </div>
            <div class="mobile-menu-item" @click=${this.doLogout} style="color: var(--error-color, #d33);">
              🚪 ${translate("auth.sign_out", "Sign Out")}
            </div>
          `
          : html`
            <div class="mobile-menu-item" @click=${this.openAuth}>
              🔑 ${translate("auth.sign_in", "Sign In")}
            </div>
          `
        }

        <div class="mobile-menu-footer">
          <div class="lang-switcher">
            <button 
              class="lang-btn ${i18next.language === "en" ? "active" : ""}"
              @click=${() => this.handleLanguage("en")}
            >English</button>
            <button 
              class="lang-btn ${i18next.language === "es" ? "active" : ""}"
              @click=${() => this.handleLanguage("es")}
            >Español</button>
          </div>
          <button class="mobile-menu-item" @click=${this.handleTheme} style="justify-content: center;">
            🌗 ${translate("theme.toggle", "Toggle Theme")}
          </button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "mobile-menu": MobileMenu;
  }
}

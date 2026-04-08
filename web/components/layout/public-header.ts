import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { translate } from "lit-i18n";
import { type AuthUser } from "../../services/auth-store";
import { initials, avatarColor } from "../shared/comment-avatar";
import { toggleTheme } from "../../utils/dom";
import i18next from "../../utils/i18n";
import { ICONS } from "../../utils/icons";

@customElement("public-header")
export class PublicHeader extends LitElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
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
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
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
    
    .lang-separator {
      display: flex;
      gap: 4px;
      border-right: 1px solid var(--border-color);
      padding-right: 12px;
      margin-right: 4px;
    }

    .menu-toggle {
      display: none;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 8px;
      z-index: 101;
      color: var(--text-primary);
    }

    .menu-toggle svg {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }

    @media (max-width: 768px) {
      .header-actions .admin-link, 
      .header-actions .lang-separator,
      .header-actions .auth-chip .user-name { display: none; }
      
      .menu-toggle {
        display: block;
      }
    }
  `;

  @property({ type: Object }) user: AuthUser | null = null;
  @property({ type: Boolean }) isMenuOpen = false;

  private handleLanguageChange(lng: string) {
    i18next.changeLanguage(lng);
    localStorage.setItem("lang", lng);
    this.dispatchEvent(new CustomEvent("lang-change", { detail: { lng } }));
    this.requestUpdate();
  }

  private toggleMenu() {
    this.dispatchEvent(new CustomEvent("toggle-menu"));
  }

  private handleHomeClick(e: Event) {
    e.preventDefault();
    this.dispatchEvent(new CustomEvent("home-click"));
  }

  private handleProfileClick() {
    this.dispatchEvent(new CustomEvent("profile-click"));
  }

  private openAuth() {
    this.dispatchEvent(new CustomEvent("need-login"));
  }

  private async doLogout(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent("logout"));
  }

  override render() {
    return html`
      <header>
        <div class="container">
          <a class="logo" href="/" @click=${this.handleHomeClick}>
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
            <button class="theme-btn" @click=${toggleTheme} title="Toggle Theme">${ICONS.theme}</button>
            <a class="admin-link" href="/admin">${translate("header.admin_panel")}</a>
            ${this.renderAuth()}
            <button class="menu-toggle" @click=${this.toggleMenu} aria-label="Toggle Menu">
              ${this.isMenuOpen 
                ? ICONS.close
                : ICONS.menu
              }
            </button>
          </div>
        </div>
      </header>
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
          <button class="sign-out-btn" @click=${this.doLogout}>
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
}

declare global {
  interface HTMLElementTagNameMap {
    "public-header": PublicHeader;
  }
}

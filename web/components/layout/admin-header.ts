import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { translate } from "lit-i18n";
import { type AuthUser } from "../../services/auth-store";
import { toggleTheme } from "../../utils/dom";
import i18next from "../../utils/i18n";

@customElement("admin-header")
export class AdminHeader extends LitElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
    }
    
    header {
      padding: 10px 20px;
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-secondary);
      position: sticky;
      top: 0;
      z-index: 50;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .logo {
      font-size: 22px;
      font-weight: 900;
      color: var(--accent-color);
      text-decoration: none;
    }
    
    .header-actions {
      display: flex;
      gap: 16px;
      align-items: center;
    }
    
    .lang-switcher {
      display: flex;
      gap: 6px;
      border-right: 1px solid var(--border-color);
      padding-right: 16px;
    }
    
    .lang-btn {
      background: transparent;
      border: none;
      padding: 4px 8px;
      font-weight: bold;
      font-size: 12px;
      cursor: pointer;
      border-radius: 4px;
      color: var(--text-primary);
    }
    
    .lang-btn.active {
      background: var(--accent-color);
      color: white;
    }
    
    .theme-btn {
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 18px;
      padding: 4px;
      border-radius: 50%;
    }

    .theme-btn:hover {
      background: var(--bg-primary);
    }
    
    .public-link {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-secondary);
      text-decoration: none;
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .user-badge {
      font-size: 13px;
      font-weight: 600;
      background: rgba(255,71,87,0.1);
      color: var(--accent-color);
      padding: 4px 10px;
      border-radius: 6px;
    }
    
    .sign-out-btn {
      font-size: 12px;
      background: none;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
    }

    .menu-toggle {
      display: none;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 8px;
      color: var(--text-primary);
    }

    .menu-toggle svg {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }

    @media (max-width: 768px) {
      .header-actions .public-link,
      .header-actions .lang-switcher,
      .header-actions .user-info {
        display: none;
      }
      
      .menu-toggle {
        display: block;
      }
    }
  `;

  @property({ type: Object }) user: AuthUser | null = null;
  @property({ type: Boolean }) isMenuOpen = false;

  private toggleMenu() {
    this.dispatchEvent(new CustomEvent("toggle-menu"));
  }

  private handleLanguageChange(lng: string) {
    i18next.changeLanguage(lng);
    localStorage.setItem("lang", lng);
    this.dispatchEvent(new CustomEvent("lang-change", { detail: { lng } }));
    this.requestUpdate();
  }

  private doLogout() {
    this.dispatchEvent(new CustomEvent("logout"));
  }

  override render() {
    return html`
      <header>
        <a class="logo" href="/">${translate("admin.title", "Admin")}</a>
        
        <div class="header-actions">
          <div class="lang-switcher">
            <button 
              class="lang-btn ${i18next.language === "en" ? "active" : ""}"
              @click=${() => this.handleLanguageChange("en")}
            >EN</button>
            <button 
              class="lang-btn ${i18next.language === "es" ? "active" : ""}"
              @click=${() => this.handleLanguageChange("es")}
            >ES</button>
          </div>
          
          <button class="theme-btn" @click=${toggleTheme}>🌗</button>
          
          <a class="public-link" href="/">${translate("admin.public_page", "Public Page")}</a>
          
          ${this.user ? html`
            <div class="user-info">
              <span class="user-badge">👤 ${this.user.display_name || this.user.username}</span>
              <button class="sign-out-btn" @click=${this.doLogout}>
                ${translate("auth.sign_out", "Sign Out")}
              </button>
            </div>
          ` : ""}

          <button class="menu-toggle" @click=${this.toggleMenu} aria-label="Toggle Menu">
            ${this.isMenuOpen 
              ? html`<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`
              : html`<svg viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>`
            }
          </button>
        </div>
      </header>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "admin-header": AdminHeader;
  }
}

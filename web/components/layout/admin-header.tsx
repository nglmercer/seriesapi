import { h } from 'preact';
import { toggleTheme } from "../../utils/dom";
import i18next from "../../utils/i18n";
import { ICONS } from "../../utils/icons";
import type { AuthUser } from "../../services/auth-store";

interface AdminHeaderProps {
  user?: AuthUser | null;
  isMenuOpen?: boolean;
  onToggleMenu?: () => void;
  onLogout?: () => void;
}

export function AdminHeader({ user, isMenuOpen = false, onToggleMenu, onLogout }: AdminHeaderProps) {
  function handleLanguageChange(lng: string) {
    i18next.changeLanguage(lng);
    localStorage.setItem("lang", lng);
  }

  return (
    <header>
      <a class="logo" href="/">Admin</a>

      <div class="header-actions">
        <div class="lang-switcher">
          <button class={`lang-btn ${i18next.language === "en" ? "active" : ""}`} onClick={() => handleLanguageChange("en")}>EN</button>
          <button class={`lang-btn ${i18next.language === "es" ? "active" : ""}`} onClick={() => handleLanguageChange("es")}>ES</button>
        </div>

        <button class="theme-btn" onClick={toggleTheme}>{ICONS.theme}</button>

        <a class="public-link" href="/">Public Page</a>

        {user && (
          <div class="user-info">
            <span class="user-badge">{ICONS.profile} {user.display_name || user.username}</span>
            <button class="sign-out-btn" onClick={onLogout}>
              Sign Out
            </button>
          </div>
        )}

        <button class="menu-toggle" onClick={onToggleMenu} aria-label="Toggle Menu">
          {isMenuOpen ? ICONS.close : ICONS.menu}
        </button>
      </div>
    </header>
  );
}
import { h } from 'preact';
import { useState } from 'preact/hooks';
import { toggleTheme } from "../../utils/dom";
import i18next from "../../utils/i18n";
import { ICONS } from "../../utils/icons";
import { initials, avatarColor } from "../shared/comment-avatar";
import type { AuthUser } from "../../services/auth-store";

interface PublicHeaderProps {
  user?: AuthUser | null;
  isMenuOpen?: boolean;
  onToggleMenu?: () => void;
  onHomeClick?: () => void;
  onProfileClick?: () => void;
  onNeedLogin?: () => void;
  onLogout?: () => void;
}

export function PublicHeader({ user, isMenuOpen = false, onToggleMenu, onHomeClick, onProfileClick, onNeedLogin, onLogout }: PublicHeaderProps) {
  const [currentLng, setCurrentLng] = useState(i18next.language);

  function handleLanguageChange(lng: string) {
    i18next.changeLanguage(lng);
    localStorage.setItem("lang", lng);
    setCurrentLng(lng);
  }

  return (
    <header>
      <div class="container">
        <a class="logo" href="/" onClick={(e) => { e.preventDefault(); if (onHomeClick) onHomeClick(); }}>
          {i18next.t("header.explorer", "Series Explorer")}
        </a>
        <div class="header-actions">
          <div class="lang-separator">
            <button class={`lang-btn ${currentLng === "en" ? "active" : ""}`} onClick={() => handleLanguageChange("en")}>EN</button>
            <button class={`lang-btn ${currentLng === "es" ? "active" : ""}`} onClick={() => handleLanguageChange("es")}>ES</button>
          </div>

          <button class="theme-btn" onClick={toggleTheme}>{ICONS.theme}</button>

          <a class="admin-link" href="/admin">Admin</a>

          {user ? (
            <div class="auth-chip" onClick={onProfileClick}>
              <div class="avatar" style={{ background: avatarColor(user.display_name) }}>
                {initials(user.display_name)}
              </div>
              <span class="user-name">{user.display_name}</span>
              <button class="sign-out-btn" onClick={(e) => { e.stopPropagation(); if (onLogout) onLogout(); }}>
                {i18next.t("auth.sign_out", "Sign Out")}
              </button>
            </div>
          ) : (
            <button class="sign-in-btn" onClick={onNeedLogin}>
              {i18next.t("auth.sign_in", "Sign In")}
            </button>
          )}

          <button class="menu-toggle" onClick={onToggleMenu} aria-label="Toggle Menu">
            {isMenuOpen ? ICONS.close : ICONS.menu}
          </button>
        </div>
      </div>
    </header>
  );
}
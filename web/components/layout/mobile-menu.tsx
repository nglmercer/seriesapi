import { h } from 'preact';
import { ICONS } from "../../utils/icons";
import { toggleTheme } from "../../utils/dom";
import i18next from "../../utils/i18n";
import { initials, avatarColor } from "../shared/comment-avatar";
import type { AuthUser } from "../../services/auth-store";

interface MobileMenuProps {
  open?: boolean;
  user?: AuthUser | null;
  onClose?: () => void;
  onHomeClick?: () => void;
  onProfileClick?: () => void;
  onNeedLogin?: () => void;
  onLogout?: () => void;
}

export function MobileMenu({ open = false, user, onClose, onHomeClick, onProfileClick, onNeedLogin, onLogout }: MobileMenuProps) {
  const isAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith("/admin");

  function handleLanguage(lng: string) {
    i18next.changeLanguage(lng);
    localStorage.setItem("lang", lng);
  }

  return (
    <div class={`mobile-menu ${open ? "open" : ""}`}>
      <button class="close-btn" onClick={onClose}>
        {ICONS.close}
      </button>

      <div class="mobile-menu-item" onClick={() => { if (onHomeClick) onHomeClick(); onClose?.(); }}>
        {ICONS.home} {i18next.t("header.explorer", "Series Explorer")}
      </div>

      {isAdmin ? (
        <a class="mobile-menu-item" href="/" onClick={onClose}>
          {ICONS.world} Public Page
        </a>
      ) : (
        <a class="mobile-menu-item" href="/admin" onClick={onClose}>
          {ICONS.admin} Admin Panel
        </a>
      )}

      {user ? (
        <>
          <div class="mobile-menu-item" onClick={() => { if (onProfileClick) onProfileClick(); onClose?.(); }}>
            {ICONS.profile} Profile
          </div>
          <div class="mobile-menu-item" onClick={() => { if (onLogout) onLogout(); onClose?.(); }} style="color: var(--error-color, #d33);">
            {ICONS.logout} Sign Out
          </div>
        </>
      ) : (
        <div class="mobile-menu-item" onClick={() => { if (onNeedLogin) onNeedLogin(); onClose?.(); }}>
          {ICONS.login} Sign In
        </div>
      )}

      <div class="mobile-menu-footer">
        <button class="theme-btn" onClick={toggleTheme} style="align-self: flex-start;">{ICONS.theme}</button>

        <div class="lang-switcher">
          <button class={`lang-btn ${i18next.language === "en" ? "active" : ""}`} onClick={() => handleLanguage("en")}>EN</button>
          <button class={`lang-btn ${i18next.language === "es" ? "active" : ""}`} onClick={() => handleLanguage("es")}>ES</button>
        </div>
      </div>
    </div>
  );
}
import { h } from 'preact';
import { useState } from 'preact/hooks';
import { toggleTheme } from "../../utils/dom";
import i18next from "../../utils/i18n";
import { ICONS } from "../../utils/icons";
import { initials, avatarColor } from "../shared/comment-avatar";
import type { AuthUser } from "../../services/auth-store";
import styles from './public-header.module.css';

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

  async function handleLanguageChange(lng: string) {
    await i18next.changeLanguage(lng);
    localStorage.setItem("lang", lng);
    setCurrentLng(lng);
    // Reload page to ensure all components refresh with new language
    window.location.reload();
  }

  return (
    <header class={styles.header}>
      <div class={styles.headerContent}>
        <a class={styles.logo} href="/" onClick={(e) => { e.preventDefault(); if (onHomeClick) onHomeClick(); }}>
          {i18next.t("header.explorer", "Series Explorer")}
        </a>
        <div class={styles.headerActions}>
          <div class={styles.langSeparator}>
            <button class={`${styles.langBtn} ${currentLng === "en" ? styles.active : ""}`} onClick={() => handleLanguageChange("en")}>EN</button>
            <button class={`${styles.langBtn} ${currentLng === "es" ? styles.active : ""}`} onClick={() => handleLanguageChange("es")}>ES</button>
          </div>

          <button class={styles.themeBtn} onClick={toggleTheme}>{ICONS.theme}</button>

          <a class={styles.adminLink} href="/admin">{i18next.t("header.admin_panel", "Admin Panel")}</a>

          {user ? (
            <div class={styles.authChip} onClick={onProfileClick}>
              <div class={styles.avatar} style={{ background: avatarColor(user.display_name) }}>
                {initials(user.display_name)}
              </div>
              <span class={styles.userName}>{user.display_name}</span>
              <button class={styles.signOutBtn} onClick={(e) => { e.stopPropagation(); if (onLogout) onLogout(); }}>
                {i18next.t("auth.sign_out", "Sign Out")}
              </button>
            </div>
          ) : (
            <button class={styles.signInBtn} onClick={onNeedLogin}>
              {i18next.t("auth.sign_in", "Sign In")}
            </button>
          )}

          <button class={styles.menuToggle} onClick={onToggleMenu} aria-label="Toggle Menu">
            {isMenuOpen ? ICONS.close : ICONS.menu}
          </button>
        </div>
      </div>
    </header>
  );
}
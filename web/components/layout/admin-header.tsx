import { h } from 'preact';
import { toggleTheme } from "../../utils/dom";
import i18next from "../../utils/i18n";
import { ICONS } from "../../utils/icons";
import type { AuthUser } from "../../services/auth-store";
import styles from './admin-header.module.css';

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
    <header class={styles.header}>
      <a class={styles.logo} href="/">Admin</a>

      <div class={styles.headerActions}>
        <div class={styles.langSwitcher}>
          <button class={`${styles.langBtn} ${i18next.language === "en" ? styles.active : ""}`} onClick={() => handleLanguageChange("en")}>EN</button>
          <button class={`${styles.langBtn} ${i18next.language === "es" ? styles.active : ""}`} onClick={() => handleLanguageChange("es")}>ES</button>
        </div>

        <button class={styles.themeBtn} onClick={toggleTheme}>{ICONS.theme}</button>

        <a class={styles.publicLink} href="/">Public Page</a>

        {user && (
          <div class={styles.userInfo}>
            <span class={styles.userBadge}>{ICONS.profile} {user.display_name || user.username}</span>
            <button class={styles.signOutBtn} onClick={onLogout}>
              Sign Out
            </button>
          </div>
        )}

        <button class={styles.menuToggle} onClick={onToggleMenu} aria-label="Toggle Menu">
          {isMenuOpen ? ICONS.close : ICONS.menu}
        </button>
      </div>
    </header>
  );
}
import { h } from 'preact';
import { ICONS } from "../../utils/icons";
import { toggleTheme } from "../../utils/dom";
import i18next from "../../utils/i18n";
import { initials, avatarColor } from "../shared/comment-avatar";
import type { AuthUser } from "../../services/auth-store";
import styles from './mobile-menu.module.css';

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
    <div class={`${styles.mobileMenu} ${open ? styles.open : ""}`}>
      <button class={styles.closeBtn} onClick={onClose}>
        {ICONS.close}
      </button>

      <div class={styles.mobileMenuItem} onClick={() => { if (onHomeClick) onHomeClick(); onClose?.(); }}>
        {ICONS.home} {i18next.t("header.explorer", "Series Explorer")}
      </div>

      {isAdmin ? (
        <a class={styles.mobileMenuItem} href="/" onClick={onClose}>
          {ICONS.world} Public Page
        </a>
      ) : (
        <a class={styles.mobileMenuItem} href="/admin" onClick={onClose}>
          {ICONS.admin} Admin Panel
        </a>
      )}

      {user ? (
        <>
          <div class={styles.mobileMenuItem} onClick={() => { if (onProfileClick) onProfileClick(); onClose?.(); }}>
            {ICONS.profile} Profile
          </div>
          <div class={styles.mobileMenuItem} onClick={() => { if (onLogout) onLogout(); onClose?.(); }} style="color: var(--error-color, #d33);">
            {ICONS.logout} Sign Out
          </div>
        </>
      ) : (
        <div class={styles.mobileMenuItem} onClick={() => { if (onNeedLogin) onNeedLogin(); onClose?.(); }}>
          {ICONS.login} Sign In
        </div>
      )}

      <div class={styles.mobileMenuFooter}>
        <button class={styles.themeBtn} onClick={toggleTheme}>{ICONS.theme}</button>

        <div class={styles.langSwitcher}>
          <button class={`${styles.langBtn} ${i18next.language === "en" ? styles.active : ""}`} onClick={() => handleLanguage("en")}>EN</button>
          <button class={`${styles.langBtn} ${i18next.language === "es" ? styles.active : ""}`} onClick={() => handleLanguage("es")}>ES</button>
        </div>
      </div>
    </div>
  );
}
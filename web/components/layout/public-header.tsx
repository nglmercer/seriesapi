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

  async function handleLanguageChange(lng: string) {
    await i18next.changeLanguage(lng);
    localStorage.setItem("lang", lng);
    setCurrentLng(lng);
    // Reload page to ensure all components refresh with new language
    window.location.reload();
  }

  return (
    <header class="sticky top-0 z-50 bg-header border-b border-border px-5">
      <div class="flex items-center justify-between h-16 max-w-[1200px] mx-auto px-5">
        <a class="text-lg font-extrabold text-primary hover:text-accent transition-colors no-underline" href="/" onClick={(e) => { e.preventDefault(); if (onHomeClick) onHomeClick(); }}>
          {i18next.t("header.explorer", "Series Explorer")}
        </a>
        <div class="flex items-center gap-4">
          <div class="hidden md:flex gap-1">
            <button 
              class={`px-2.5 py-1.5 bg-transparent border border-border rounded-md text-xs font-bold transition-all hover:bg-secondary ${currentLng === "en" ? "bg-accent border-accent text-white" : "text-text-secondary"}`} 
              onClick={() => handleLanguageChange("en")}
            >
              EN
            </button>
            <button 
              class={`px-2.5 py-1.5 bg-transparent border border-border rounded-md text-xs font-bold transition-all hover:bg-secondary ${currentLng === "es" ? "bg-accent border-accent text-white" : "text-text-secondary"}`} 
              onClick={() => handleLanguageChange("es")}
            >
              ES
            </button>
          </div>

          <button class="p-2 bg-transparent border-none text-lg cursor-pointer transition-transform hover:scale-110" onClick={toggleTheme}>{ICONS.theme}</button>

          <a class="hidden md:block px-4 py-2 bg-accent text-white rounded-lg text-[13px] font-semibold no-underline transition-all hover:bg-accent-hover" href="/admin">{i18next.t("header.admin_panel", "Admin Panel")}</a>

          {user ? (
            <div class="hidden md:flex items-center gap-2.5 p-1.5 pr-3 bg-secondary border border-border rounded-full cursor-pointer transition-all hover:border-accent" onClick={onProfileClick}>
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: avatarColor(user.display_name) }}>
                {initials(user.display_name)}
              </div>
              <span class="text-sm font-semibold text-primary">{user.display_name}</span>
              <button class="px-2.5 py-1 bg-transparent border border-border rounded-md text-[11px] text-text-secondary cursor-pointer transition-all hover:bg-error hover:border-error hover:text-white" onClick={(e) => { e.stopPropagation(); if (onLogout) onLogout(); }}>
                {i18next.t("auth.sign_out", "Sign Out")}
              </button>
            </div>
          ) : (
            <button class="hidden md:block px-5 py-2 bg-accent border-none rounded-lg text-sm font-semibold text-white cursor-pointer transition-all hover:bg-accent-hover" onClick={onNeedLogin}>
              {i18next.t("auth.sign_in", "Sign In")}
            </button>
          )}

          <button class="md:hidden p-2 bg-transparent border-none text-xl cursor-pointer" onClick={onToggleMenu} aria-label="Toggle Menu">
            {isMenuOpen ? ICONS.close : ICONS.menu}
          </button>
        </div>
      </div>
    </header>
  );
}
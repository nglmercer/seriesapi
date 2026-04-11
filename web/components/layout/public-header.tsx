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
    <header class="sticky top-0 z-50 bg-base-100/80 backdrop-blur-md border-b border-base-content/10">
      <div class="navbar max-w-[1200px] mx-auto px-4 min-h-16">
        <div class="flex-1">
          <a class="btn btn-ghost text-xl font-extrabold normal-case tracking-tight hover:bg-transparent" href="/" onClick={(e) => { e.preventDefault(); if (onHomeClick) onHomeClick(); }}>
            <span class="text-primary">{i18next.t("header.explorer", "Series Explorer")}</span>
          </a>
        </div>
        
        <div class="flex-none gap-2">
          <div class="hidden md:flex join">
            <button 
              class={`join-item btn btn-xs ${currentLng === "en" ? "btn-primary" : "btn-ghost border-base-content/10"}`} 
              onClick={() => handleLanguageChange("en")}
            >
              EN
            </button>
            <button 
              class={`join-item btn btn-xs ${currentLng === "es" ? "btn-primary" : "btn-ghost border-base-content/10"}`} 
              onClick={() => handleLanguageChange("es")}
            >
              ES
            </button>
          </div>

          <button class="btn btn-ghost btn-circle btn-sm" onClick={toggleTheme} title={i18next.t("header.toggle_theme", "Toggle Theme")}>
            <span class="text-lg">{ICONS.theme}</span>
          </button>

          <a class="hidden md:inline-flex btn btn-primary btn-sm" href="/admin">
            {i18next.t("header.admin_panel", "Admin Panel")}
          </a>

          {user ? (
            <div class="hidden md:flex items-center gap-3 pl-1 pr-3 py-1 bg-base-200 rounded-full border border-base-content/5 hover:border-primary/30 transition-all cursor-pointer group" onClick={onProfileClick}>
              <div class="avatar placeholder">
                <div class="bg-neutral text-neutral-content rounded-full w-8 ring ring-primary ring-offset-base-100 ring-offset-2 ring-0 group-hover:ring-1 transition-all">
                  <span class="text-xs font-bold">{initials(user.display_name)}</span>
                </div>
              </div>
              <span class="text-sm font-bold opacity-80">{user.display_name}</span>
              <button class="btn btn-ghost btn-xs text-error hover:bg-error/10" onClick={(e) => { e.stopPropagation(); if (onLogout) onLogout(); }}>
                {i18next.t("auth.sign_out", "Sign Out")}
              </button>
            </div>
          ) : (
            <button class="hidden md:inline-flex btn btn-primary btn-sm" onClick={onNeedLogin}>
              {i18next.t("auth.sign_in", "Sign In")}
            </button>
          )}

          <button class="btn btn-ghost btn-circle btn-sm md:hidden" onClick={onToggleMenu} aria-label="Toggle Menu">
            <span class="text-xl">{isMenuOpen ? ICONS.close : ICONS.menu}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
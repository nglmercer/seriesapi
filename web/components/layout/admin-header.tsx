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
    <header class="sticky top-0 z-50 bg-base-100/80 backdrop-blur-md border-b border-base-content/10">
      <div class="navbar px-4 min-h-16">
        <div class="flex-1">
          <a class="btn btn-ghost text-xl font-extrabold normal-case tracking-tight hover:bg-transparent" href="/admin">
            <span class="text-primary">Admin</span>
          </a>
        </div>

        <div class="flex-none gap-2">
          <div class="hidden md:flex join">
            <button 
              class={`join-item btn btn-xs ${i18next.language === "en" ? "btn-primary" : "btn-ghost border-base-content/10"}`} 
              onClick={() => handleLanguageChange("en")}
            >
              EN
            </button>
            <button 
              class={`join-item btn btn-xs ${i18next.language === "es" ? "btn-primary" : "btn-ghost border-base-content/10"}`} 
              onClick={() => handleLanguageChange("es")}
            >
              ES
            </button>
          </div>

          <button class="btn btn-ghost btn-circle btn-sm" onClick={toggleTheme} title={i18next.t("header.toggle_theme", "Toggle Theme")}>
            <span class="text-lg">{ICONS.theme}</span>
          </button>

          <a class="hidden md:inline-flex btn btn-outline btn-sm rounded-xl" href="/">
            Public Page
          </a>

          {user && (
            <div class="hidden md:flex items-center gap-3 ml-2">
              <div class="badge badge-primary badge-outline font-bold gap-2 py-3">
                {ICONS.profile} {user.display_name || user.username}
              </div>
              <button class="btn btn-ghost btn-sm text-error hover:bg-error/10" onClick={onLogout}>
                Sign Out
              </button>
            </div>
          )}

          <button class="btn btn-ghost btn-circle btn-sm md:hidden" onClick={onToggleMenu} aria-label="Toggle Menu">
            <span class="text-xl">{isMenuOpen ? ICONS.close : ICONS.menu}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
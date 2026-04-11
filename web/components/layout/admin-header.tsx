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
    <header class="sticky top-0 z-50 bg-header border-b border-border px-5 flex items-center justify-between h-16">
      <a class="text-lg font-extrabold text-primary no-underline" href="/">Admin</a>

      <div class="flex items-center gap-4">
        <div class="hidden md:flex gap-1">
          <button class={`px-2.5 py-1.5 bg-transparent border border-border rounded-md text-xs font-bold transition-all hover:bg-secondary ${i18next.language === "en" ? "bg-accent border-accent text-white" : "text-text-secondary"}`} onClick={() => handleLanguageChange("en")}>EN</button>
          <button class={`px-2.5 py-1.5 bg-transparent border border-border rounded-md text-xs font-bold transition-all hover:bg-secondary ${i18next.language === "es" ? "bg-accent border-accent text-white" : "text-text-secondary"}`} onClick={() => handleLanguageChange("es")}>ES</button>
        </div>

        <button class="p-2 bg-transparent border-none text-lg cursor-pointer transition-transform hover:scale-110" onClick={toggleTheme}>{ICONS.theme}</button>

        <a class="hidden md:block px-4 py-2 bg-secondary text-primary rounded-lg text-xs font-bold border border-border no-underline hover:bg-border transition-all" href="/">Public Page</a>

        {user && (
          <div class="hidden md:flex items-center gap-3">
            <span class="flex items-center gap-2 px-3 py-1.5 bg-accent/10 text-accent text-xs font-bold rounded-full">{ICONS.profile} {user.display_name || user.username}</span>
            <button class="px-3 py-1.5 bg-transparent border border-error/30 text-error text-xs font-bold rounded-lg hover:bg-error hover:text-white transition-all" onClick={onLogout}>
              Sign Out
            </button>
          </div>
        )}

        <button class="md:hidden p-2 bg-transparent border-none text-xl cursor-pointer" onClick={onToggleMenu} aria-label="Toggle Menu">
          {isMenuOpen ? ICONS.close : ICONS.menu}
        </button>
      </div>
    </header>
  );
}
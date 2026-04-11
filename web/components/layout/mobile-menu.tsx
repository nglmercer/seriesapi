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
    <div class={`fixed inset-0 z-[200] bg-primary flex flex-col p-5 transition-transform duration-300 transform ${open ? "translate-x-0" : "translate-x-full"}`}>
      <button class="self-end p-2 text-2xl bg-transparent border-none cursor-pointer mb-5" onClick={onClose}>
        {ICONS.close}
      </button>

      <div class="flex items-center gap-4 p-4 text-lg font-semibold text-primary border-b border-border no-underline cursor-pointer transition-colors hover:bg-secondary" onClick={() => { if (onHomeClick) onHomeClick(); onClose?.(); }}>
        {ICONS.home} {i18next.t("header.explorer", "Series Explorer")}
      </div>

      {isAdmin ? (
        <a class="flex items-center gap-4 p-4 text-lg font-semibold text-primary border-b border-border no-underline cursor-pointer transition-colors hover:bg-secondary" href="/" onClick={onClose}>
          {ICONS.world} Public Page
        </a>
      ) : (
        <a class="flex items-center gap-4 p-4 text-lg font-semibold text-primary border-b border-border no-underline cursor-pointer transition-colors hover:bg-secondary" href="/admin" onClick={onClose}>
          {ICONS.admin} Admin Panel
        </a>
      )}

      {user ? (
        <>
          <div class="flex items-center gap-4 p-4 text-lg font-semibold text-primary border-b border-border no-underline cursor-pointer transition-colors hover:bg-secondary" onClick={() => { if (onProfileClick) onProfileClick(); onClose?.(); }}>
            {ICONS.profile} Profile
          </div>
          <div class="flex items-center gap-4 p-4 text-lg font-semibold border-b border-border no-underline cursor-pointer transition-colors hover:bg-secondary text-error" onClick={() => { if (onLogout) onLogout(); onClose?.(); }}>
            {ICONS.logout} Sign Out
          </div>
        </>
      ) : (
        <div class="flex items-center gap-4 p-4 text-lg font-semibold text-primary border-b border-border no-underline cursor-pointer transition-colors hover:bg-secondary" onClick={() => { if (onNeedLogin) onNeedLogin(); onClose?.(); }}>
          {ICONS.login} Sign In
        </div>
      )}

      <div class="mt-auto flex items-center justify-between p-4 border-t border-border">
        <button class="p-2 bg-transparent border-none text-2xl cursor-pointer" onClick={toggleTheme}>{ICONS.theme}</button>

        <div class="flex gap-2">
          <button class={`px-3 py-1.5 bg-transparent border border-border rounded-md text-sm font-bold cursor-pointer ${i18next.language === "en" ? "bg-accent border-accent text-white" : "text-text-secondary"}`} onClick={() => handleLanguage("en")}>EN</button>
          <button class={`px-3 py-1.5 bg-transparent border border-border rounded-md text-sm font-bold cursor-pointer ${i18next.language === "es" ? "bg-accent border-accent text-white" : "text-text-secondary"}`} onClick={() => handleLanguage("es")}>ES</button>
        </div>
      </div>
    </div>
  );
}
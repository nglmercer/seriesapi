import { h } from 'preact';
import { PublicHeader } from "./public-header";
import { MobileMenu } from "./mobile-menu";
import type { AuthUser } from "../../services/auth-store";

interface PublicAppProps {
  user?: AuthUser | null;
  isMenuOpen?: boolean;
  onToggleMenu?: () => void;
  onHomeClick?: () => void;
  onProfileClick?: () => void;
  onNeedLogin?: () => void;
  onLogout?: () => void;
}

export function PublicApp({ user, isMenuOpen, onToggleMenu, onHomeClick, onProfileClick, onNeedLogin, onLogout }: PublicAppProps) {
  return (
    <div>
      <PublicHeader
        user={user}
        isMenuOpen={isMenuOpen}
        onToggleMenu={onToggleMenu}
        onHomeClick={onHomeClick}
        onProfileClick={onProfileClick}
        onNeedLogin={onNeedLogin}
        onLogout={onLogout}
      />
      <MobileMenu
        open={isMenuOpen}
        user={user}
        onClose={() => onToggleMenu?.()}
        onHomeClick={onHomeClick}
        onProfileClick={onProfileClick}
        onNeedLogin={onNeedLogin}
        onLogout={onLogout}
      />
    </div>
  );
}
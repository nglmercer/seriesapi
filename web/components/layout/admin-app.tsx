import { h } from 'preact';
import { AdminHeader } from "./admin-header";
import { MobileMenu } from "./mobile-menu";
import type { AuthUser } from "../../services/auth-store";

interface AdminAppProps {
  user?: AuthUser | null;
  isMenuOpen?: boolean;
  onToggleMenu?: () => void;
  onLogout?: () => void;
}

export function AdminApp({ user, isMenuOpen, onToggleMenu, onLogout }: AdminAppProps) {
  return (
    <div>
      <AdminHeader
        user={user}
        isMenuOpen={isMenuOpen}
        onToggleMenu={onToggleMenu}
        onLogout={onLogout}
      />
      <MobileMenu
        open={isMenuOpen}
        user={user}
        onClose={() => onToggleMenu?.()}
        onLogout={onLogout}
      />
    </div>
  );
}
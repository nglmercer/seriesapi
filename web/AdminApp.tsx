import { h } from 'preact';
import { useState } from 'preact/hooks';
import i18next from "./utils/i18n";
import { useAuth } from "./contexts/auth-context";
import { AdminHeader } from "./components/layout/admin-header";
import { MobileMenu } from "./components/layout/mobile-menu";
import { AdminView } from "./components/admin/admin-view";

export function AdminApp() {
  const { user, login, logout, isLoading: authLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const doLogin = async () => {
    if (!loginUsername || !loginPassword || loginLoading) return;
    setLoginLoading(true);
    setLoginError("");

    const res = await login(loginUsername, loginPassword);
    if (res.ok) {
      if (user?.role !== "admin") {
        // Wait for state to update if necessary, or check the response user
        // Actually, 'user' from useAuth might not be updated yet in this tick
        // But the login was successful.
      }
    } else {
      setLoginError(res.error || "Login failed");
    }
    setLoginLoading(false);
  };

  const doLogout = async () => {
    await logout();
    setLoginUsername("");
    setLoginPassword("");
    setLoginError("");
    setIsMenuOpen(false);
  };

  return (
    <div class="min-h-screen bg-primary text-primary transition-colors duration-300">
      {authLoading ? (
        <div class="flex items-center justify-center h-screen" key="loading">
          <div class="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : !user || user.role !== "admin" ? (
        <div class="flex flex-col min-h-screen" key="login">
          <AdminHeader
            user={user}
            isMenuOpen={isMenuOpen}
            onToggleMenu={toggleMenu}
            onLogout={doLogout}
          />

          <MobileMenu
            open={isMenuOpen}
            user={user}
            onClose={() => setIsMenuOpen(false)}
            onLogout={doLogout}
          />

          <div class="min-h-[80vh] flex items-center justify-center p-6">
            <div class="bg-secondary border border-border rounded-3xl p-10 w-full max-w-md shadow-2xl">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-red-600 flex items-center justify-center text-3xl mb-6 mx-auto shadow-lg">
                🔒
              </div>
              <h2 class="text-2xl font-extrabold text-center mb-1">{i18next.t("admin.access", "Admin Access")}</h2>
              <p class="text-sm text-text-secondary text-center mb-8">
                {i18next.t("admin.signin_prompt", "Sign in with an administrator account")}
              </p>

              {loginError && (
                <div class="bg-error/10 border border-error/30 text-error rounded-xl p-4 text-sm mb-6 flex items-center gap-2">
                  ⚠ {loginError}
                </div>
              )}

              <div class="mb-5 flex flex-col gap-1.5">
                <label class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  {i18next.t("auth.username_or_email", "Username or Email")}
                </label>
                <input
                  class="w-full px-4 py-3 bg-primary border border-border rounded-xl text-primary text-base focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                  type="text"
                  value={loginUsername}
                  placeholder="admin"
                  autoComplete="username"
                  onInput={(e) => setLoginUsername((e.target as HTMLInputElement).value)}
                  onKeyDown={(e) => { if (e.key === "Enter") doLogin(); }}
                />
              </div>

              <div class="mb-8 flex flex-col gap-1.5">
                <label class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  {i18next.t("auth.password", "Password")}
                </label>
                <input
                  class="w-full px-4 py-3 bg-primary border border-border rounded-xl text-primary text-base focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                  type="password"
                  value={loginPassword}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  onInput={(e) => setLoginPassword((e.target as HTMLInputElement).value)}
                  onKeyDown={(e) => { if (e.key === "Enter") doLogin(); }}
                />
              </div>

              <button
                class="w-full py-4 bg-gradient-to-br from-accent to-red-600 text-white font-bold text-base rounded-xl hover:shadow-xl transition-all shadow-md disabled:opacity-60"
                onClick={doLogin}
                disabled={loginLoading}
              >
                {loginLoading ? i18next.t("auth.signing_in", "Signing in…") : i18next.t("auth.sign_in", "Sign In")}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div class="flex flex-col min-h-screen" key="main">
          <AdminHeader
            user={user}
            isMenuOpen={isMenuOpen}
            onToggleMenu={toggleMenu}
            onLogout={doLogout}
          />

          <MobileMenu
            open={isMenuOpen}
            user={user}
            onClose={() => setIsMenuOpen(false)}
            onLogout={doLogout}
          />

          <main class="flex-1 pt-5">
            <AdminView />
          </main>
        </div>
      )}
    </div>
  );
}
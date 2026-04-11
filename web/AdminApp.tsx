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
    <div class="min-h-screen bg-base-100 text-base-content transition-colors duration-300">
      {authLoading ? (
        <div class="flex items-center justify-center h-screen" key="loading">
          <span class="loading loading-spinner loading-lg text-primary"></span>
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

          <div class="min-h-[80vh] flex items-center justify-center p-6 bg-base-200/50">
            <div class="card bg-base-100 border border-base-content/10 shadow-2xl w-full max-w-md overflow-hidden">
              <div class="card-body p-10">
                <div class="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-4xl mb-8 mx-auto shadow-inner border border-primary/20">
                  <span class="drop-shadow-sm">🔒</span>
                </div>
                <h2 class="card-title text-3xl font-black justify-center mb-2 tracking-tight">{i18next.t("admin.access", "Admin Access")}</h2>
                <p class="text-sm text-base-content/60 text-center mb-10 font-medium">
                  {i18next.t("admin.signin_prompt", "Sign in with an administrator account")}
                </p>

                {loginError && (
                  <div class="alert alert-error text-sm mb-8 rounded-xl py-3 border-none bg-error/10 text-error font-bold flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {loginError}
                  </div>
                )}

                <div class="form-control w-full mb-6">
                  <label class="label pt-0">
                    <span class="label-text text-[10px] font-black uppercase tracking-widest opacity-50">{i18next.t("auth.username_or_email", "Username or Email")}</span>
                  </label>
                  <input
                    class="input input-bordered w-full h-12 bg-base-200 border-base-content/5 focus:border-primary focus:outline-none transition-all rounded-xl font-medium"
                    type="text"
                    value={loginUsername}
                    placeholder="admin"
                    autoComplete="username"
                    onInput={(e) => setLoginUsername((e.target as HTMLInputElement).value)}
                    onKeyDown={(e) => { if (e.key === "Enter") doLogin(); }}
                  />
                </div>

                <div class="form-control w-full mb-10">
                  <label class="label pt-0">
                    <span class="label-text text-[10px] font-black uppercase tracking-widest opacity-50">{i18next.t("auth.password", "Password")}</span>
                  </label>
                  <input
                    class="input input-bordered w-full h-12 bg-base-200 border-base-content/5 focus:border-primary focus:outline-none transition-all rounded-xl font-medium"
                    type="password"
                    value={loginPassword}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    onInput={(e) => setLoginPassword((e.target as HTMLInputElement).value)}
                    onKeyDown={(e) => { if (e.key === "Enter") doLogin(); }}
                  />
                </div>

                <div class="card-actions">
                  <button
                    class="btn btn-primary btn-block h-14 rounded-xl text-lg font-black shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all border-none disabled:opacity-50"
                    onClick={doLogin}
                    disabled={loginLoading}
                  >
                    {loginLoading ? (
                      <span class="loading loading-spinner"></span>
                    ) : i18next.t("auth.sign_in", "Sign In")}
                  </button>
                </div>
              </div>
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

          <main class="flex-1 bg-base-200/30">
            <AdminView />
          </main>
        </div>
      )}
    </div>
  );
}
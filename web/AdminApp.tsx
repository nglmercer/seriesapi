import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import i18next from "./utils/i18n";
import { authStore } from "./services/auth-store";
import { AdminHeader } from "./components/layout/admin-header";
import { MobileMenu } from "./components/layout/mobile-menu";
import { AdminView } from "./components/admin/admin-view";

export function AdminApp() {
  const [user, setUser] = useState<any>(authStore.user);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const unsub = authStore.subscribe(u => {
      setUser(u);
    });

    const initAuth = async () => {
      await authStore.init();
      setUser(authStore.user);
    };
    initAuth();

    return () => unsub();
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const doLogin = async () => {
    if (!loginUsername || !loginPassword || loginLoading) return;
    setLoginLoading(true);
    setLoginError("");

    const res = await authStore.login(loginUsername, loginPassword);
    if (res.ok) {
      if (authStore.user?.role !== "admin") {
        await authStore.logout();
        setLoginError("Admin access required.");
      }
      setUser(authStore.user);
    } else {
      setLoginError(res.error || "Login failed");
    }
    setLoginLoading(false);
  };

  const doLogout = async () => {
    await authStore.logout();
    setUser(null);
    setLoginUsername("");
    setLoginPassword("");
    setLoginError("");
    setIsMenuOpen(false);
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="admin-root">
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

        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg,var(--accent-color),#c0392b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', margin: '0 auto 20px' }}>
              🔒
            </div>
            <h2 style={{ margin: '0 0 4px', textAlign: 'center', fontSize: '20px', fontWeight: '800' }}>Admin Access</h2>
            <p style={{ margin: '0 0 28px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
              Sign in with an administrator account
            </p>

            {loginError && (
              <div style={{ background: 'rgba(231,76,60,.1)', border: '1px solid rgba(231,76,60,.3)', color: '#e74c3c', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginBottom: '16px' }}>
                ⚠ {loginError}
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Username or Email
              </label>
              <input
                type="text"
                value={loginUsername}
                placeholder="admin"
                autoComplete="username"
                style={{ width: '100%', boxSizing: 'border-box', padding: '11px 13px', background: 'var(--bg-primary)', border: '1.5px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '15px', fontFamily: 'inherit' }}
                onInput={(e) => setLoginUsername((e.target as HTMLInputElement).value)}
                onKeyDown={(e) => { if (e.key === "Enter") doLogin(); }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Password
              </label>
              <input
                type="password"
                value={loginPassword}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ width: '100%', boxSizing: 'border-box', padding: '11px 13px', background: 'var(--bg-primary)', border: '1.5px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '15px', fontFamily: 'inherit' }}
                onInput={(e) => setLoginPassword((e.target as HTMLInputElement).value)}
                onKeyDown={(e) => { if (e.key === "Enter") doLogin(); }}
              />
            </div>

            <button
              onClick={doLogin}
              disabled={loginLoading}
              style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg,var(--accent-color),#c0392b)', color: '#fff', fontWeight: '700', fontSize: '15px', border: 'none', borderRadius: '10px', cursor: 'pointer', opacity: loginLoading ? '.6' : '1' }}
            >
              {loginLoading ? "Signing in…" : "Sign In"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-root">
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

      <main style={{ paddingTop: '20px' }}>
        <AdminView />
      </main>
    </div>
  );
}
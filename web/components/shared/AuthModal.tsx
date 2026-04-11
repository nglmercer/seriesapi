import { h, Fragment } from 'preact';
import { useState } from 'preact/hooks';
import { useAuth } from "../../contexts/auth-context";
import i18next from "../../utils/i18n";
import { Modal } from "./Modal";

type AuthMode = "login" | "register";

interface AuthModalProps {
  onAuthClose: () => void;
}

export function AuthModal({ onAuthClose }: AuthModalProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const closeModal = () => {
    onAuthClose();
  };

  const switchMode = (m: AuthMode) => {
    setMode(m);
    setErrorMsg("");
  };

  const submitLogin = async (e: Event) => {
    e.preventDefault();
    if (!username || !password) { setErrorMsg("Please fill in all fields."); return; }
    setLoading(true); setErrorMsg("");
    const res = await login(username, password);
    if (res.ok) {
      closeModal();
    } else {
      setErrorMsg(res.error || "Login failed");
    }
    setLoading(false);
  };

  const submitRegister = async (e: Event) => {
    e.preventDefault();
    if (!username || !email || !password) { setErrorMsg("Please fill in all fields."); return; }
    if (password.length < 6) { setErrorMsg("Password must be at least 6 characters."); return; }
    setLoading(true); setErrorMsg("");
    const res = await register(username, email, password, displayName);
    if (res.ok) {
      closeModal();
    } else {
      setErrorMsg(res.error || "Registration failed");
    }
    setLoading(false);
  };

  return (
    <Modal onClose={closeModal}>
      <div class="p-8 flex flex-col items-center max-w-md mx-auto">
        <div class="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-6">
          <div class="text-3xl">&#x1F3AC;</div>
        </div>

        <div class="flex w-full mb-8 bg-secondary p-1 rounded-xl">
          <div class={`flex-1 py-2 text-center text-sm font-bold cursor-pointer rounded-lg transition-all ${mode === 'login' ? "bg-primary text-accent shadow-sm" : "text-text-secondary hover:text-primary"}`} onClick={() => switchMode('login')}>
            {i18next.t("auth.login", "Login")}
          </div>
          <div class={`flex-1 py-2 text-center text-sm font-bold cursor-pointer rounded-lg transition-all ${mode === 'register' ? "bg-primary text-accent shadow-sm" : "text-text-secondary hover:text-primary"}`} onClick={() => switchMode('register')}>
            {i18next.t("auth.register", "Register")}
          </div>
        </div>

        {mode === 'login' ? (
          <div class="w-full" key="login-header">
            <h2 class="text-2xl font-bold text-primary mb-2 text-center">{i18next.t("auth.welcome_back", "Welcome back")}</h2>
            <p class="text-sm text-text-secondary mb-8 text-center">{i18next.t("auth.login_subtitle", "Enter your credentials to continue")}</p>
          </div>
        ) : (
          <div class="w-full" key="register-header">
            <h2 class="text-2xl font-bold text-primary mb-2 text-center">{i18next.t("auth.join_community", "Join the community")}</h2>
            <p class="text-sm text-text-secondary mb-8 text-center">{i18next.t("auth.register_subtitle", "Create an account to rate and comment")}</p>
          </div>
        )}

        {errorMsg && <div class="w-full p-4 bg-error/10 border border-error/20 text-error text-sm rounded-lg mb-6 flex items-center gap-2">&#x26A0; {errorMsg}</div>}

        {mode === 'login' ? (
          <form class="w-full" onSubmit={submitLogin}>
            <div class="w-full mb-5 flex flex-col gap-1.5">
              <label class="text-xs font-bold text-text-secondary uppercase tracking-wider">{i18next.t("auth.username_or_email", "Username or Email")}</label>
              <input type="text" value={username} onInput={(e: any) => setUsername(e.target.value)}
                class="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" placeholder="johndoe" autoComplete="username" disabled={loading} />
            </div>
            <div class="w-full mb-5 flex flex-col gap-1.5">
              <label class="text-xs font-bold text-text-secondary uppercase tracking-wider">{i18next.t("auth.password", "Password")}</label>
              <input type="password" value={password} onInput={(e: any) => setPassword(e.target.value)}
                class="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" placeholder="&#xB7;&#xB7;&#xB7;&#xB7;&#xB7;&#xB7;&#xB7;&#xB7;" autoComplete="current-password" disabled={loading} />
            </div>
            <button class="w-full py-3 bg-accent text-white font-bold rounded-xl hover:bg-accent-hover transition-all shadow-md mt-2 disabled:opacity-50 disabled:cursor-not-allowed" type="submit" disabled={loading}>
              {loading ? i18next.t("auth.signing_in", "Signing in...") : i18next.t("auth.login", "Login")}
            </button>
          </form>
        ) : (
          <form class="w-full" onSubmit={submitRegister}>
            <div class="w-full mb-5 flex flex-col gap-1.5">
              <label class="text-xs font-bold text-text-secondary uppercase tracking-wider">{i18next.t("auth.display_name", "Display Name")}</label>
              <input type="text" value={displayName} onInput={(e: any) => setDisplayName(e.target.value)}
                class="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" placeholder="John Doe" autoComplete="name" disabled={loading} />
            </div>
            <div class="w-full mb-5 flex flex-col gap-1.5">
              <label class="text-xs font-bold text-text-secondary uppercase tracking-wider">{i18next.t("auth.username", "Username")}</label>
              <input type="text" value={username} onInput={(e: any) => setUsername(e.target.value)}
                class="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" placeholder="johndoe" autoComplete="username" disabled={loading} />
            </div>
            <div class="w-full mb-5 flex flex-col gap-1.5">
              <label class="text-xs font-bold text-text-secondary uppercase tracking-wider">{i18next.t("auth.email", "Email")}</label>
              <input type="email" value={email} onInput={(e: any) => setEmail(e.target.value)}
                class="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" placeholder="john@example.com" autoComplete="email" disabled={loading} />
            </div>
            <div class="w-full mb-5 flex flex-col gap-1.5">
              <label class="text-xs font-bold text-text-secondary uppercase tracking-wider">{i18next.t("auth.password", "Password")}</label>
              <input type="password" value={password} onInput={(e: any) => setPassword(e.target.value)}
                class="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" placeholder="&#xB7;&#xB7;&#xB7;&#xB7;&#xB7;&#xB7;&#xB7;&#xB7;" autoComplete="new-password" disabled={loading} />
            </div>
            <button class="w-full py-3 bg-accent text-white font-bold rounded-xl hover:bg-accent-hover transition-all shadow-md mt-2 disabled:opacity-50 disabled:cursor-not-allowed" type="submit" disabled={loading}>
              {loading ? i18next.t("auth.creating", "Creating account...") : i18next.t("auth.create_account", "Create Account")}
            </button>
          </form>
        )}

        <p class="mt-8 text-[11px] text-text-secondary text-center leading-relaxed">{i18next.t("auth.privacy_note", "By continuing, you agree to our community guidelines.")}</p>
      </div>
    </Modal>
  );
}

import { h, Fragment } from 'preact';
import { useState } from 'preact/hooks';
import { useAuth } from "../../contexts/auth-context";
import i18next from "../../utils/i18n";
import { Modal } from "./Modal";
import styles from './AuthModal.module.css';

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
      <div class={styles.authModalContent}>
        <div class={styles.logo}>
          <div class={styles.logoIcon}>&#x1F3AC;</div>
        </div>

        <div class={styles.tabs}>
          <div class={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`} onClick={() => switchMode('login')}>
            {i18next.t("auth.login", "Login")}
          </div>
          <div class={`${styles.tab} ${mode === 'register' ? styles.tabActive : ''}`} onClick={() => switchMode('register')}>
            {i18next.t("auth.register", "Register")}
          </div>
        </div>

        {mode === 'login' ? (
          <div key="login-header">
            <h2 class={styles.title}>{i18next.t("auth.welcome_back", "Welcome back")}</h2>
            <p class={styles.subtitle}>{i18next.t("auth.login_subtitle", "Enter your credentials to continue")}</p>
          </div>
        ) : (
          <div key="register-header">
            <h2 class={styles.title}>{i18next.t("auth.join_community", "Join the community")}</h2>
            <p class={styles.subtitle}>{i18next.t("auth.register_subtitle", "Create an account to rate and comment")}</p>
          </div>
        )}

        {errorMsg && <div class={styles.errorMsg}>&#x26A0; {errorMsg}</div>}

        {mode === 'login' ? (
          <form onSubmit={submitLogin}>
            <div class={styles.field}>
              <label class={styles.label}>{i18next.t("auth.username_or_email", "Username or Email")}</label>
              <input type="text" value={username} onInput={(e: any) => setUsername(e.target.value)}
                class={styles.input} placeholder="johndoe" autoComplete="username" disabled={loading} />
            </div>
            <div class={styles.field}>
              <label class={styles.label}>{i18next.t("auth.password", "Password")}</label>
              <input type="password" value={password} onInput={(e: any) => setPassword(e.target.value)}
                class={styles.input} placeholder="&#xB7;&#xB7;&#xB7;&#xB7;&#xB7;&#xB7;&#xB7;&#xB7;" autoComplete="current-password" disabled={loading} />
            </div>
            <button class={styles.btnSubmit} type="submit" disabled={loading}>
              {loading ? i18next.t("auth.signing_in", "Signing in...") : i18next.t("auth.login", "Login")}
            </button>
          </form>
        ) : (
          <form onSubmit={submitRegister}>
            <div class={styles.field}>
              <label class={styles.label}>{i18next.t("auth.display_name", "Display Name")}</label>
              <input type="text" value={displayName} onInput={(e: any) => setDisplayName(e.target.value)}
                class={styles.input} placeholder="John Doe" autoComplete="name" disabled={loading} />
            </div>
            <div class={styles.field}>
              <label class={styles.label}>{i18next.t("auth.username", "Username")}</label>
              <input type="text" value={username} onInput={(e: any) => setUsername(e.target.value)}
                class={styles.input} placeholder="johndoe" autoComplete="username" disabled={loading} />
            </div>
            <div class={styles.field}>
              <label class={styles.label}>{i18next.t("auth.email", "Email")}</label>
              <input type="email" value={email} onInput={(e: any) => setEmail(e.target.value)}
                class={styles.input} placeholder="john@example.com" autoComplete="email" disabled={loading} />
            </div>
            <div class={styles.field}>
              <label class={styles.label}>{i18next.t("auth.password", "Password")}</label>
              <input type="password" value={password} onInput={(e: any) => setPassword(e.target.value)}
                class={styles.input} placeholder="&#xB7;&#xB7;&#xB7;&#xB7;&#xB7;&#xB7;&#xB7;&#xB7;" autoComplete="new-password" disabled={loading} />
            </div>
            <button class={styles.btnSubmit} type="submit" disabled={loading}>
              {loading ? i18next.t("auth.creating", "Creating account...") : i18next.t("auth.create_account", "Create Account")}
            </button>
          </form>
        )}

        <p class={styles.privacy}>{i18next.t("auth.privacy_note", "By continuing, you agree to our community guidelines.")}</p>
      </div>
    </Modal>
  );
}

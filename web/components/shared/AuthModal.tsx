import { h, Fragment } from 'preact';
import { useState } from 'preact/hooks';
import { authStore } from "../../services/auth-store";
import i18next from "../../utils/i18n";

type AuthMode = "login" | "register";

interface AuthModalProps {
  onAuthClose: () => void;
}

export function AuthModal({ onAuthClose }: AuthModalProps) {
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
    const res = await authStore.login(username, password);
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
    const res = await authStore.register(username, email, password, displayName);
    if (res.ok) {
      closeModal();
    } else {
      setErrorMsg(res.error || "Registration failed");
    }
    setLoading(false);
  };

  return (
    <div className="auth-modal-wrapper">
      <style>{`
        .auth-modal-wrapper .overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.7);
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(4px);
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { transform: translateY(24px); opacity:0 } to { transform: translateY(0); opacity:1 } }

        .auth-modal-wrapper .modal {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          width: 100%;
          max-width: 420px;
          padding: 36px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.6);
          animation: slideUp 0.25s ease;
          position: relative;
        }

        .auth-modal-wrapper .close {
          position: absolute; top: 16px; right: 16px;
          background: var(--bg-secondary); border: 1px solid var(--border-color);
          color: var(--text-secondary); border-radius: 50%;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 18px; line-height: 1;
          transition: background 0.2s;
        }
        .auth-modal-wrapper .close:hover { background: var(--border-color); color: var(--text-primary); }

        .auth-modal-wrapper .logo { text-align: center; margin-bottom: 28px; }
        .auth-modal-wrapper .logo-icon {
          width: 52px; height: 52px; border-radius: 14px;
          background: linear-gradient(135deg, var(--accent-color, #3366cc), #c0392b);
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 24px; margin-bottom: 12px;
        }
        .auth-modal-wrapper h2 { margin: 0 0 4px; font-size: 22px; font-weight: 800; text-align: center; color: var(--text-primary); }
        .auth-modal-wrapper .subtitle { text-align: center; color: var(--text-secondary); font-size: 14px; margin-bottom: 28px; }

        .auth-modal-wrapper .tabs {
          display: flex; border-radius: 10px;
          background: var(--bg-secondary); padding: 4px;
          margin-bottom: 24px; gap: 4px;
        }
        .auth-modal-wrapper .tab {
          flex: 1; text-align: center; padding: 9px;
          border-radius: 7px; cursor: pointer;
          font-size: 14px; font-weight: 600;
          color: var(--text-secondary);
          transition: all 0.2s;
        }
        .auth-modal-wrapper .tab.active {
          background: var(--bg-primary);
          color: var(--text-primary);
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        .auth-modal-wrapper .field { margin-bottom: 16px; }
        .auth-modal-wrapper label { display: block; font-size: 12px; font-weight: 700; letter-spacing: 0.05em; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 6px; }
        .auth-modal-wrapper input {
          width: 100%; box-sizing: border-box;
          padding: 12px 14px;
          background: var(--bg-secondary); border: 1.5px solid var(--border-color);
          border-radius: 10px; color: var(--text-primary);
          font-size: 15px; font-family: inherit;
          transition: border-color 0.2s;
        }
        .auth-modal-wrapper input:focus { outline: none; border-color: var(--accent-color, #3366cc); }

        .auth-modal-wrapper .error-msg {
          background: rgba(231,76,60,0.1); border: 1px solid rgba(231,76,60,0.3);
          color: #e74c3c; border-radius: 8px; padding: 10px 14px;
          font-size: 13px; margin-bottom: 16px;
        }

        .auth-modal-wrapper .btn-submit {
          width: 100%; padding: 14px;
          background: linear-gradient(135deg, var(--accent-color, #3366cc), #c0392b);
          color: white; font-weight: 700; font-size: 15px;
          border: none; border-radius: 10px; cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
          margin-top: 4px;
        }
        .auth-modal-wrapper .btn-submit:hover { opacity: 0.9; transform: translateY(-1px); }
        .auth-modal-wrapper .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .auth-modal-wrapper .privacy { font-size: 12px; color: var(--text-secondary); text-align: center; margin-top: 16px; line-height: 1.5; }
      `}</style>
      <div className="overlay" onClick={(e: any) => { if (e.target === e.currentTarget) closeModal(); }}>
        <div className="modal">
          <button className="close" onClick={closeModal}>&#x2715;</button>

          <div className="logo">
            <div className="logo-icon">&#x1F3AC;</div>
          </div>

          <div className="tabs">
            <div className={`tab ${mode === 'login' ? 'active' : ''}`} onClick={() => switchMode('login')}>
              {i18next.t("auth.login", "Login")}
            </div>
            <div className={`tab ${mode === 'register' ? 'active' : ''}`} onClick={() => switchMode('register')}>
              {i18next.t("auth.register", "Register")}
            </div>
          </div>

          {mode === 'login' ? (
            <Fragment>
              <h2>{i18next.t("auth.welcome_back", "Welcome back")}</h2>
              <p className="subtitle">{i18next.t("auth.login_subtitle", "Enter your credentials to continue")}</p>
            </Fragment>
          ) : (
            <Fragment>
              <h2>{i18next.t("auth.join_community", "Join the community")}</h2>
              <p className="subtitle">{i18next.t("auth.register_subtitle", "Create an account to rate and comment")}</p>
            </Fragment>
          )}

          {errorMsg && <div className="error-msg">&#x26A0; {errorMsg}</div>}

          {mode === 'login' ? (
            <form onSubmit={submitLogin}>
              <div className="field">
                <label>{i18next.t("auth.username_or_email", "Username or Email")}</label>
                <input type="text" value={username} onInput={(e: any) => setUsername(e.target.value)}
                  placeholder="johndoe" autoComplete="username" disabled={loading} />
              </div>
              <div className="field">
                <label>{i18next.t("auth.password", "Password")}</label>
                <input type="password" value={password} onInput={(e: any) => setPassword(e.target.value)}
                  placeholder="&#xB7;&#xB7;&#xB7;&#xB7;&#xB7;&#xB7;&#xB7;&#xB7;" autoComplete="current-password" disabled={loading} />
              </div>
              <button className="btn-submit" type="submit" disabled={loading}>
                {loading ? i18next.t("auth.signing_in", "Signing in...") : i18next.t("auth.login", "Login")}
              </button>
            </form>
          ) : (
            <form onSubmit={submitRegister}>
              <div className="field">
                <label>{i18next.t("auth.display_name", "Display Name")}</label>
                <input type="text" value={displayName} onInput={(e: any) => setDisplayName(e.target.value)}
                  placeholder="John Doe" autoComplete="name" disabled={loading} />
              </div>
              <div className="field">
                <label>{i18next.t("auth.username", "Username")}</label>
                <input type="text" value={username} onInput={(e: any) => setUsername(e.target.value)}
                  placeholder="johndoe" autoComplete="username" disabled={loading} />
              </div>
              <div className="field">
                <label>{i18next.t("auth.email", "Email")}</label>
                <input type="email" value={email} onInput={(e: any) => setEmail(e.target.value)}
                  placeholder="john@example.com" autoComplete="email" disabled={loading} />
              </div>
              <div className="field">
                <label>{i18next.t("auth.password", "Password")}</label>
                <input type="password" value={password} onInput={(e: any) => setPassword(e.target.value)}
                  placeholder="&#xB7;&#xB7;&#xB7;&#xB7;&#xB7;&#xB7;&#xB7;&#xB7;" autoComplete="new-password" disabled={loading} />
              </div>
              <button className="btn-submit" type="submit" disabled={loading}>
                {loading ? i18next.t("auth.creating", "Creating account...") : i18next.t("auth.create_account", "Create Account")}
              </button>
            </form>
          )}

          <p className="privacy">{i18next.t("auth.privacy_note", "By continuing, you agree to our community guidelines.")}</p>
        </div>
      </div>
    </div>
  );
}

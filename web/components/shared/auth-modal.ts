import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { authStore } from "../../services/auth-store";
import i18next from "../../utils/i18n";

type AuthMode = "login" | "register";

@customElement("auth-modal")
export class AuthModal extends LitElement {
  static override styles = css`
    :host { display: contents; }

    .overlay {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(0,0,0,0.7);
      display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(4px);
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
    @keyframes slideUp { from { transform: translateY(24px); opacity:0 } to { transform: translateY(0); opacity:1 } }

    .modal {
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

    .close {
      position: absolute; top: 16px; right: 16px;
      background: var(--bg-secondary); border: 1px solid var(--border-color);
      color: var(--text-secondary); border-radius: 50%;
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; font-size: 18px; line-height: 1;
      transition: background 0.2s;
    }
    .close:hover { background: var(--border-color); color: var(--text-primary); }

    .logo { text-align: center; margin-bottom: 28px; }
    .logo-icon {
      width: 52px; height: 52px; border-radius: 14px;
      background: linear-gradient(135deg, var(--accent), #c0392b);
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 24px; margin-bottom: 12px;
    }
    h2 { margin: 0 0 4px; font-size: 22px; font-weight: 800; text-align: center; }
    .subtitle { text-align: center; color: var(--text-secondary); font-size: 14px; margin-bottom: 28px; }

    .tabs {
      display: flex; border-radius: 10px;
      background: var(--bg-secondary); padding: 4px;
      margin-bottom: 24px; gap: 4px;
    }
    .tab {
      flex: 1; text-align: center; padding: 9px;
      border-radius: 7px; cursor: pointer;
      font-size: 14px; font-weight: 600;
      color: var(--text-secondary);
      transition: all 0.2s;
    }
    .tab.active {
      background: var(--bg-primary);
      color: var(--text-primary);
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .field { margin-bottom: 16px; }
    label { display: block; font-size: 12px; font-weight: 700; letter-spacing: 0.05em; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 6px; }
    input {
      width: 100%; box-sizing: border-box;
      padding: 12px 14px;
      background: var(--bg-secondary); border: 1.5px solid var(--border-color);
      border-radius: 10px; color: var(--text-primary);
      font-size: 15px; font-family: inherit;
      transition: border-color 0.2s;
    }
    input:focus { outline: none; border-color: var(--accent); }

    .error-msg {
      background: rgba(231,76,60,0.1); border: 1px solid rgba(231,76,60,0.3);
      color: #e74c3c; border-radius: 8px; padding: 10px 14px;
      font-size: 13px; margin-bottom: 16px;
    }

    .btn-submit {
      width: 100%; padding: 14px;
      background: linear-gradient(135deg, var(--accent), #c0392b);
      color: white; font-weight: 700; font-size: 15px;
      border: none; border-radius: 10px; cursor: pointer;
      transition: opacity 0.2s, transform 0.1s;
      margin-top: 4px;
    }
    .btn-submit:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    .privacy { font-size: 12px; color: var(--text-secondary); text-align: center; margin-top: 16px; line-height: 1.5; }
  `;

  @state() mode: AuthMode = "login";
  @state() loading = false;
  @state() errorMsg = "";
  @state() username = "";
  @state() email = "";
  @state() password = "";
  @state() displayName = "";

  private closeModal() {
    this.dispatchEvent(new CustomEvent("auth-close", { bubbles: true, composed: true }));
  }

  private switchMode(m: AuthMode) {
    this.mode = m;
    this.errorMsg = "";
  }

  private async submitLogin(e: Event) {
    e.preventDefault();
    if (!this.username || !this.password) { this.errorMsg = "Please fill in all fields."; return; }
    this.loading = true; this.errorMsg = "";
    const res = await authStore.login(this.username, this.password);
    if (res.ok) {
      this.closeModal();
    } else {
      this.errorMsg = res.error || "Login failed";
    }
    this.loading = false;
  }

  private async submitRegister(e: Event) {
    e.preventDefault();
    if (!this.username || !this.email || !this.password) { this.errorMsg = "Please fill in all fields."; return; }
    if (this.password.length < 6) { this.errorMsg = "Password must be at least 6 characters."; return; }
    this.loading = true; this.errorMsg = "";
    const res = await authStore.register(this.username, this.email, this.password, this.displayName);
    if (res.ok) {
      this.closeModal();
    } else {
      this.errorMsg = res.error || "Registration failed";
    }
    this.loading = false;
  }

  override render() {
    return html`
      <div class="overlay" @click=${(e: Event) => { if (e.target === e.currentTarget) this.closeModal(); }}>
        <div class="modal">
          <button class="close" @click=${this.closeModal}>&#x2715;</button>

          <div class="logo">
            <div class="logo-icon">&#x1F3AC;</div>
          </div>

          <div class="tabs">
            <div class="tab ${this.mode === 'login' ? 'active' : ''}" @click=${() => this.switchMode('login')}>
              ${i18next.t("auth.login", { defaultValue: "Login" })}
            </div>
            <div class="tab ${this.mode === 'register' ? 'active' : ''}" @click=${() => this.switchMode('register')}>
              ${i18next.t("auth.register", { defaultValue: "Register" })}
            </div>
          </div>

          ${this.mode === 'login' ? html`
            <h2>${i18next.t("auth.welcome_back", { defaultValue: "Welcome back" })}</h2>
            <p class="subtitle">${i18next.t("auth.login_subtitle", { defaultValue: "Enter your credentials to continue" })}</p>
          ` : html`
            <h2>${i18next.t("auth.join_community", { defaultValue: "Join the community" })}</h2>
            <p class="subtitle">${i18next.t("auth.register_subtitle", { defaultValue: "Create an account to rate and comment" })}</p>
          `}

          ${this.errorMsg ? html`<div class="error-msg">&#x26A0; ${this.errorMsg}</div>` : ''}

          ${this.mode === 'login' ? html`
            <form @submit=${this.submitLogin}>
              <div class="field">
                <label>${i18next.t("auth.username_or_email", { defaultValue: "Username or Email" })}</label>
                <input type="text" .value=${this.username} @input=${(e: any) => this.username = e.target.value}
                  placeholder="johndoe" autocomplete="username" ?disabled=${this.loading} />
              </div>
              <div class="field">
                <label>${i18next.t("auth.password", { defaultValue: "Password" })}</label>
                <input type="password" .value=${this.password} @input=${(e: any) => this.password = e.target.value}
                  placeholder="&#xB7;&#xB7;&#xB7;&#xB7;&#xB7;&#xB7;&#xB7;&#xB7;" autocomplete="current-password" ?disabled=${this.loading} />
              </div>
              <button class="btn-submit" type="submit" ?disabled=${this.loading}>
                ${this.loading ? i18next.t("auth.signing_in", { defaultValue: "Signing in..." }) : i18next.t("auth.login", { defaultValue: "Login" })}
              </button>
            </form>
          ` : html`
            <form @submit=${this.submitRegister}>
              <div class="field">
                <label>${i18next.t("auth.display_name", { defaultValue: "Display Name" })}</label>
                <input type="text" .value=${this.displayName} @input=${(e: any) => this.displayName = e.target.value}
                  placeholder="John Doe" autocomplete="name" ?disabled=${this.loading} />
              </div>
              <div class="field">
                <label>${i18next.t("auth.username", { defaultValue: "Username" })}</label>
                <input type="text" .value=${this.username} @input=${(e: any) => this.username = e.target.value}
                  placeholder="johndoe" autocomplete="username" ?disabled=${this.loading} />
              </div>
              <div class="field">
                <label>${i18next.t("auth.email", { defaultValue: "Email" })}</label>
                <input type="email" .value=${this.email} @input=${(e: any) => this.email = e.target.value}
                  placeholder="john@example.com" autocomplete="email" ?disabled=${this.loading} />
              </div>
              <div class="field">
                <label>${i18next.t("auth.password", { defaultValue: "Password" })}</label>
                <input type="password" .value=${this.password} @input=${(e: any) => this.password = e.target.value}
                  placeholder="&#xB7;&#xB7;&#xB7;&#xB7;&#xB7;&#xB7;&#xB7;&#xB7;" autocomplete="new-password" ?disabled=${this.loading} />
              </div>
              <button class="btn-submit" type="submit" ?disabled=${this.loading}>
                ${this.loading ? i18next.t("auth.creating", { defaultValue: "Creating account..." }) : i18next.t("auth.create_account", { defaultValue: "Create Account" })}
              </button>
            </form>
          `}

          <p class="privacy">${i18next.t("auth.privacy_note", { defaultValue: "By continuing, you agree to our community guidelines." })}</p>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { "auth-modal": AuthModal; }
}
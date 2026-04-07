import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { authStore, type AuthUser } from "../../services/auth-store";
import i18next from "../../utils/i18n";
import { initials, avatarColor } from "../shared/comment-avatar";

@customElement("user-profile")
export class UserProfile extends LitElement {
  static override styles = css`
    :host { display: block; }

    .profile-container {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 32px;
      max-width: 600px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--border-color);
    }

    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      font-weight: 800;
      color: #fff;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .user-info h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
    }

    .user-info p {
      margin: 4px 0 0;
      color: var(--text-secondary);
      font-size: 14px;
    }

    .role-badge {
      display: inline-block;
      padding: 4px 12px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      margin-top: 8px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    @media (max-width: 600px) {
      .form-grid { grid-template-columns: 1fr; }
    }

    .field { margin-bottom: 20px; }
    label { 
      display: block; 
      font-size: 12px; 
      font-weight: 700; 
      color: var(--text-secondary); 
      text-transform: uppercase; 
      margin-bottom: 8px; 
    }
    
    input {
      width: 100%; box-sizing: border-box;
      padding: 12px 14px;
      background: var(--bg-secondary); border: 1.5px solid var(--border-color);
      border-radius: 10px; color: var(--text-primary);
      font-size: 15px; font-family: inherit;
      transition: border-color 0.2s;
    }
    input:focus { outline: none; border-color: var(--accent); }
    input:disabled { opacity: 0.6; cursor: not-allowed; }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 12px;
    }

    .btn {
      padding: 10px 24px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .btn-primary {
      background: var(--accent);
      color: white;
    }
    .btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-secondary {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
    }
    .btn-secondary:hover { background: var(--border-color); }

    .error-msg {
      background: rgba(231,76,60,0.1); border: 1px solid rgba(231,76,60,0.3);
      color: #e74c3c; border-radius: 8px; padding: 10px 14px;
      font-size: 13px; margin-bottom: 20px;
    }

    .success-msg {
      background: rgba(46,204,113,0.1); border: 1px solid rgba(46,204,113,0.3);
      color: #27ae60; border-radius: 8px; padding: 10px 14px;
      font-size: 13px; margin-bottom: 20px;
    }
  `;

  @state() private user: AuthUser | null = authStore.user;
  @state() private loading = false;
  @state() private errorMsg = "";
  @state() private successMsg = "";

  // Form states
  @state() private displayName = "";
  @state() private email = "";
  @state() private password = "";
  @state() private confirmPassword = "";

  private _unsub?: () => void;

  override connectedCallback() {
    super.connectedCallback();
    this.resetForm();
    this._unsub = authStore.subscribe(u => {
      this.user = u;
      if (u && !this.loading) this.resetForm();
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._unsub?.();
  }

  private resetForm() {
    if (!this.user) return;
    this.displayName = this.user.display_name;
    this.email = this.user.email;
    this.password = "";
    this.confirmPassword = "";
    this.errorMsg = "";
    this.successMsg = "";
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();
    this.errorMsg = "";
    this.successMsg = "";

    if (this.password && this.password !== this.confirmPassword) {
      this.errorMsg = i18next.t("auth.passwords_dont_match", { defaultValue: "Passwords do not match." });
      return;
    }

    this.loading = true;
    
    const updateData: any = {};
    if (this.displayName !== this.user?.display_name) updateData.display_name = this.displayName;
    if (this.email !== this.user?.email) updateData.email = this.email;
    if (this.password) updateData.password = this.password;

    if (Object.keys(updateData).length === 0) {
      this.loading = false;
      this.successMsg = i18next.t("profile.no_changes", { defaultValue: "No changes to save." });
      return;
    }

    const res = await authStore.updateProfile(updateData);
    if (res.ok) {
      this.successMsg = i18next.t("profile.update_success", { defaultValue: "Profile updated successfully!" });
      this.password = "";
      this.confirmPassword = "";
    } else {
      this.errorMsg = res.error || i18next.t("profile.update_failed", { defaultValue: "Failed to update profile." });
    }
    
    this.loading = false;
  }

  override render() {
    if (!this.user) {
      return html`
        <div class="profile-container">
          <p style="text-align: center; color: var(--text-secondary);">
            ${i18next.t("auth.login_required", { defaultValue: "Please sign in to view your profile." })}
          </p>
        </div>
      `;
    }

    const color = avatarColor(this.user.display_name);
    const init = initials(this.user.display_name);

    return html`
      <div class="profile-container">
        <div class="header">
          <div class="avatar" style="background: ${color}">${init}</div>
          <div class="user-info">
            <h2>${this.user.display_name}</h2>
            <p>@${this.user.username}</p>
            <div class="role-badge">${this.user.role}</div>
          </div>
        </div>

        <div class="section-title">
          ${i18next.t("profile.edit_settings", { defaultValue: "Account Settings" })}
        </div>

        ${this.errorMsg ? html`<div class="error-msg">⚠️ ${this.errorMsg}</div>` : ""}
        ${this.successMsg ? html`<div class="success-msg">✅ ${this.successMsg}</div>` : ""}

        <form @submit=${this.handleSubmit}>
          <div class="form-grid">
            <div class="field">
              <label>${i18next.t("auth.display_name", { defaultValue: "Display Name" })}</label>
              <input type="text" .value=${this.displayName} @input=${(e: any) => this.displayName = e.target.value} 
                ?disabled=${this.loading} />
            </div>
            <div class="field">
              <label>${i18next.t("auth.email", { defaultValue: "Email Address" })}</label>
              <input type="email" .value=${this.email} @input=${(e: any) => this.email = e.target.value} 
                ?disabled=${this.loading} />
            </div>
            <div class="field">
              <label>${i18next.t("auth.new_password", { defaultValue: "New Password (Optional)" })}</label>
              <input type="password" .value=${this.password} @input=${(e: any) => this.password = e.target.value} 
                placeholder="••••••••" ?disabled=${this.loading} />
            </div>
            <div class="field">
              <label>${i18next.t("auth.confirm_password", { defaultValue: "Confirm New Password" })}</label>
              <input type="password" .value=${this.confirmPassword} @input=${(e: any) => this.confirmPassword = e.target.value} 
                placeholder="••••••••" ?disabled=${this.loading} />
            </div>
          </div>

          <div class="actions">
            <button type="button" class="btn btn-secondary" @click=${this.resetForm} ?disabled=${this.loading}>
              ${i18next.t("common.cancel", { defaultValue: "Cancel" })}
            </button>
            <button type="submit" class="btn btn-primary" ?disabled=${this.loading}>
              ${this.loading ? i18next.t("common.saving", { defaultValue: "Saving..." }) : i18next.t("common.save_changes", { defaultValue: "Save Changes" })}
            </button>
          </div>
        </form>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { "user-profile": UserProfile; }
}

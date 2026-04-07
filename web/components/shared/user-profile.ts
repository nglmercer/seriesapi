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

    .tabs {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 8px;
    }

    .tab {
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 700;
      color: var(--text-secondary);
      transition: all 0.2s;
    }

    .tab:hover { background: var(--bg-secondary); }
    .tab.active { background: var(--accent); color: white; }

    .user-list {
      margin-top: 20px;
    }

    .user-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      border-bottom: 1px solid var(--border-color);
      gap: 16px;
    }

    .user-item:last-child { border-bottom: none; }

    .user-item-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .user-item-name { font-weight: 700; font-size: 14px; }
    .user-item-email { font-size: 12px; color: var(--text-secondary); }

    .user-item-actions {
      display: flex;
      gap: 8px;
    }

    .badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      font-weight: 800;
    }

    .badge-admin { background: #e74c3c; color: white; }
    .badge-editor { background: #3498db; color: white; }
    .badge-user { background: var(--bg-secondary); color: var(--text-secondary); }
    .badge-inactive { opacity: 0.5; text-decoration: line-through; }

    .admin-edit-form {
      background: var(--bg-secondary);
      padding: 16px;
      border-radius: 12px;
      margin-top: 12px;
      border: 1px solid var(--border-color);
    }

    select {
      width: 100%; box-sizing: border-box;
      padding: 10px 12px;
      background: var(--bg-primary); border: 1.5px solid var(--border-color);
      border-radius: 8px; color: var(--text-primary);
      font-size: 14px; font-family: inherit;
      margin-bottom: 12px;
    }

    .challenge-section {
      margin-top: 40px;
      padding-top: 32px;
      border-top: 1px dashed var(--border-color);
    }

    .challenge-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      align-items: end;
    }

    @media (max-width: 600px) {
      .challenge-grid { grid-template-columns: 1fr; }
    }
  `;

  @state() private user: AuthUser | null = authStore.user;
  @state() private loading = false;
  @state() private errorMsg = "";
  @state() private successMsg = "";

  // Navigation
  @state() private activeTab: 'profile' | 'admin' = 'profile';

  // Profile Form states
  @state() private displayName = "";
  @state() private email = "";
  @state() private password = "";
  @state() private confirmPassword = "";

  // Challenge states
  @state() private challengeCode = "";
  @state() private targetRole: 'editor' | 'admin' = 'editor';
  @state() private challengeLoading = false;

  // Admin states
  @state() private usersList: AuthUser[] = [];
  @state() private editingUser: AuthUser | null = null;
  @state() private adminLoading = false;

  private _unsub?: () => void;

  override connectedCallback() {
    super.connectedCallback();
    this.resetForm();
    this._unsub = authStore.subscribe(u => {
      const wasAdmin = this.user?.role === 'admin';
      this.user = u;
      if (u && !this.loading) this.resetForm();
      if (u?.role === 'admin' && !wasAdmin) this.loadUsers();
    });
    if (this.user?.role === 'admin') this.loadUsers();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._unsub?.();
  }

  private async loadUsers() {
    this.adminLoading = true;
    const res = await authStore.getUsers();
    if (res.ok && res.data) {
      this.usersList = res.data;
    }
    this.adminLoading = false;
  }

  private resetForm() {
    if (!this.user) return;
    this.displayName = this.user.display_name;
    this.email = this.user.email;
    this.password = "";
    this.confirmPassword = "";
    this.errorMsg = "";
    this.successMsg = "";
    this.editingUser = null;
    this.challengeCode = "";
  }

  private async handleRequestChallenge() {
    this.challengeLoading = true;
    this.errorMsg = "";
    this.successMsg = "";

    const res = await authStore.requestRoleChallenge(this.targetRole);
    if (res.ok) {
      this.successMsg = res.message || "Challenge initiated. Check server logs.";
    } else {
      this.errorMsg = res.error || "Failed to initiate challenge.";
    }
    this.challengeLoading = false;
  }

  private async handleApplyChallenge() {
    if (!this.challengeCode) return;
    this.challengeLoading = true;
    this.errorMsg = "";
    this.successMsg = "";

    const res = await authStore.applyRoleChallenge(this.challengeCode);
    if (res.ok) {
      this.successMsg = res.message || "Role updated successfully!";
      this.challengeCode = "";
    } else {
      this.errorMsg = res.error || "Invalid or expired challenge code.";
    }
    this.challengeLoading = false;
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

  private async handleAdminUpdate(e: Event) {
    e.preventDefault();
    if (!this.editingUser) return;

    this.adminLoading = true;
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const data = {
      display_name: formData.get('display_name'),
      email: formData.get('email'),
      role: formData.get('role'),
      is_active: formData.get('is_active') === 'on',
    };

    const res = await authStore.adminUpdateUser(this.editingUser.id, data);
    if (res.ok) {
      this.successMsg = "User updated successfully";
      this.editingUser = null;
      this.loadUsers();
    } else {
      this.errorMsg = res.error || "Failed to update user";
    }
    this.adminLoading = false;
  }

  private async handleAdminDelete(userId: number) {
    if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    
    this.adminLoading = true;
    const res = await authStore.adminDeleteUser(userId);
    if (res.ok) {
      this.successMsg = "User deleted successfully";
      this.loadUsers();
    } else {
      this.errorMsg = res.error || "Failed to delete user";
    }
    this.adminLoading = false;
  }

  private renderProfileTab() {
    const user = this.user;
    if (!user) return html``;

    return html`
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

      ${user.role !== 'admin' ? html`
        <div class="challenge-section">
          <div class="section-title">
            ${i18next.t("profile.role_upgrade", { defaultValue: "Role Upgrade" })}
          </div>
          <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 20px;">
            Request a role upgrade by entering a verification code generated on the server console.
          </p>
          
          <div class="challenge-grid">
            <div class="field">
              <label>Target Role</label>
              <select @change=${(e: any) => this.targetRole = e.target.value} ?disabled=${this.challengeLoading}>
                <option value="editor" ?selected=${this.targetRole === 'editor'}>Editor</option>
                <option value="admin" ?selected=${this.targetRole === 'admin'}>Admin</option>
              </select>
              <button class="btn btn-secondary" style="width: 100%;" 
                @click=${this.handleRequestChallenge} ?disabled=${this.challengeLoading}>
                Request Challenge
              </button>
            </div>
            
            <div class="field">
              <label>Verification Code</label>
              <input type="text" .value=${this.challengeCode} 
                @input=${(e: any) => this.challengeCode = e.target.value}
                placeholder="ABC12345" ?disabled=${this.challengeLoading} />
              <button class="btn btn-primary" style="width: 100%; margin-top: 12px;" 
                @click=${this.handleApplyChallenge} ?disabled=${this.challengeLoading || !this.challengeCode}>
                Apply Code
              </button>
            </div>
          </div>
        </div>
      ` : ""}
    `;
  }

  private renderAdminTab() {
    if (this.adminLoading && this.usersList.length === 0) {
      return html`<p style="text-align: center; padding: 20px;">Loading users...</p>`;
    }

    return html`
      <div class="user-list">
        ${this.usersList.map(u => html`
          <div class="user-item">
            <div class="user-item-info">
              <div class="user-item-name">
                ${u.display_name} (@${u.username})
                <span class="badge badge-${u.role}">${u.role}</span>
                ${(u as any).is_active === 0 ? html`<span class="badge badge-inactive">Inactive</span>` : ""}
              </div>
              <div class="user-item-email">${u.email}</div>
            </div>
            <div class="user-item-actions">
              <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 12px;" 
                @click=${() => this.editingUser = u}>
                Edit
              </button>
              ${u.id !== this.user?.id ? html`
                <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 12px; color: #e74c3c;" 
                  @click=${() => this.handleAdminDelete(u.id)}>
                  Delete
                </button>
              ` : ""}
            </div>
          </div>

          ${this.editingUser?.id === u.id ? html`
            <div class="admin-edit-form">
              <form @submit=${this.handleAdminUpdate}>
                <div class="form-grid">
                  <div class="field">
                    <label>Display Name</label>
                    <input type="text" name="display_name" .value=${u.display_name} required />
                  </div>
                  <div class="field">
                    <label>Email</label>
                    <input type="email" name="email" .value=${u.email} required />
                  </div>
                  <div class="field">
                    <label>Role</label>
                    <select name="role">
                      <option value="user" ?selected=${u.role === 'user'}>User</option>
                      <option value="editor" ?selected=${u.role === 'editor'}>Editor</option>
                      <option value="admin" ?selected=${u.role === 'admin'}>Admin</option>
                    </select>
                  </div>
                  <div class="field" style="display: flex; align-items: center; gap: 10px; padding-top: 30px;">
                    <input type="checkbox" name="is_active" id="active-${u.id}" 
                      ?checked=${(u as any).is_active !== 0} style="width: auto;" />
                    <label for="active-${u.id}" style="margin-bottom: 0;">Active Account</label>
                  </div>
                </div>
                <div class="actions">
                  <button type="button" class="btn btn-secondary" @click=${() => this.editingUser = null}>Cancel</button>
                  <button type="submit" class="btn btn-primary" ?disabled=${this.adminLoading}>Save User</button>
                </div>
              </form>
            </div>
          ` : ""}
        `)}
      </div>
    `;
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

        ${this.user.role === 'admin' ? html`
          <div class="tabs">
            <div class="tab ${this.activeTab === 'profile' ? 'active' : ''}" 
              @click=${() => { this.activeTab = 'profile'; this.errorMsg = ''; this.successMsg = ''; }}>
              ${i18next.t("profile.my_account", { defaultValue: "My Account" })}
            </div>
            <div class="tab ${this.activeTab === 'admin' ? 'active' : ''}" 
              @click=${() => { this.activeTab = 'admin'; this.errorMsg = ''; this.successMsg = ''; }}>
              ${i18next.t("profile.manage_users", { defaultValue: "User Management" })}
            </div>
          </div>
        ` : html`
          <div class="section-title">
            ${i18next.t("profile.edit_settings", { defaultValue: "Account Settings" })}
          </div>
        `}

        ${this.errorMsg ? html`<div class="error-msg">⚠️ ${this.errorMsg}</div>` : ""}
        ${this.successMsg ? html`<div class="success-msg">✅ ${this.successMsg}</div>` : ""}

        ${this.activeTab === 'profile' ? this.renderProfileTab() : this.renderAdminTab()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { "user-profile": UserProfile; }
}

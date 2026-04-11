import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { authStore, type AuthUser } from "../../services/auth-store";
import { useAuth } from "../../contexts/auth-context";
import i18next from "../../utils/i18n";
import { initials, avatarColor } from "./comment-avatar";

interface UserProfileProps {
  onLogout?: () => void;
}

export function UserProfile({ onLogout }: UserProfileProps) {
  const { user, updateProfile, isLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab] = useState<'profile' | 'admin'>('profile');
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [challengeCode, setChallengeCode] = useState("");
  const [targetRole, setTargetRole] = useState<'editor' | 'admin'>('editor');
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [usersList, setUsersList] = useState<AuthUser[]>([]);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    if (user) resetForm();
    if (user?.role === 'admin') loadUsers();
  }, [user]);

  function resetForm() {
    if (!user) return;
    setDisplayName(user.display_name);
    setEmail(user.email);
    setPassword("");
    setConfirmPassword("");
    setErrorMsg("");
    setSuccessMsg("");
    setEditingUser(null);
    setChallengeCode("");
  }

  async function loadUsers() {
    setAdminLoading(true);
    const res = await authStore.getUsers();
    if (res.ok && res.data) {
      setUsersList(res.data);
    }
    setAdminLoading(false);
  }

  async function handleRequestChallenge() {
    setChallengeLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    const res = await authStore.requestRoleChallenge(targetRole);
    if (res.ok) {
      setSuccessMsg(res.message || "Challenge initiated. Check server logs.");
    } else {
      setErrorMsg(res.error || "Failed to initiate challenge.");
    }
    setChallengeLoading(false);
  }

  async function handleApplyChallenge() {
    if (!challengeCode) return;
    setChallengeLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    const res = await authStore.applyRoleChallenge(challengeCode);
    if (res.ok) {
      setSuccessMsg(res.message || "Role updated successfully!");
      setChallengeCode("");
    } else {
      setErrorMsg(res.error || "Invalid or expired challenge code.");
    }
    setChallengeLoading(false);
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (password && password !== confirmPassword) {
      setErrorMsg(i18next.t("auth.passwords_dont_match", { defaultValue: "Passwords do not match." }));
      return;
    }

    setLoading(true);

    const updateData: any = {};
    if (displayName !== user?.display_name) updateData.display_name = displayName;
    if (email !== user?.email) updateData.email = email;
    if (password) updateData.password = password;

    if (Object.keys(updateData).length === 0) {
      setLoading(false);
      setSuccessMsg(i18next.t("profile.no_changes", { defaultValue: "No changes to save." }));
      return;
    }

    const res = await updateProfile(updateData);
    if (res.ok) {
      setSuccessMsg(i18next.t("profile.update_success", { defaultValue: "Profile updated successfully!" }));
      setPassword("");
      setConfirmPassword("");
    } else {
      setErrorMsg(res.error || i18next.t("profile.update_failed", { defaultValue: "Failed to update profile." }));
    }
    setLoading(false);
  }

  async function handleAdminUpdate(e: Event) {
    e.preventDefault();
    if (!editingUser) return;

    setAdminLoading(true);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const data = {
      display_name: formData.get('display_name'),
      email: formData.get('email'),
      role: formData.get('role'),
      is_active: formData.get('is_active') === 'on',
    };

    const res = await authStore.adminUpdateUser(editingUser.id, data);
    if (res.ok) {
      setSuccessMsg("User updated successfully");
      setEditingUser(null);
      loadUsers();
    } else {
      setErrorMsg(res.error || "Failed to update user");
    }
    setAdminLoading(false);
  }

  async function handleAdminDelete(userId: number) {
    if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;

    setAdminLoading(true);
    const res = await authStore.adminDeleteUser(userId);
    if (res.ok) {
      setSuccessMsg("User deleted successfully");
      loadUsers();
    } else {
      setErrorMsg(res.error || "Failed to delete user");
    }
    setAdminLoading(false);
  }

  if (isLoading) {
    return (
      <div class="profile-container">
        <div class="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div class="profile-container">
        <p style="text-align: center; color: var(--text-secondary);">
          {i18next.t("auth.login_required", { defaultValue: "Please sign in to view your profile." })}
        </p>
      </div>
    );
  }

  const color = avatarColor(user.display_name);
  const init = initials(user.display_name);

  return (
    <div class="profile-container">
      <div class="header">
        <div class="avatar" style={{ background: color }}>{init}</div>
        <div class="user-info">
          <h2>{user.display_name}</h2>
          <p>@{user.username}</p>
          <div class="role-badge">{user.role}</div>
        </div>
      </div>

      {user.role === 'admin' && (
        <div class="tabs">
          <div class={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => { setActiveTab('profile'); setErrorMsg(''); setSuccessMsg(''); }}>
            {i18next.t("profile.my_account", { defaultValue: "My Account" })}
          </div>
          <div class={`tab ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => { setActiveTab('admin'); setErrorMsg(''); setSuccessMsg(''); }}>
            {i18next.t("profile.manage_users", { defaultValue: "User Management" })}
          </div>
        </div>
      )}

      {user.role !== 'admin' && (
        <div class="section-title">
          {i18next.t("profile.edit_settings", { defaultValue: "Account Settings" })}
        </div>
      )}

      {errorMsg ? <div class="error-msg">⚠️ {errorMsg}</div> : null}
      {successMsg ? <div class="success-msg">✅ {successMsg}</div> : null}

      {activeTab === 'profile' ? (
        <form onSubmit={handleSubmit}>
          <div class="form-grid">
            <div class="field">
              <label>{i18next.t("auth.display_name", { defaultValue: "Display Name" })}</label>
              <input type="text" value={displayName} onInput={(e) => setDisplayName((e.target as HTMLInputElement).value)}
                disabled={loading} />
            </div>
            <div class="field">
              <label>{i18next.t("auth.email", { defaultValue: "Email Address" })}</label>
              <input type="email" value={email} onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                disabled={loading} />
            </div>
            <div class="field">
              <label>{i18next.t("auth.new_password", { defaultValue: "New Password (Optional)" })}</label>
              <input type="password" value={password} onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                placeholder="••••••••" disabled={loading} />
            </div>
            <div class="field">
              <label>{i18next.t("auth.confirm_password", { defaultValue: "Confirm New Password" })}</label>
              <input type="password" value={confirmPassword} onInput={(e) => setConfirmPassword((e.target as HTMLInputElement).value)}
                placeholder="••••••••" disabled={loading} />
            </div>
          </div>

          <div class="actions">
            <button type="button" class="btn btn-secondary" onClick={resetForm} disabled={loading}>
              {i18next.t("common.cancel", { defaultValue: "Cancel" })}
            </button>
            <button type="submit" class="btn btn-primary" disabled={loading}>
              {loading ? i18next.t("common.saving", { defaultValue: "Saving..." }) : i18next.t("common.save_changes", { defaultValue: "Save Changes" })}
            </button>
          </div>
        </form>
      ) : (
        <div class="user-list">
          {adminLoading && usersList.length === 0 ? (
            <p style="text-align: center; padding: 20px;">Loading users...</p>
          ) : (
            usersList.map(u => (
              <div key={u.id}>
                <div class="user-item">
                  <div class="user-item-info">
                    <div class="user-item-name">
                      {u.display_name} (@{u.username})
                      <span class={`badge badge-${u.role}`}>{u.role}</span>
                    </div>
                    <div class="user-item-email">{u.email}</div>
                  </div>
                  <div class="user-item-actions">
                    <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 12px;"
                      onClick={() => setEditingUser(u)}>
                      Edit
                    </button>
                    {u.id !== user?.id && (
                      <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 12px; color: #e74c3c;"
                        onClick={() => handleAdminDelete(u.id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {editingUser?.id === u.id && (
                  <div class="admin-edit-form">
                    <form onSubmit={handleAdminUpdate}>
                      <div class="form-grid">
                        <div class="field">
                          <label>Display Name</label>
                          <input type="text" name="display_name" value={u.display_name} required />
                        </div>
                        <div class="field">
                          <label>Email</label>
                          <input type="email" name="email" value={u.email} required />
                        </div>
                        <div class="field">
                          <label>Role</label>
                          <select name="role" defaultValue={u.role}>
                            <option value="user">User</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <div class="field" style="display: flex; align-items: center; gap: 10px; padding-top: 30px;">
                          <input type="checkbox" name="is_active" id={`active-${u.id}`}
                            defaultChecked={true} style="width: auto;" />
                          <label for={`active-${u.id}`} style="margin-bottom: 0;">Active Account</label>
                        </div>
                      </div>
                      <div class="actions">
                        <button type="button" class="btn btn-secondary" onClick={() => setEditingUser(null)}>Cancel</button>
                        <button type="submit" class="btn btn-primary" disabled={adminLoading}>Save User</button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
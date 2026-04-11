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
      <div class="flex items-center justify-center p-20">
        <div class="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div class="max-w-4xl mx-auto p-8 bg-card border border-border rounded-2xl shadow-xl">
        <p class="text-center text-text-secondary">
          {i18next.t("auth.login_required", { defaultValue: "Please sign in to view your profile." })}
        </p>
      </div>
    );
  }

  const color = avatarColor(user.display_name);
  const init = initials(user.display_name);

  return (
    <div class="max-w-4xl mx-auto p-8 bg-card border border-border rounded-2xl shadow-xl">
      <div class="flex flex-col md:flex-row items-center gap-8 mb-10">
        <div class="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-lg" style={{ background: color }}>{init}</div>
        <div class="text-center md:text-left">
          <h2 class="text-3xl font-bold text-primary mb-1">{user.display_name}</h2>
          <p class="text-text-secondary font-medium mb-3">@{user.username}</p>
          <div class="inline-block px-3 py-1 bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider rounded-full border border-accent/20">{user.role}</div>
        </div>
      </div>

      {user.role === 'admin' && (
        <div class="flex gap-2 mb-10 bg-secondary p-1 rounded-xl w-fit">
          <div class={`px-6 py-2.5 text-sm font-bold cursor-pointer rounded-lg transition-all ${activeTab === 'profile' ? "bg-primary text-accent shadow-sm" : "text-text-secondary hover:text-primary"}`}
            onClick={() => { setActiveTab('profile'); setErrorMsg(''); setSuccessMsg(''); }}>
            {i18next.t("profile.my_account", { defaultValue: "My Account" })}
          </div>
          <div class={`px-6 py-2.5 text-sm font-bold cursor-pointer rounded-lg transition-all ${activeTab === 'admin' ? "bg-primary text-accent shadow-sm" : "text-text-secondary hover:text-primary"}`}
            onClick={() => { setActiveTab('admin'); setErrorMsg(''); setSuccessMsg(''); }}>
            {i18next.t("profile.manage_users", { defaultValue: "User Management" })}
          </div>
        </div>
      )}

      {user.role !== 'admin' && (
        <div class="text-xl font-bold text-primary mb-6 pb-2 border-b border-border">
          {i18next.t("profile.edit_settings", { defaultValue: "Account Settings" })}
        </div>
      )}

      {errorMsg ? <div class="w-full p-4 bg-error/10 border border-error/20 text-error text-sm rounded-lg mb-6 flex items-center gap-2">⚠️ {errorMsg}</div> : null}
      {successMsg ? <div class="w-full p-4 bg-success/10 border border-success/20 text-success text-sm rounded-lg mb-6 flex items-center gap-2">✅ {successMsg}</div> : null}

      {activeTab === 'profile' ? (
        <>
        <form onSubmit={handleSubmit}>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-text-secondary uppercase tracking-wider">{i18next.t("auth.display_name", { defaultValue: "Display Name" })}</label>
              <input class="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" type="text" value={displayName} onInput={(e) => setDisplayName((e.target as HTMLInputElement).value)}
                disabled={loading} />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-text-secondary uppercase tracking-wider">{i18next.t("auth.email", { defaultValue: "Email Address" })}</label>
              <input class="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" type="email" value={email} onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                disabled={loading} />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-text-secondary uppercase tracking-wider">{i18next.t("auth.new_password", { defaultValue: "New Password (Optional)" })}</label>
              <input class="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" type="password" value={password} onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                placeholder="••••••••" disabled={loading} />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-text-secondary uppercase tracking-wider">{i18next.t("auth.confirm_password", { defaultValue: "Confirm New Password" })}</label>
              <input class="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" type="password" value={confirmPassword} onInput={(e) => setConfirmPassword((e.target as HTMLInputElement).value)}
                placeholder="••••••••" disabled={loading} />
            </div>
          </div>

          <div class="flex justify-end gap-3 mt-8">
            <button type="button" class="px-6 py-2.5 bg-secondary text-primary font-bold rounded-lg border border-border hover:bg-border transition-all disabled:opacity-50" onClick={resetForm} disabled={loading}>
              {i18next.t("common.cancel", { defaultValue: "Cancel" })}
            </button>
            <button type="submit" class="px-6 py-2.5 bg-accent text-white font-bold rounded-lg hover:bg-accent-hover transition-all shadow-md disabled:opacity-50" disabled={loading}>
              {loading ? i18next.t("common.saving", { defaultValue: "Saving..." }) : i18next.t("common.save_changes", { defaultValue: "Save Changes" })}
            </button>
          </div>
        </form>

        {user.role !== 'admin' && (
          <div class="mt-10 border-t border-border pt-10">
            <div class="text-xl font-bold text-primary mb-6 pb-2 border-b border-border">
              {i18next.t("profile.upgrade_account", { defaultValue: "Upgrade Account" })}
            </div>
            <p class="text-sm text-text-secondary mb-6">
              Request a verification code to upgrade your account role.
            </p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold text-text-secondary uppercase tracking-wider">Target Role</label>
                <select class="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" value={targetRole} onChange={(e) => setTargetRole((e.target as HTMLSelectElement).value as any)} disabled={challengeLoading}>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div class="flex flex-col gap-2 items-end justify-end">
                <button type="button" class="w-full px-6 py-2.5 bg-secondary text-primary font-bold rounded-lg border border-border hover:bg-border transition-all disabled:opacity-50" onClick={handleRequestChallenge} disabled={challengeLoading}>
                  {challengeLoading ? "Requesting..." : "Request Code"}
                </button>
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold text-text-secondary uppercase tracking-wider">Verification Code</label>
                <input class="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" type="text" value={challengeCode} onInput={(e) => setChallengeCode((e.target as HTMLInputElement).value)} 
                  placeholder="Enter 8-digit code" disabled={challengeLoading} />
              </div>
              <div class="flex flex-col gap-2 items-end justify-end">
                <button type="button" class="w-full px-6 py-2.5 bg-accent text-white font-bold rounded-lg hover:bg-accent-hover transition-all shadow-md disabled:opacity-50" onClick={handleApplyChallenge} disabled={challengeLoading || !challengeCode}>
                  {challengeLoading ? "Applying..." : "Apply Code"}
                </button>
              </div>
            </div>
          </div>
        )}
        </>
      ) : (
        <div class="flex flex-col gap-3">
          {adminLoading && usersList.length === 0 ? (
            <p class="text-center py-10 text-text-secondary">Loading users...</p>
          ) : (
            usersList.map(u => (
              <div key={u.id} class="flex flex-col">
                <div class="flex items-center justify-between p-4 bg-secondary/50 rounded-xl border border-border">
                  <div class="flex flex-col gap-1">
                    <div class="text-sm font-bold text-primary flex items-center gap-2">
                      {u.display_name} (@{u.username})
                      <span class={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-error/10 text-error border border-error/20' : u.role === 'editor' ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-text-secondary/10 text-text-secondary border border-text-secondary/20'}`}>{u.role}</span>
                    </div>
                    <div class="text-xs text-text-secondary">{u.email}</div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button class="px-3 py-1 bg-secondary text-primary text-xs font-bold rounded border border-border hover:bg-border transition-all"
                      onClick={() => setEditingUser(u)}>
                      Edit
                    </button>
                    {u.id !== user?.id && (
                      <button class="px-3 py-1 bg-secondary text-error text-xs font-bold rounded border border-border hover:bg-error hover:text-white transition-all"
                        onClick={() => handleAdminDelete(u.id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {editingUser?.id === u.id && (
                  <div class="p-6 bg-secondary/30 rounded-xl border border-border mb-6 mt-2">
                    <form onSubmit={handleAdminUpdate}>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div class="flex flex-col gap-2">
                          <label class="text-xs font-bold text-text-secondary uppercase tracking-wider">Display Name</label>
                          <input class="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" type="text" name="display_name" value={u.display_name} required />
                        </div>
                        <div class="flex flex-col gap-2">
                          <label class="text-xs font-bold text-text-secondary uppercase tracking-wider">Email</label>
                          <input class="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" type="email" name="email" value={u.email} required />
                        </div>
                        <div class="flex flex-col gap-2">
                          <label class="text-xs font-bold text-text-secondary uppercase tracking-wider">Role</label>
                          <select class="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" name="role" defaultValue={u.role}>
                            <option value="user">User</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <div class="flex items-center gap-3 pt-6">
                          <input type="checkbox" name="is_active" id={`active-${u.id}`}
                            defaultChecked={true} class="w-5 h-5 accent-accent" />
                          <label for={`active-${u.id}`} class="text-sm font-semibold text-primary">Active Account</label>
                        </div>
                      </div>
                      <div class="flex justify-end gap-3">
                        <button type="button" class="px-6 py-2.5 bg-secondary text-primary font-bold rounded-lg border border-border hover:bg-border transition-all" onClick={() => setEditingUser(null)}>Cancel</button>
                        <button type="submit" class="px-6 py-2.5 bg-accent text-white font-bold rounded-lg hover:bg-accent-hover transition-all shadow-md" disabled={adminLoading}>Save User</button>
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
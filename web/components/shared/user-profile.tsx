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
      <div class="flex items-center justify-center p-24">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!user) {
    return (
      <div class="card bg-base-100 border border-base-content/10 shadow-2xl max-w-4xl mx-auto overflow-hidden">
        <div class="card-body py-16 text-center">
          <div class="text-5xl mb-6 opacity-20">👤</div>
          <p class="text-xl font-black text-base-content/40 tracking-tight">
            {i18next.t("auth.login_required", { defaultValue: "Please sign in to view your profile." })}
          </p>
        </div>
      </div>
    );
  }

  const init = initials(user.display_name);

  return (
    <div class="card bg-base-100 border border-base-content/10 shadow-2xl max-w-4xl mx-auto overflow-hidden rounded-3xl">
      <div class="card-body p-10">
        <div class="flex flex-col md:flex-row items-center gap-10 mb-12">
          <div class="avatar placeholder group">
            <div class="w-28 h-28 rounded-3xl bg-primary text-primary-content text-4xl font-black shadow-lg shadow-primary/20 ring ring-primary ring-offset-base-100 ring-offset-4 group-hover:scale-105 transition-all">
              <span>{init}</span>
            </div>
          </div>
          <div class="text-center md:text-left">
            <h2 class="text-4xl font-black text-base-content tracking-tight mb-2">{user.display_name}</h2>
            <div class="flex items-center justify-center md:justify-start gap-3">
              <span class="text-lg font-bold text-base-content/40">@{user.username}</span>
              <div class="badge badge-primary font-black uppercase tracking-widest text-[10px] py-2.5 px-4 border-none shadow-sm">{user.role}</div>
            </div>
          </div>
        </div>

        {user.role === 'admin' && (
          <div class="tabs tabs-boxed bg-base-200 p-1.5 rounded-2xl border border-base-content/5 mb-12 w-fit mx-auto md:mx-0">
            <button 
              class={`tab tab-lg font-black transition-all rounded-xl h-11 px-8 ${activeTab === 'profile' ? "tab-active bg-primary text-primary-content shadow-lg shadow-primary/20" : "hover:bg-base-content/5"}`}
              onClick={() => { setActiveTab('profile'); setErrorMsg(''); setSuccessMsg(''); }}
            >
              {i18next.t("profile.my_account", { defaultValue: "My Account" })}
            </button>
            <button 
              class={`tab tab-lg font-black transition-all rounded-xl h-11 px-8 ${activeTab === 'admin' ? "tab-active bg-primary text-primary-content shadow-lg shadow-primary/20" : "hover:bg-base-content/5"}`}
              onClick={() => { setActiveTab('admin'); setErrorMsg(''); setSuccessMsg(''); }}
            >
              {i18next.t("profile.manage_users", { defaultValue: "User Management" })}
            </button>
          </div>
        )}

        {user.role !== 'admin' && (
          <div class="flex items-center gap-4 mb-8">
            <h3 class="text-2xl font-black text-base-content tracking-tight">{i18next.t("profile.edit_settings", { defaultValue: "Account Settings" })}</h3>
            <div class="h-px flex-1 bg-base-content/5"></div>
          </div>
        )}

        {errorMsg && (
          <div class="alert alert-error text-sm mb-8 rounded-xl py-3 border-none bg-error/10 text-error font-bold flex items-center gap-3 animate-modal-slide-up">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div class="alert alert-success text-sm mb-8 rounded-xl py-3 border-none bg-success/10 text-success font-bold flex items-center gap-3 animate-modal-slide-up">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {successMsg}
          </div>
        )}

        {activeTab === 'profile' ? (
          <div class="animate-modal-fade-in">
            <form onSubmit={handleSubmit}>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div class="form-control w-full">
                  <label class="label pt-0">
                    <span class="label-text text-[10px] font-black uppercase tracking-widest opacity-50">{i18next.t("auth.display_name", { defaultValue: "Display Name" })}</span>
                  </label>
                  <input class="input input-bordered w-full h-12 bg-base-200 border-base-content/5 focus:border-primary focus:outline-none transition-all rounded-xl font-medium" type="text" value={displayName} onInput={(e) => setDisplayName((e.target as HTMLInputElement).value)}
                    disabled={loading} />
                </div>
                <div class="form-control w-full">
                  <label class="label pt-0">
                    <span class="label-text text-[10px] font-black uppercase tracking-widest opacity-50">{i18next.t("auth.email", { defaultValue: "Email Address" })}</span>
                  </label>
                  <input class="input input-bordered w-full h-12 bg-base-200 border-base-content/5 focus:border-primary focus:outline-none transition-all rounded-xl font-medium" type="email" value={email} onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                    disabled={loading} />
                </div>
                <div class="form-control w-full">
                  <label class="label pt-0">
                    <span class="label-text text-[10px] font-black uppercase tracking-widest opacity-50">{i18next.t("auth.new_password", { defaultValue: "New Password (Optional)" })}</span>
                  </label>
                  <input class="input input-bordered w-full h-12 bg-base-200 border-base-content/5 focus:border-primary focus:outline-none transition-all rounded-xl font-medium" type="password" value={password} onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                    placeholder="••••••••" disabled={loading} />
                </div>
                <div class="form-control w-full">
                  <label class="label pt-0">
                    <span class="label-text text-[10px] font-black uppercase tracking-widest opacity-50">{i18next.t("auth.confirm_password", { defaultValue: "Confirm New Password" })}</span>
                  </label>
                  <input class="input input-bordered w-full h-12 bg-base-200 border-base-content/5 focus:border-primary focus:outline-none transition-all rounded-xl font-medium" type="password" value={confirmPassword} onInput={(e) => setConfirmPassword((e.target as HTMLInputElement).value)}
                    placeholder="••••••••" disabled={loading} />
                </div>
              </div>

              <div class="flex justify-end gap-3">
                <button type="button" class="btn btn-ghost h-12 rounded-xl px-8 font-black hover:bg-base-content/5 transition-all disabled:opacity-50" onClick={resetForm} disabled={loading}>
                  {i18next.t("common.cancel", { defaultValue: "Cancel" })}
                </button>
                <button type="submit" class="btn btn-primary h-12 rounded-xl px-10 font-black shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all border-none disabled:opacity-50" disabled={loading}>
                  {loading ? <span class="loading loading-spinner"></span> : i18next.t("common.save_changes", { defaultValue: "Save Changes" })}
                </button>
              </div>
            </form>

            {user.role !== 'admin' && (
              <div class="mt-16 pt-12 border-t border-base-content/5 animate-modal-slide-up">
                <div class="flex items-center gap-4 mb-8">
                  <h3 class="text-2xl font-black text-base-content tracking-tight">{i18next.t("profile.upgrade_account", { defaultValue: "Upgrade Account" })}</h3>
                  <div class="h-px flex-1 bg-base-content/5"></div>
                </div>
                <p class="text-sm text-base-content/50 mb-10 font-medium max-w-lg leading-relaxed">
                  Request a verification code to upgrade your account role. This process ensures the integrity of our platform.
                </p>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 items-end">
                  <div class="form-control w-full">
                    <label class="label pt-0">
                      <span class="label-text text-[10px] font-black uppercase tracking-widest opacity-50">Target Role</span>
                    </label>
                    <select class="select select-bordered w-full h-12 bg-base-200 border-base-content/5 focus:border-primary focus:outline-none transition-all rounded-xl font-medium" value={targetRole} onChange={(e) => setTargetRole((e.target as HTMLSelectElement).value as any)} disabled={challengeLoading}>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button type="button" class="btn btn-outline h-12 rounded-xl font-black border-base-content/10 hover:bg-base-content/5 transition-all disabled:opacity-50" onClick={handleRequestChallenge} disabled={challengeLoading}>
                    {challengeLoading ? <span class="loading loading-spinner"></span> : "Request Code"}
                  </button>
                  <div class="form-control w-full">
                    <label class="label pt-0">
                      <span class="label-text text-[10px] font-black uppercase tracking-widest opacity-50">Verification Code</span>
                    </label>
                    <input class="input input-bordered w-full h-12 bg-base-200 border-base-content/5 focus:border-primary focus:outline-none transition-all rounded-xl font-medium" type="text" value={challengeCode} onInput={(e) => setChallengeCode((e.target as HTMLInputElement).value)} 
                      placeholder="Enter 8-digit code" disabled={challengeLoading} />
                  </div>
                  <button type="button" class="btn btn-primary h-12 rounded-xl font-black shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all border-none disabled:opacity-50" onClick={handleApplyChallenge} disabled={challengeLoading || !challengeCode}>
                    {challengeLoading ? <span class="loading loading-spinner"></span> : "Apply Code"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div class="animate-modal-fade-in flex flex-col gap-4">
            {adminLoading && usersList.length === 0 ? (
              <div class="flex flex-col items-center justify-center py-24 text-center">
                <span class="loading loading-spinner loading-lg text-primary opacity-20 mb-4"></span>
                <p class="text-base-content/30 font-bold uppercase tracking-widest text-xs">Loading users...</p>
              </div>
            ) : (
              usersList.map(u => (
                <div key={u.id} class="flex flex-col group">
                  <div class={`flex items-center justify-between p-6 bg-base-200/40 rounded-2xl border border-base-content/5 hover:bg-base-200/80 hover:border-primary/20 transition-all ${editingUser?.id === u.id ? "bg-primary/5 border-primary/20 ring-1 ring-primary/10" : ""}`}>
                    <div class="flex items-center gap-4">
                      <div class="avatar placeholder">
                        <div class="bg-neutral text-neutral-content rounded-xl w-12 font-bold ring-1 ring-base-content/5">
                          <span>{initials(u.display_name)}</span>
                        </div>
                      </div>
                      <div class="flex flex-col">
                        <div class="flex items-center gap-3">
                          <span class="text-base font-black text-base-content tracking-tight">{u.display_name}</span>
                          <span class="text-[10px] font-black uppercase tracking-widest opacity-30">@{u.username}</span>
                          <span class={`badge font-black uppercase tracking-widest text-[9px] py-2 border-none ${
                            u.role === 'admin' ? 'bg-error/10 text-error' : 
                            u.role === 'editor' ? 'bg-primary/10 text-primary' : 
                            'bg-base-content/10 text-base-content/50'
                          }`}>{u.role}</span>
                        </div>
                        <span class="text-xs text-base-content/40 font-medium">{u.email}</span>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <button class="btn btn-ghost btn-sm font-black rounded-xl text-[11px] h-9 px-4 hover:bg-primary/10 hover:text-primary transition-all"
                        onClick={() => setEditingUser(u)}>
                        Edit
                      </button>
                      {u.id !== user?.id && (
                        <button class="btn btn-ghost btn-sm font-black rounded-xl text-[11px] h-9 px-4 hover:bg-error/10 hover:text-error transition-all"
                          onClick={() => handleAdminDelete(u.id)}>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {editingUser?.id === u.id && (
                    <div class="p-8 bg-base-200/60 rounded-3xl border border-primary/10 mt-3 animate-modal-slide-up shadow-inner">
                      <form onSubmit={handleAdminUpdate}>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                          <div class="form-control w-full">
                            <label class="label pt-0">
                              <span class="label-text text-[10px] font-black uppercase tracking-widest opacity-50">Display Name</span>
                            </label>
                            <input class="input input-bordered w-full h-11 bg-base-100 border-base-content/5 focus:border-primary focus:outline-none transition-all rounded-xl font-medium" type="text" name="display_name" value={u.display_name} required />
                          </div>
                          <div class="form-control w-full">
                            <label class="label pt-0">
                              <span class="label-text text-[10px] font-black uppercase tracking-widest opacity-50">Email</span>
                            </label>
                            <input class="input input-bordered w-full h-11 bg-base-100 border-base-content/5 focus:border-primary focus:outline-none transition-all rounded-xl font-medium" type="email" name="email" value={u.email} required />
                          </div>
                          <div class="form-control w-full">
                            <label class="label pt-0">
                              <span class="label-text text-[10px] font-black uppercase tracking-widest opacity-50">Role</span>
                            </label>
                            <select class="select select-bordered w-full h-11 bg-base-100 border-base-content/5 focus:border-primary focus:outline-none transition-all rounded-xl font-medium" name="role" defaultValue={u.role}>
                              <option value="user">User</option>
                              <option value="editor">Editor</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                          <div class="form-control pt-6">
                            <label class="label cursor-pointer justify-start gap-4">
                              <input type="checkbox" name="is_active" id={`active-${u.id}`}
                                defaultChecked={true} class="checkbox checkbox-primary rounded-lg" />
                              <span class="label-text font-black text-xs uppercase tracking-widest text-base-content/60">Active Account</span>
                            </label>
                          </div>
                        </div>
                        <div class="flex justify-end gap-3">
                          <button type="button" class="btn btn-ghost h-11 rounded-xl px-8 font-black hover:bg-base-content/5 transition-all" onClick={() => setEditingUser(null)}>Cancel</button>
                          <button type="submit" class="btn btn-primary h-11 rounded-xl px-8 font-black shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all border-none" disabled={adminLoading}>
                            {adminLoading ? <span class="loading loading-spinner"></span> : "Save User"}
                          </button>
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
    </div>
  );
}
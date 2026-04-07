/**
 * auth-store.ts
 * Reactive singleton that holds the current user session.
 * Components can call `authStore.init()` at startup and subscribe via
 * the `onAuthChange` callback list.
 */

export interface AuthUser {
  id: number;
  username: string;
  display_name: string;
  email: string;
  role: string;
}

type AuthListener = (user: AuthUser | null) => void;

class AuthStore {
  private _user: AuthUser | null = null;
  private _token: string | null = null;
  private _listeners: AuthListener[] = [];

  get user(): AuthUser | null { return this._user; }
  get token(): string | null { return this._token; }
  get isLoggedIn(): boolean { return this._user !== null; }
  get isAdmin(): boolean { return this._user?.role === "admin"; }

  subscribe(fn: AuthListener): () => void {
    this._listeners.push(fn);
    return () => { this._listeners = this._listeners.filter(l => l !== fn); };
  }

  private notify() {
    this._listeners.forEach(fn => fn(this._user));
  }

  async init() {
    const token = localStorage.getItem("token");
    if (!token) { this._user = null; this.notify(); return; }
    try {
      const res = await fetch("/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.ok && json.data) {
        this._user = json.data;
        this._token = token;
      } else {
        localStorage.removeItem("token");
        this._user = null;
      }
    } catch {
      this._user = null;
    }
    this.notify();
  }

  async login(username: string, password: string): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const json = await res.json();
    if (json.ok && json.data) {
      this._token = json.data.token;
      this._user = json.data.user;
      localStorage.setItem("token", this._token!);
      this.notify();
      return { ok: true };
    }
    return { ok: false, error: json.error || "Login failed" };
  }

  async register(username: string, email: string, password: string, displayName?: string): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, display_name: displayName || username })
    });
    const json = await res.json();
    if (json.ok) {
      // Auto-login after register
      return this.login(username, password);
    }
    return { ok: false, error: json.error || "Registration failed" };
  }

  async logout() {
    const token = this._token;
    this._user = null;
    this._token = null;
    localStorage.removeItem("token");
    this.notify();
    if (token) {
      fetch("/api/v1/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
    }
  }

  async updateProfile(data: { display_name?: string; email?: string; password?: string }): Promise<{ ok: boolean; error?: string }> {
    if (!this._token) return { ok: false, error: "Not authenticated" };
    try {
      const res = await fetch("/api/v1/auth/update", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this._token}`
        },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (json.ok) {
        // Refresh user data
        await this.init();
        return { ok: true };
      }
      return { ok: false, error: json.error || "Update failed" };
    } catch (err) {
      return { ok: false, error: "Network error" };
    }
  }
}

export const authStore = new AuthStore();

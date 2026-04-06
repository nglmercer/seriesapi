import {LitElement, html, css} from "lit";
import {customElement, state} from "lit/decorators.js";
import {api} from "./api-service";

@customElement("auth-modal")
export class AuthModal extends LitElement {
  static override styles = css`
    :host { display: block; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; }
    .modal { background: #fff; max-width: 400px; margin: 80px auto; border: 1px solid #a2a9b1; border-radius: 2px; }
    .modal-header { background: #eaecf0; padding: 12px 16px; border-bottom: 1px solid #a2a9b1; display: flex; justify-content: space-between; align-items: center; }
    .modal-title { font-size: 18px; font-weight: bold; color: #202122; }
    .close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: #72777d; }
    .close-btn:hover { color: #202122; }
    .tabs { display: flex; border-bottom: 1px solid #a2a9b1; }
    .tab { flex: 1; padding: 12px; text-align: center; cursor: pointer; color: #0645ad; background: #f8f9fa; border: none; font-size: 14px; }
    .tab:hover { background: #eaf3ff; }
    .tab.active { background: #fff; border-bottom: 2px solid #36c; color: #202122; font-weight: bold; }
    .form { padding: 20px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 14px; color: #202122; margin-bottom: 6px; font-weight: bold; }
    .form-group input { width: 100%; padding: 8px 10px; border: 1px solid #a2a9b1; border-radius: 2px; font-size: 14px; box-sizing: border-box; }
    .form-group input:focus { border-color: #36c; outline: none; }
    .submit-btn { width: 100%; background: #36c; color: #fff; border: none; padding: 10px 20px; border-radius: 2px; cursor: pointer; font-size: 14px; font-weight: bold; }
    .submit-btn:hover { background: #447ff5; }
    .submit-btn:disabled { background: #c8ccd1; cursor: not-allowed; }
    .error { background: #fee7e7; border: 1px solid #f8b8b8; color: #d33; padding: 10px; border-radius: 2px; font-size: 13px; margin-bottom: 16px; }
    .success { background: #d5fdf4; border: 1px solid #b8e6c7; color: #14866d; padding: 10px; border-radius: 2px; font-size: 13px; margin-bottom: 16px; }
  `;

  @state() mode: "login" | "register" = "login";
  @state() loading = false;
  @state() error = "";
  @state() success = "";

  @state() username = "";
  @state() email = "";
  @state() password = "";
  @state() displayName = "";

  private handleClose() {
    this.dispatchEvent(new CustomEvent("close", {bubbles: true, composed: true}));
  }

  private handleTabClick(mode: "login" | "register") {
    this.mode = mode;
    this.error = "";
    this.success = "";
  }

  private handleInput(field: string, e: Event) {
    const target = e.target as HTMLInputElement;
    if (field === "username") this.username = target.value;
    else if (field === "email") this.email = target.value;
    else if (field === "password") this.password = target.value;
    else if (field === "displayName") this.displayName = target.value;
  }

  async handleSubmit(e: Event) {
    e.preventDefault();
    this.error = "";
    this.success = "";
    this.loading = true;

    try {
      if (this.mode === "register") {
        const res = await fetch("/api/v1/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: this.username,
            email: this.email,
            password: this.password,
            display_name: this.displayName,
          }),
        });
        const json = await res.json();
        if (!json.ok) {
          this.error = json.error || "Registration failed";
        } else {
          this.success = "Registration successful! Please login.";
          this.mode = "login";
          this.password = "";
        }
      } else {
        const res = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: this.username, password: this.password }),
        });
        const json = await res.json();
        if (!json.ok) {
          this.error = json.error || "Login failed";
        } else {
          localStorage.setItem("auth_token", json.data.token);
          localStorage.setItem("auth_user", JSON.stringify(json.data.user));
          this.dispatchEvent(new CustomEvent("auth-success", {detail: json.data.user, bubbles: true, composed: true}));
          this.handleClose();
        }
      }
    } catch (err) {
      this.error = "Network error. Please try again.";
    }
    this.loading = false;
  }

  override render() {
    return html`
      <div class="modal" @click=${(e: Event) => e.stopPropagation()}>
        <div class="modal-header">
          <span class="modal-title">${this.mode === "login" ? "Log in" : "Create account"}</span>
          <button class="close-btn" @click=${this.handleClose}>×</button>
        </div>
        <div class="tabs">
          <button class="tab ${this.mode === "login" ? "active" : ""}" @click=${() => this.handleTabClick("login")}>Log in</button>
          <button class="tab ${this.mode === "register" ? "active" : ""}" @click=${() => this.handleTabClick("register")}>Register</button>
        </div>
        <form class="form" @submit=${this.handleSubmit}>
          ${this.error ? html`<div class="error">${this.error}</div>` : ""}
          ${this.success ? html`<div class="success">${this.success}</div>` : ""}
          
          <div class="form-group">
            <label>Username</label>
            <input type="text" .value=${this.username} @input=${(e: Event) => this.handleInput("username", e)} required />
          </div>
          
          ${this.mode === "register" ? html`
            <div class="form-group">
              <label>Email</label>
              <input type="email" .value=${this.email} @input=${(e: Event) => this.handleInput("email", e)} required />
            </div>
            <div class="form-group">
              <label>Display Name (optional)</label>
              <input type="text" .value=${this.displayName} @input=${(e: Event) => this.handleInput("displayName", e)} />
            </div>
          ` : ""}
          
          <div class="form-group">
            <label>Password</label>
            <input type="password" .value=${this.password} @input=${(e: Event) => this.handleInput("password", e)} required minlength="6" />
          </div>
          
          <button type="submit" class="submit-btn" ?disabled=${this.loading}>
            ${this.loading ? "Please wait..." : (this.mode === "login" ? "Log in" : "Create account")}
          </button>
        </form>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "auth-modal": AuthModal;
  }
}
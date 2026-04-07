/**
 * comment-compose.ts
 * Compose area for new top-level comments.
 * Shows either the textarea form (when logged in) or a "Sign In" gate card.
 * Emits:
 *   - "comment-submit"  { text, containsSpoilers }
 *   - "need-login"
 */
import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { AuthUser } from "../../services/auth-store";
import i18next from "../../utils/i18n";
import "./comment-avatar";

@customElement("comment-compose")
export class CommentCompose extends LitElement {
  static override styles = css`
    :host { display: block; }

    .row {
      display: flex; gap: 14px; align-items: flex-start;
    }

    /* ── Compose box (logged-in) ── */
    .compose {
      flex: 1;
      background: var(--bg-secondary);
      border: 2px solid var(--border-color);
      border-radius: 16px;
      transition: all .2s ease;
      overflow: hidden;
    }
    .compose:focus-within {
      border-color: var(--accent);
      box-shadow: 0 0 0 4px rgba(255,71,87,.08);
    }

    textarea {
      width: 100%; box-sizing: border-box;
      background: transparent; border: none; outline: none;
      color: var(--text-primary); font-family: inherit;
      font-size: 15px; padding: 12px 16px;
      resize: none; min-height: 80px;
    }

    .footer {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 16px 10px;
      background: rgba(0,0,0,0.02);
      border-top: 1px solid var(--border-color);
    }

    .spoiler-label {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; font-weight: 600; color: var(--text-secondary);
      cursor: pointer; user-select: none;
      transition: color .2s;
    }
    .spoiler-label input { 
      cursor: pointer; accent-color: var(--accent); 
      width: 16px; height: 16px;
    }
    .spoiler-label.on { color: #f39c12; }

    .btn-post {
      background: var(--accent); color: #fff;
      font-size: 14px; font-weight: 700; font-family: inherit;
      padding: 10px 24px; border: none; border-radius: 12px;
      cursor: pointer; transition: all .2s ease;
      box-shadow: 0 4px 12px rgba(255, 71, 87, 0.2);
    }
    .btn-post:hover:not(:disabled) { 
      transform: translateY(-1px); 
      box-shadow: 0 6px 16px rgba(255, 71, 87, 0.3);
    }
    .btn-post:active { transform: translateY(0); }
    .btn-post:disabled { opacity: .4; cursor: not-allowed; box-shadow: none; }

    /* ── Login gate ── */
    .gate {
      flex: 1;
      background: var(--bg-secondary);
      border: 2px dashed var(--border-color);
      border-radius: 16px;
      padding: 24px 28px;
      display: flex; align-items: center; justify-content: space-between; gap: 24px;
      transition: border-color .2s;
    }
    .gate:hover { border-color: var(--accent); }
    .gate-copy { font-size: 14px; color: var(--text-secondary); line-height: 1.5; }
    .gate-copy strong {
      display: block; margin-bottom: 4px;
      font-size: 17px; color: var(--text-primary);
      letter-spacing: -0.01em;
    }
    .btn-signin {
      background: var(--accent); color: #fff;
      font-weight: 700; font-size: 14px; white-space: nowrap;
      padding: 12px 28px; border: none; border-radius: 12px;
      flex-shrink: 0; cursor: pointer; transition: all .2s;
      box-shadow: 0 4px 12px rgba(255, 71, 87, 0.2);
    }
    .btn-signin:hover { 
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(255, 71, 87, 0.3);
    }

    /* ── Ghost avatar for guests ── */
    .ghost-av {
      width: 44px; height: 44px; border-radius: 50%;
      background: var(--bg-secondary);
      border: 2px solid var(--border-color);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; flex-shrink: 0; color: var(--text-secondary);
    }
  `;

  @property({ type: Object }) user: AuthUser | null = null;
  @property({ type: Boolean }) posting = false;

  @state() private text = "";
  @state() private spoilers = false;

  private emit(name: string, detail?: unknown) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private submit() {
    if (!this.text.trim() || this.posting) return;
    this.emit("comment-submit", { text: this.text.trim(), containsSpoilers: this.spoilers });
    // Parent will clear via property change if needed; clear optimistically
    this.text = "";
    this.spoilers = false;
  }

  override render() {
    return html`
      <div class="row">
        ${this.user
          ? html`<comment-avatar .name=${this.user.display_name}></comment-avatar>`
          : html`<div class="ghost-av">👤</div>`
        }

        ${this.user ? html`
          <div class="compose">
            <textarea
              placeholder=${i18next.t("comments.body_placeholder", { defaultValue: "Share your thoughts…  (Ctrl+Enter to post)" })}
              .value=${this.text}
              @input=${(e: any) => this.text = e.target.value}
              @keydown=${(e: KeyboardEvent) => { if (e.key === "Enter" && e.ctrlKey) this.submit(); }}
            ></textarea>
            <div class="footer">
              <label class="spoiler-label ${this.spoilers ? "on" : ""}">
                <input type="checkbox"
                  .checked=${this.spoilers}
                  @change=${(e: any) => this.spoilers = e.target.checked}
                />
                ${i18next.t("comments.contains_spoilers", { defaultValue: "Contains Spoilers" })}
              </label>
              <button class="btn-post" ?disabled=${!this.text.trim() || this.posting} @click=${this.submit}>
                ${this.posting
                  ? i18next.t("comments.posting", { defaultValue: "Posting…" })
                  : i18next.t("comments.post_button", { defaultValue: "Post" })
                }
              </button>
            </div>
          </div>
        ` : html`
          <div class="gate">
            <div class="gate-copy">
              <strong>${i18next.t("comments.join_discussion", { defaultValue: "Join the conversation" })}</strong>
              ${i18next.t("comments.login_required", { defaultValue: "Sign in to comment and interact with the community." })}
            </div>
            <button class="btn-signin" @click=${() => this.emit("need-login")}>
              ${i18next.t("auth.sign_in", { defaultValue: "Sign In" })}
            </button>
          </div>
        `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { "comment-compose": CommentCompose; }
}

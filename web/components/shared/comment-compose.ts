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
      border: 1.5px solid var(--border-color);
      border-radius: 14px;
      transition: border-color .2s, box-shadow .2s;
      overflow: hidden;
    }
    .compose:focus-within {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(255,71,87,.1);
    }

    textarea {
      width: 100%; box-sizing: border-box;
      background: transparent; border: none; outline: none;
      color: var(--text-primary); font-family: inherit;
      font-size: 15px; padding: 14px 16px;
      resize: none; min-height: 80px;
    }

    .footer {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 14px 10px;
      border-top: 1px solid var(--border-color);
    }

    .spoiler-label {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; color: var(--text-secondary);
      cursor: pointer; user-select: none;
    }
    .spoiler-label input { cursor: pointer; accent-color: var(--accent); }
    .spoiler-label.on { color: #f39c12; }

    .btn-post {
      background: var(--accent); color: #fff;
      font-size: 13px; font-weight: 700; font-family: inherit;
      padding: 8px 20px; border: none; border-radius: 8px;
      cursor: pointer; transition: opacity .2s, transform .1s;
    }
    .btn-post:hover:not(:disabled) { opacity: .85; transform: translateY(-1px); }
    .btn-post:disabled { opacity: .4; cursor: not-allowed; transform: none; }

    /* ── Login gate ── */
    .gate {
      flex: 1;
      background: var(--bg-secondary);
      border: 1.5px dashed var(--border-color);
      border-radius: 14px;
      padding: 16px 20px;
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
    }
    .gate-copy { font-size: 14px; color: var(--text-secondary); }
    .gate-copy strong {
      display: block; margin-bottom: 3px;
      font-size: 15px; color: var(--text-primary);
    }
    .btn-signin {
      background: var(--accent); color: #fff;
      font-weight: 700; font-size: 13px; white-space: nowrap;
      padding: 9px 20px; border: none; border-radius: 8px;
      flex-shrink: 0; cursor: pointer; transition: opacity .2s;
    }
    .btn-signin:hover { opacity: .85; }

    /* ── Ghost avatar for guests ── */
    .ghost-av {
      width: 40px; height: 40px; border-radius: 50%;
      background: var(--border-color);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; flex-shrink: 0;
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

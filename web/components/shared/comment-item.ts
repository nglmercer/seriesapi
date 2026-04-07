/**
 * comment-item.ts
 * Renders a single comment post (top-level or reply).
 * Emits:
 *   - "reply-submit"   { parentId, text }   — user posted a reply
 *   - "need-login"                           — user tried to act but is not authenticated
 */
import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import i18next from "../../utils/i18n";
import "./comment-avatar";

export interface CommentData {
  id: number;
  display_name: string;
  body: string;
  contains_spoilers: boolean;
  likes: number;
  created_at: string;
  replies?: CommentData[];
}

export function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const SHARED = css`
  /* ── Spoiler badge ── */
  .spoiler-badge {
    font-size: 11px; font-weight: 700;
    padding: 2px 7px; border-radius: 4px;
    background: rgba(243,156,18,0.12); color: #f39c12;
    border: 1px solid rgba(243,156,18,0.3);
    letter-spacing: .04em;
  }

  /* ── Text body ── */
  .body-text {
    font-size: 15px; line-height: 1.65;
    color: var(--text-primary);
    white-space: pre-wrap; word-break: break-word;
    margin: 0;
  }
  .body-text.blurred {
    filter: blur(5px); cursor: pointer;
    transition: filter .3s; user-select: none;
  }
  .body-text.blurred:hover { filter: blur(0); }

  /* ── Action bar ── */
  .actions {
    display: flex; gap: 14px; margin-top: 10px; align-items: center;
  }
  .act-btn {
    background: none; border: none; cursor: pointer;
    display: flex; align-items: center; gap: 5px;
    font-size: 13px; color: var(--text-secondary);
    padding: 4px 8px; border-radius: 6px; font-family: inherit;
    transition: background .15s, color .15s;
  }
  .act-btn:hover { background: var(--bg-secondary); color: var(--text-primary); }
  .act-btn.active { color: var(--accent); }
`;

@customElement("comment-item")
export class CommentItem extends LitElement {
  static override styles = [
    SHARED,
    css`
      :host { display: block; }

      /* ── Top-level layout ── */
      .post {
        display: flex; gap: 14px;
        padding: 18px 0;
        border-bottom: 1px solid var(--border-color);
      }
      .post:last-of-type { border-bottom: none; }

      .content { flex: 1; min-width: 0; }

      .meta {
        display: flex; align-items: center; gap: 8px;
        margin-bottom: 6px; flex-wrap: wrap;
      }
      .author { font-weight: 700; font-size: 14px; color: var(--text-primary); }
      .time   { font-size: 12px; color: var(--text-secondary); }

      /* ── Inline reply form ── */
      .reply-form {
        margin-top: 12px;
        border: 1.5px solid var(--border-color);
        border-radius: 10px;
        background: var(--bg-primary);
      }
      .reply-form:focus-within {
        border-color: var(--accent);
        box-shadow: 0 0 0 3px rgba(255,71,87,.1);
      }
      textarea {
        width: 100%; box-sizing: border-box;
        background: transparent; border: none; outline: none;
        color: var(--text-primary); font-family: inherit;
        font-size: 14px; padding: 10px 12px;
        resize: none; min-height: 60px;
        border-radius: 10px;
      }
      .reply-footer {
        display: flex; justify-content: flex-end; gap: 8px;
        padding: 6px 12px 8px;
        border-top: 1px solid var(--border-color);
      }
      .btn-cancel {
        background: transparent; color: var(--text-secondary);
        border: 1px solid var(--border-color);
        padding: 6px 14px; border-radius: 7px;
        font-size: 13px; font-family: inherit; cursor: pointer;
        transition: background .15s;
      }
      .btn-cancel:hover { background: var(--bg-secondary); }
      .btn-reply {
        background: var(--accent); color: #fff;
        border: none; padding: 6px 16px; border-radius: 7px;
        font-size: 13px; font-weight: 700; font-family: inherit;
        cursor: pointer; transition: opacity .2s;
      }
      .btn-reply:disabled { opacity: .4; cursor: not-allowed; }

      /* ── Nested replies ── */
      .replies {
        margin-top: 12px;
        padding-left: 16px;
        border-left: 2px solid var(--border-color);
      }
      .reply-post {
        display: flex; gap: 10px;
        padding: 10px 0;
        border-bottom: 1px solid rgba(128,128,128,.08);
      }
      .reply-post:last-child { border-bottom: none; }
      .reply-content { flex: 1; min-width: 0; }
      .reply-meta {
        display: flex; align-items: center; gap: 7px;
        margin-bottom: 4px;
      }
      .reply-author { font-weight: 700; font-size: 13px; color: var(--text-primary); }
      .reply-time   { font-size: 11px; color: var(--text-secondary); }
      .reply-body {
        font-size: 14px; line-height: 1.6;
        color: var(--text-primary); white-space: pre-wrap;
      }
    `,
  ];

  @property({ type: Object }) comment!: CommentData;
  @property({ type: Boolean }) isLoggedIn = false;
  @property({ type: Boolean }) isPosting = false;

  @state() private showReply = false;
  @state() private replyText = "";
  @state() private spoilerRevealed = false;

  private emit(name: string, detail?: unknown) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private handleReplyClick() {
    if (!this.isLoggedIn) { this.emit("need-login"); return; }
    this.showReply = !this.showReply;
    if (!this.showReply) this.replyText = "";
  }

  private submitReply() {
    if (!this.replyText.trim() || this.isPosting) return;
    this.emit("reply-submit", { parentId: this.comment.id, text: this.replyText.trim() });
    this.replyText = "";
    this.showReply = false;
  }

  override render() {
    const c = this.comment;
    const bodyClass = c.contains_spoilers && !this.spoilerRevealed ? "body-text blurred" : "body-text";

    return html`
      <div class="post">
        <comment-avatar .name=${c.display_name}></comment-avatar>

        <div class="content">
          <div class="meta">
            <span class="author">${c.display_name}</span>
            <span class="time">${relativeTime(c.created_at)}</span>
            ${c.contains_spoilers ? html`<span class="spoiler-badge">SPOILER</span>` : ""}
          </div>

          <p class="${bodyClass}" @click=${() => { if (c.contains_spoilers) this.spoilerRevealed = true; }}>
            ${c.body}
          </p>

          <div class="actions">
            <!-- Like -->
            <button class="act-btn" title="Like">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
              </svg>
              ${c.likes > 0 ? c.likes : ""}
            </button>

            <!-- Reply toggle -->
            <button class="act-btn ${this.showReply ? "active" : ""}" @click=${this.handleReplyClick}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 17 4 12 9 7"/>
                <path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
              </svg>
              ${i18next.t("comments.reply", { defaultValue: "Reply" })}
              ${c.replies?.length ? html`<span style="opacity:.5">(${c.replies.length})</span>` : ""}
            </button>
          </div>

          <!-- Inline reply form -->
          ${this.showReply ? html`
            <div class="reply-form">
              <textarea
                placeholder=${i18next.t("comments.reply_placeholder", { defaultValue: "Write a reply… (Ctrl+Enter to send)" })}
                .value=${this.replyText}
                @input=${(e: any) => this.replyText = e.target.value}
                @keydown=${(e: KeyboardEvent) => { if (e.key === "Enter" && e.ctrlKey) this.submitReply(); }}
              ></textarea>
              <div class="reply-footer">
                <button class="btn-cancel" @click=${() => { this.showReply = false; this.replyText = ""; }}>
                  ${i18next.t("common.cancel", { defaultValue: "Cancel" })}
                </button>
                <button class="btn-reply" ?disabled=${!this.replyText.trim() || this.isPosting} @click=${this.submitReply}>
                  ${this.isPosting ? "…" : i18next.t("comments.reply_btn", { defaultValue: "Reply" })}
                </button>
              </div>
            </div>
          ` : ""}

          <!-- Nested replies -->
          ${c.replies && c.replies.length > 0 ? html`
            <div class="replies">
              ${c.replies.map(r => html`
                <div class="reply-post">
                  <comment-avatar .name=${r.display_name} size="sm"></comment-avatar>
                  <div class="reply-content">
                    <div class="reply-meta">
                      <span class="reply-author">${r.display_name}</span>
                      <span class="reply-time">${relativeTime(r.created_at)}</span>
                      ${r.contains_spoilers ? html`<span class="spoiler-badge">SPOILER</span>` : ""}
                    </div>
                    <p class="reply-body">${r.body}</p>
                  </div>
                </div>
              `)}
            </div>
          ` : ""}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { "comment-item": CommentItem; }
}

/**
 * comments-section.ts
 * Thin orchestrator: manages data fetching, auth state, and wires sub-components.
 *
 * Sub-components used:
 *   <comment-compose>  — new top-level post / login gate
 *   <comment-item>     — single comment thread (with replies)
 *   <auth-modal>       — login/register overlay
 */
import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { authStore, type AuthUser } from "../../services/auth-store";
import { mediaService } from "../../services/media-service";
import { api } from "../../services/api-service";
import i18next from "../../utils/i18n";
import type { CommentData } from "./comment-item";
import "./comment-compose";
import "./comment-item";
import "./auth-modal";

@customElement("comments-section")
export class CommentsSection extends LitElement {
  static override styles = css`
    :host { display: block; font-family: inherit; }

    .section {
      margin-top: 40px;
      border-top: 1px solid var(--border-color);
      padding-top: 32px;
    }

    /* ── Header ── */
    .head {
      display: flex; align-items: center; gap: 12px;
      margin-bottom: 28px;
    }
    .head h3 {
      margin: 0;
      font-size: 22px; font-weight: 800; color: var(--text-primary);
      letter-spacing: -0.02em;
    }
    .badge {
      background: var(--accent); color: #fff;
      font-size: 12px; font-weight: 700;
      padding: 2px 10px; border-radius: 20px;
      box-shadow: 0 2px 8px rgba(255, 71, 87, 0.3);
    }

    /* ── List ── */
    .list { 
      margin-top: 32px;
      display: flex; flex-direction: column; gap: 4px;
    }

    /* ── States ── */
    .empty {
      text-align: center; padding: 60px 20px;
      color: var(--text-secondary);
      background: var(--bg-secondary);
      border-radius: 16px;
      margin-top: 24px;
    }
    .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
    .empty p    { margin: 0; font-size: 16px; font-weight: 500; }

    .load-more {
      text-align: center; padding: 32px 0 16px;
    }
    .btn-more {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 12px 32px; border-radius: 12px;
      font-size: 14px; font-weight: 600; font-family: inherit; cursor: pointer;
      transition: all .2s ease;
    }
    .btn-more:hover { 
      background: var(--border-color); 
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .btn-more:active { transform: translateY(0); }
  `;

  @property({ type: String }) entityType = "";
  @property({ type: Number }) entityId = 0;

  @state() private comments: CommentData[] = [];
  @state() private total = 0;
  @state() private page = 1;
  @state() private loading = true;

  @state() private posting = false;
  @state() private postingReply = false;

  @state() private user: AuthUser | null = null;
  @state() private showAuth = false;

  private unsub?: () => void;

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  override connectedCallback() {
    super.connectedCallback();
    this.user = authStore.user;
    this.unsub = authStore.subscribe(u => { this.user = u; });
    // initialise auth (no-op if already done by another component)
    authStore.init().then(() => { this.user = authStore.user; });
    this.fetchComments();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.unsub?.();
  }

  // ── Data ──────────────────────────────────────────────────────────────────

  private async fetchComments(append = false) {
    if (!this.entityType || !this.entityId) return;
    if (!append) this.loading = true;

    const res = this.entityType === 'media' 
      ? await mediaService.fetchMediaComments(this.entityId, this.page)
      : await mediaService.fetchEpisodeComments(this.entityId, this.page);
    
    if (res) {
      const rows: CommentData[] = Array.isArray(res.comments) ? res.comments : [];
      this.total = res.total || rows.length;
      this.comments = append ? [...this.comments, ...rows] : rows;
    }
    this.loading = false;
  }

  private async loadMore() {
    this.page += 1;
    await this.fetchComments(true);
  }

  // ── Post handlers ──────────────────────────────────────────────────────────

  private async handleCommentSubmit(e: CustomEvent) {
    if (!this.user) return;
    this.posting = true;

    const { text, containsSpoilers } = e.detail as { text: string; containsSpoilers: boolean };
    const res = await api.postComment({
      entity_type: this.entityType,
      entity_id: this.entityId,
      display_name: this.user.display_name,
      body: text,
      contains_spoilers: containsSpoilers,
    });

    if (res.ok) {
      this.page = 1;
      await this.fetchComments();
    }
    this.posting = false;
  }

  private async handleReplySubmit(e: CustomEvent) {
    if (!this.user) return;
    this.postingReply = true;

    const { parentId, text } = e.detail as { parentId: number; text: string };
    await api.postComment({
      entity_type: this.entityType,
      entity_id: this.entityId,
      display_name: this.user.display_name,
      body: text,
      parent_id: parentId,
    });

    this.page = 1;
    await this.fetchComments();
    this.postingReply = false;
  }

  private handleNeedLogin() {
    this.showAuth = true;
  }

  private onAuthClose() {
    this.showAuth = false;
    this.user = authStore.user;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  override render() {
    const remaining = this.total - this.comments.length;

    return html`
      <!-- Auth modal overlay -->
      ${this.showAuth ? html`
        <auth-modal @auth-close=${this.onAuthClose}></auth-modal>
      ` : ""}

      <div class="section">
        <!-- Section header -->
        <div class="head">
          <h3>${i18next.t("comments.title", { defaultValue: "Community" })}</h3>
          ${this.total > 0 ? html`<span class="badge">${this.total}</span>` : ""}
        </div>

        <!-- Compose / login gate -->
        <comment-compose
          .user=${this.user}
          .posting=${this.posting}
          @comment-submit=${this.handleCommentSubmit}
          @need-login=${this.handleNeedLogin}
        ></comment-compose>

        <!-- Comment list -->
        <div class="list">
          ${this.loading ? html`
            <div class="empty">
              <div class="empty-icon">💬</div>
              <p>${i18next.t("common.loading", { defaultValue: "Loading…" })}</p>
            </div>
          ` : this.comments.length === 0 ? html`
            <div class="empty">
              <div class="empty-icon">💬</div>
              <p>${i18next.t("comments.empty", { defaultValue: "No comments yet. Be the first!" })}</p>
            </div>
          ` : html`
            ${this.comments.map(c => html`
              <comment-item
                .comment=${c}
                .isLoggedIn=${this.user !== null}
                .isPosting=${this.postingReply}
                @reply-submit=${this.handleReplySubmit}
                @need-login=${this.handleNeedLogin}
              ></comment-item>
            `)}
          `}
        </div>

        <!-- Load-more button -->
        ${remaining > 0 ? html`
          <div class="load-more">
            <button class="btn-more" @click=${this.loadMore}>
              ${i18next.t("comments.load_more", { defaultValue: "Load more" })}
              (${remaining})
            </button>
          </div>
        ` : ""}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { "comments-section": CommentsSection; }
}

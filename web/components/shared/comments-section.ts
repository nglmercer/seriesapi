import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { api } from "../../services/api-service";
import i18next from "../../utils/i18n";

@customElement("comments-section")
export class CommentsSection extends LitElement {
  static override styles = css`
    :host { display: block; }
    .container { margin-top: 32px; background: var(--bg-primary); padding: 24px; border-radius: 12px; border: 1px solid var(--border-color); }
    h3 { margin-top: 0; margin-bottom: 20px; font-size: 20px; border-bottom: 2px solid var(--border-color); padding-bottom: 12px; }
    
    .comment-form { display: flex; flex-direction: column; gap: 12px; margin-bottom: 30px; }
    .row { display: flex; gap: 12px; }
    input, textarea { 
      padding: 12px; border-radius: 8px; background: var(--bg-secondary); 
      color: var(--text-primary); border: 1px solid var(--border-color);
      font-family: inherit; font-size: 14px;
    }
    textarea { min-height: 80px; resize: vertical; }
    input { width: 200px; }
    .actions { display: flex; justify-content: space-between; align-items: center; }
    .btn-submit { background: var(--accent); color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
    
    .spoilers-check { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--error-color); font-weight: 500; cursor: pointer; }

    .comment-list { display: flex; flex-direction: column; gap: 16px; }
    .comment { 
      background: var(--bg-secondary); padding: 16px; border-radius: 8px; 
      border-left: 4px solid var(--border-color);
    }
    .comment.has-spoilers .comment-body { filter: blur(8px); cursor: pointer; transition: filter 0.3s; }
    .comment.has-spoilers:hover .comment-body { filter: blur(0); }
    .meta { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px; color: var(--text-secondary); }
    .author { font-weight: bold; color: var(--text-primary); font-size: 14px; }
    .comment-body { font-size: 15px; color: var(--text-primary); white-space: pre-wrap; line-height: 1.5; }
    .empty { text-align: center; color: var(--text-secondary); padding: 20px; }
  `;

  @property({ type: String }) entityType = "";
  @property({ type: Number }) entityId = 0;

  @state() comments: any[] = [];
  @state() total = 0;
  @state() page = 1;
  @state() loading = true;
  
  // Form state
  @state() authorName = "";
  @state() newComment = "";
  @state() containsSpoilers = false;
  @state() posting = false;

  override connectedCallback() {
    super.connectedCallback();
    this.authorName = localStorage.getItem("comment_author") || "";
    this.loadComments();
  }

  async loadComments() {
    if (!this.entityType || !this.entityId) return;
    this.loading = true;
    const res = await api.getComments(this.entityType, this.entityId, this.page);
    if (res.ok && res.data) {
      if (typeof res.data === "object" && !Array.isArray(res.data)) {
         this.comments = res.data.rows || [];
         this.total = res.data.total || this.comments.length;
      } else {
         this.comments = res.data;
         this.total = this.comments.length;
      }
    }
    this.loading = false;
  }

  async submitComment(e: Event) {
    e.preventDefault();
    if (!this.authorName.trim() || !this.newComment.trim() || this.posting) return;
    
    this.posting = true;
    localStorage.setItem("comment_author", this.authorName.trim());

    const res = await api.postComment({
      entity_type: this.entityType,
      entity_id: this.entityId,
      display_name: this.authorName.trim(),
      body: this.newComment.trim(),
      contains_spoilers: this.containsSpoilers
    });

    if (res.ok) {
      this.newComment = "";
      this.containsSpoilers = false;
      this.page = 1;
      await this.loadComments();
    } else {
      alert("Error posting comment.");
    }
    this.posting = false;
  }

  override render() {
    return html`
      <div class="container">
        <h3>${i18next.t("comments.title", { defaultValue: "Comments" })} (${this.total})</h3>
        
        <form class="comment-form" @submit=${this.submitComment}>
          <div class="row">
            <input 
              type="text" 
              placeholder=${i18next.t("comments.name_placeholder", { defaultValue: "Your Name" })}
              .value=${this.authorName}
              @input=${(e: any) => this.authorName = e.target.value}
              required
              maxlength="50"
            />
          </div>
          <textarea 
            placeholder=${i18next.t("comments.body_placeholder", { defaultValue: "Write your comment here..." })}
            .value=${this.newComment}
            @input=${(e: any) => this.newComment = e.target.value}
            required
            maxlength="1000"
          ></textarea>
          <div class="actions">
            <label class="spoilers-check">
              <input type="checkbox" .checked=${this.containsSpoilers} @change=${(e: any) => this.containsSpoilers = e.target.checked} />
              ${i18next.t("comments.contains_spoilers", { defaultValue: "Contains Spoilers" })}
            </label>
            <button type="submit" class="btn-submit" ?disabled=${this.posting || !this.authorName.trim() || !this.newComment.trim()}>
              ${this.posting ? i18next.t("comments.posting", { defaultValue: "Posting..." }) : i18next.t("comments.post_button", { defaultValue: "Post Comment" })}
            </button>
          </div>
        </form>

        <div class="comment-list">
          ${this.loading ? html`<div class="empty">Loading comments...</div>` : ''}
          ${!this.loading && this.comments.length === 0 ? html`<div class="empty">${i18next.t("comments.empty", { defaultValue: "Be the first to comment!" })}</div>` : ''}
          ${this.comments.map(c => html`
            <div class="comment ${c.contains_spoilers ? 'has-spoilers' : ''}">
              <div class="meta">
                <span class="author">${c.display_name}</span>
                <span>${new Date(c.created_at).toLocaleDateString()}</span>
              </div>
              <div class="comment-body">${c.body}</div>
              ${c.contains_spoilers ? html`<div style="font-size: 11px; color: var(--error-color); margin-top: 5px;">Hover to reveal spoilers</div>` : ''}
            </div>
          `)}
        </div>
      </div>
    `;
  }
}

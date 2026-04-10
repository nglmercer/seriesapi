import { h } from 'preact';
import { useState } from 'preact/hooks';
import { CommentAvatar } from "./comment-avatar";
import { ICONS } from "../../utils/icons";
import i18next from "../../utils/i18n";
import type { Comment_Item as CommentData } from "../../services/api-service";

export { type CommentData };

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

interface CommentItemProps {
  comment: CommentData;
  isLoggedIn?: boolean;
  isPosting?: boolean;
  onReplySubmit?: (parentId: number, text: string) => void;
  onNeedLogin?: () => void;
}

export function CommentItem({ comment, isLoggedIn = false, isPosting = false, onReplySubmit, onNeedLogin }: CommentItemProps) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

  function handleReplyClick() {
    if (!isLoggedIn) {
      if (onNeedLogin) onNeedLogin();
      return;
    }
    setShowReply(!showReply);
    if (!showReply) setReplyText("");
  }

  function handleLike() {
    if (!isLoggedIn) {
      if (onNeedLogin) onNeedLogin();
      return;
    }
    setLiked(!liked);
    if (liked) setDisliked(false);
  }

  function handleDislike() {
    if (!isLoggedIn) {
      if (onNeedLogin) onNeedLogin();
      return;
    }
    setDisliked(!disliked);
    if (disliked) setLiked(false);
  }

  function submitReply() {
    if (!replyText.trim() || isPosting) return;
    if (onReplySubmit) {
      onReplySubmit(comment.id, replyText.trim());
    }
    setReplyText("");
    setShowReply(false);
  }

  const bodyClass = comment.contains_spoilers && !spoilerRevealed ? "body-text blurred" : "body-text";

  return (
    <div class="post">
      <CommentAvatar name={comment.display_name} size="md" />

      <div class="content">
        <div class="meta">
          <span class="author">{comment.display_name}</span>
          <span class="time">{relativeTime(comment.created_at)}</span>
          {comment.contains_spoilers ? <span class="spoiler-badge">{i18next.t("comments.spoiler_badge", { defaultValue: "SPOILER" })}</span> : null}
        </div>

        <p class={bodyClass} onClick={() => { if (comment.contains_spoilers) setSpoilerRevealed(true); }}>
          {comment.body}
        </p>

        <div class="actions">
          <button class={`act-btn ${liked ? "active" : ""}`} onClick={handleLike} title={i18next.t("comments.like", { defaultValue: "Like" })}>
            <span style={liked ? 'color: currentColor;' : ''}>{ICONS.like}</span>
            {(comment.likes || 0) + (liked ? 1 : 0)}
          </button>

          <button class={`act-btn ${disliked ? "active" : ""}`} onClick={handleDislike} title={i18next.t("comments.dislike", { defaultValue: "Dislike" })}>
            <span style={disliked ? 'color: currentColor;' : ''}>{ICONS.dislike}</span>
          </button>

          <button class={`act-btn ${showReply ? "active" : ""}`} onClick={handleReplyClick}>
            {ICONS.reply}
            {i18next.t("comments.reply", { defaultValue: "Reply" })}
            {comment.replies?.length ? <span style="opacity:.6; font-size: 11px; margin-left: -2px;">{comment.replies.length}</span> : null}
          </button>
        </div>

        {showReply && (
          <div class="reply-form">
            <textarea
              value={replyText}
              onInput={(e) => setReplyText((e.target as HTMLTextAreaElement).value)}
              placeholder={i18next.t("comments.reply_placeholder", { defaultValue: "Write a reply..." })}
            />
            <div class="reply-footer">
              <button class="btn-cancel" onClick={() => setShowReply(false)}>
                {i18next.t("common.cancel", { defaultValue: "Cancel" })}
              </button>
              <button class="btn-reply" disabled={!replyText.trim() || isPosting} onClick={submitReply}>
                {i18next.t("comments.reply", { defaultValue: "Reply" })}
              </button>
            </div>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div class="replies">
            {comment.replies.map(reply => (
              <div class="reply-post">
                <CommentAvatar name={reply.display_name} size="sm" />
                <div class="reply-content">
                  <div class="reply-meta">
                    <span class="reply-author">{reply.display_name}</span>
                    <span class="reply-time">{relativeTime(reply.created_at)}</span>
                  </div>
                  <p class="reply-body">{reply.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
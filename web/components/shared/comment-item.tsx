import { h } from 'preact';
import { useState } from 'preact/hooks';
import { CommentAvatar } from "./comment-avatar";
import { ICONS } from "../../utils/icons";
import i18next from "../../utils/i18n";
import type { Comment_Item as CommentData } from "../../services/api-service";
import styles from './comment-item.module.css';

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

  const bodyClass = comment.contains_spoilers && !spoilerRevealed ? `${styles.bodyText} ${styles.blurred}` : styles.bodyText;

  return (
    <div class={styles.post}>
      <CommentAvatar name={comment.display_name} size="md" />

      <div class={styles.content}>
        <div class={styles.meta}>
          <span class={styles.author}>{comment.display_name}</span>
          <span class={styles.time}>{relativeTime(comment.created_at)}</span>
          {comment.contains_spoilers ? <span class={styles.spoilerBadge}>{i18next.t("comments.spoiler_badge", { defaultValue: "SPOILER" })}</span> : null}
        </div>

        <p class={bodyClass} onClick={() => { if (comment.contains_spoilers) setSpoilerRevealed(true); }}>
          {comment.body}
        </p>

        <div class={styles.actions}>
          <button class={`${styles.actBtn} ${liked ? styles.active : ""}`} onClick={handleLike} title={i18next.t("comments.like", { defaultValue: "Like" })}>
            <span style={liked ? 'color: currentColor;' : ''}>{ICONS.like}</span>
            {(comment.likes || 0) + (liked ? 1 : 0)}
          </button>

          <button class={`${styles.actBtn} ${disliked ? styles.active : ""}`} onClick={handleDislike} title={i18next.t("comments.dislike", { defaultValue: "Dislike" })}>
            <span style={disliked ? 'color: currentColor;' : ''}>{ICONS.dislike}</span>
          </button>

          <button class={`${styles.actBtn} ${showReply ? styles.active : ""}`} onClick={handleReplyClick}>
            {ICONS.reply}
            {i18next.t("comments.reply", { defaultValue: "Reply" })}
            {comment.replies?.length ? <span style="opacity:.6; font-size: 11px; margin-left: -2px;">{comment.replies.length}</span> : null}
          </button>
        </div>

        {showReply && (
          <div class={styles.replyForm}>
            <textarea
              value={replyText}
              onInput={(e) => setReplyText((e.target as HTMLTextAreaElement).value)}
              placeholder={i18next.t("comments.reply_placeholder", { defaultValue: "Write a reply..." })}
            />
            <div class={styles.replyFooter}>
              <button class={styles.btnCancel} onClick={() => setShowReply(false)}>
                {i18next.t("common.cancel", { defaultValue: "Cancel" })}
              </button>
              <button class={styles.btnReply} disabled={!replyText.trim() || isPosting} onClick={submitReply}>
                {i18next.t("comments.reply", { defaultValue: "Reply" })}
              </button>
            </div>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div class={styles.replies}>
            {comment.replies.map(reply => (
              <div class={styles.replyPost}>
                <CommentAvatar name={reply.display_name} size="sm" />
                <div class={styles.replyContent}>
                  <div class={styles.replyMeta}>
                    <span class={styles.replyAuthor}>{reply.display_name}</span>
                    <span class={styles.replyTime}>{relativeTime(reply.created_at)}</span>
                  </div>
                  <p class={styles.replyBody}>{reply.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
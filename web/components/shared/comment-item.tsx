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

  const bodyClass = `text-sm leading-relaxed text-primary mb-3 break-words ${comment.contains_spoilers && !spoilerRevealed ? "blur-md cursor-pointer select-none" : ""}`;

  return (
    <div class="flex gap-3 py-4 border-b border-border last:border-none">
      <CommentAvatar name={comment.display_name} size="md" />

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2.5 mb-2 flex-wrap">
          <span class="font-bold text-sm text-primary">{comment.display_name}</span>
          <span class="text-xs text-text-secondary">{relativeTime(comment.created_at)}</span>
          {comment.contains_spoilers ? <span class="text-[10px] font-bold px-1.5 py-0.5 bg-error text-white rounded uppercase">{i18next.t("comments.spoiler_badge", { defaultValue: "SPOILER" })}</span> : null}
        </div>

        <p class={bodyClass} onClick={() => { if (comment.contains_spoilers) setSpoilerRevealed(true); }}>
          {comment.body}
        </p>

        <div class="flex gap-2 flex-wrap">
          <button class={`inline-flex items-center gap-1 px-3 py-1.5 bg-transparent border rounded-md text-xs cursor-pointer transition-all ${liked ? "bg-accent border-accent text-white" : "border-border text-text-secondary hover:bg-secondary"}`} onClick={handleLike} title={i18next.t("comments.like", { defaultValue: "Like" })}>
            <span style={liked ? 'color: currentColor;' : ''}>{ICONS.like}</span>
            {(comment.likes || 0) + (liked ? 1 : 0)}
          </button>

          <button class={`inline-flex items-center gap-1 px-3 py-1.5 bg-transparent border rounded-md text-xs cursor-pointer transition-all ${disliked ? "bg-accent border-accent text-white" : "border-border text-text-secondary hover:bg-secondary"}`} onClick={handleDislike} title={i18next.t("comments.dislike", { defaultValue: "Dislike" })}>
            <span style={disliked ? 'color: currentColor;' : ''}>{ICONS.dislike}</span>
          </button>

          <button class={`inline-flex items-center gap-1 px-3 py-1.5 bg-transparent border rounded-md text-xs cursor-pointer transition-all ${showReply ? "bg-accent border-accent text-white" : "border-border text-text-secondary hover:bg-secondary"}`} onClick={handleReplyClick}>
            {ICONS.reply}
            {i18next.t("comments.reply", { defaultValue: "Reply" })}
            {comment.replies?.length ? <span class="opacity-60 text-[11px] -ml-0.5">{comment.replies.length}</span> : null}
          </button>
        </div>

        {showReply && (
          <div class="mt-3 flex flex-col gap-2">
            <textarea
              class="w-full min-h-[60px] p-2.5 border border-border rounded-lg bg-primary text-primary text-sm font-sans resize-y focus:outline-none focus:border-accent"
              value={replyText}
              onInput={(e) => setReplyText((e.target as HTMLTextAreaElement).value)}
              placeholder={i18next.t("comments.reply_placeholder", { defaultValue: "Write a reply..." })}
            />
            <div class="flex gap-2 justify-end">
              <button class="px-3.5 py-1.5 bg-secondary border border-border rounded-md text-sm text-primary cursor-pointer" onClick={() => setShowReply(false)}>
                {i18next.t("common.cancel", { defaultValue: "Cancel" })}
              </button>
              <button class="px-3.5 py-1.5 bg-accent border-none rounded-md text-sm text-white font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" disabled={!replyText.trim() || isPosting} onClick={submitReply}>
                {i18next.t("comments.reply", { defaultValue: "Reply" })}
              </button>
            </div>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div class="mt-3 pl-4 border-l-2 border-border">
            {comment.replies.map(reply => (
              <div class="flex gap-2.5 py-3">
                <CommentAvatar name={reply.display_name} size="sm" />
                <div class="flex-1 min-w-0">
                  <div class="flex gap-2 mb-1">
                    <span class="font-semibold text-xs text-primary">{reply.display_name}</span>
                    <span class="text-[11px] text-text-secondary">{relativeTime(reply.created_at)}</span>
                  </div>
                  <p class="text-xs leading-relaxed text-primary">{reply.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
import { h } from 'preact';
import { useState } from 'preact/hooks';
import { CommentAvatar } from "./comment-avatar";
import type { AuthUser } from "../../services/auth-store";
import i18next from "../../utils/i18n";

interface CommentComposeProps {
  user: AuthUser | null;
  posting?: boolean;
  onCommentSubmit?: (text: string, containsSpoilers: boolean) => void;
  onNeedLogin?: () => void;
}

export function CommentCompose({ user, posting = false, onCommentSubmit, onNeedLogin }: CommentComposeProps) {
  const [text, setText] = useState("");
  const [spoilers, setSpoilers] = useState(false);

  function submit() {
    if (!text.trim() || posting) return;
    if (onCommentSubmit) {
      onCommentSubmit(text.trim(), spoilers);
    }
    setText("");
    setSpoilers(false);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && e.ctrlKey) {
      submit();
    }
  }

  return (
    <div class="row">
      {user ? (
        <CommentAvatar name={user.display_name} size="md" />
      ) : (
        <div class="ghost-av">👤</div>
      )}

      {user ? (
        <div class="compose">
          <textarea
            placeholder={i18next.t("comments.body_placeholder", { defaultValue: "Share your thoughts…  (Ctrl+Enter to post)" })}
            value={text}
            onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
            onKeyDown={handleKeyDown}
          />
          <div class="footer">
            <label class={`spoiler-label ${spoilers ? "on" : ""}`}>
              <input
                type="checkbox"
                checked={spoilers}
                onChange={(e) => setSpoilers((e.target as HTMLInputElement).checked)}
              />
              {i18next.t("comments.contains_spoilers", { defaultValue: "Contains Spoilers" })}
            </label>
            <button class="btn-post" disabled={!text.trim() || posting} onClick={submit}>
              {posting
                ? i18next.t("comments.posting", { defaultValue: "Posting…" })
                : i18next.t("comments.post_button", { defaultValue: "Post" })
              }
            </button>
          </div>
        </div>
      ) : (
        <div class="gate">
          <div class="gate-copy">
            <strong>{i18next.t("comments.join_discussion", { defaultValue: "Join the conversation" })}</strong>
            {i18next.t("comments.login_required", { defaultValue: "Sign in to comment and interact with the community." })}
          </div>
          <button class="btn-signin" onClick={onNeedLogin}>
            {i18next.t("auth.sign_in", { defaultValue: "Sign In" })}
          </button>
        </div>
      )}
    </div>
  );
}
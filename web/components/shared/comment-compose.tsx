import { h } from 'preact';
import { useState } from 'preact/hooks';
import { CommentAvatar } from "./comment-avatar";
import type { AuthUser } from "../../services/auth-store";
import i18next from "../../utils/i18n";
import styles from './comment-compose.module.css';

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
    <div class={styles.row}>
      {user ? (
        <CommentAvatar name={user.display_name} size="md" />
      ) : (
        <div class={styles.ghostAv}>👤</div>
      )}

      {user ? (
        <div class={styles.compose}>
          <textarea
            placeholder={i18next.t("comments.body_placeholder", { defaultValue: "Share your thoughts…  (Ctrl+Enter to post)" })}
            value={text}
            onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
            onKeyDown={handleKeyDown}
          />
          <div class={styles.footer}>
            <label class={`${styles.spoilerLabel} ${spoilers ? styles.on : ""}`}>
              <input
                type="checkbox"
                checked={spoilers}
                onChange={(e) => setSpoilers((e.target as HTMLInputElement).checked)}
              />
              {i18next.t("comments.contains_spoilers", { defaultValue: "Contains Spoilers" })}
            </label>
            <button class={styles.btnPost} disabled={!text.trim() || posting} onClick={submit}>
              {posting
                ? i18next.t("comments.posting", { defaultValue: "Posting…" })
                : i18next.t("comments.post_button", { defaultValue: "Post" })
              }
            </button>
          </div>
        </div>
      ) : (
        <div class={styles.gate}>
          <div class={styles.gateCopy}>
            <strong>{i18next.t("comments.join_discussion", { defaultValue: "Join the conversation" })}</strong>
            {i18next.t("comments.login_required", { defaultValue: "Sign in to comment and interact with the community." })}
          </div>
          <button class={styles.btnSignin} onClick={onNeedLogin}>
            {i18next.t("auth.sign_in", { defaultValue: "Sign In" })}
          </button>
        </div>
      )}
    </div>
  );
}
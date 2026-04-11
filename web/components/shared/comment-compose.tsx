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
    <div class="flex gap-4 items-start mb-6">
      {user ? (
        <CommentAvatar name={user.display_name} size="md" />
      ) : (
        <div class="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg shrink-0">👤</div>
      )}

      {user ? (
        <div class="flex-1 flex flex-col gap-3">
          <textarea
            class="w-full min-h-[80px] p-3 border border-border rounded-xl bg-primary text-primary text-sm font-sans resize-y focus:outline-none focus:border-accent"
            placeholder={i18next.t("comments.body_placeholder", { defaultValue: "Share your thoughts…  (Ctrl+Enter to post)" })}
            value={text}
            onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
            onKeyDown={handleKeyDown}
          />
          <div class="flex justify-between items-center">
            <label class={`flex items-center gap-2 text-sm cursor-pointer select-none transition-colors ${spoilers ? "text-accent" : "text-text-secondary"}`}>
              <input
                class="w-auto m-0"
                type="checkbox"
                checked={spoilers}
                onChange={(e) => setSpoilers((e.target as HTMLInputElement).checked)}
              />
              {i18next.t("comments.contains_spoilers", { defaultValue: "Contains Spoilers" })}
            </label>
            <button class="px-5 py-2.5 bg-accent text-white border-none rounded-lg font-semibold text-sm cursor-pointer transition-all hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed" disabled={!text.trim() || posting} onClick={submit}>
              {posting
                ? i18next.t("comments.posting", { defaultValue: "Posting…" })
                : i18next.t("comments.post_button", { defaultValue: "Post" })
              }
            </button>
          </div>
        </div>
      ) : (
        <div class="flex-1 flex flex-col gap-3 p-4 bg-secondary rounded-xl">
          <div class="flex flex-col gap-1 text-sm text-text-secondary">
            <strong class="text-primary text-base">{i18next.t("comments.join_discussion", { defaultValue: "Join the conversation" })}</strong>
            {i18next.t("comments.login_required", { defaultValue: "Sign in to comment and interact with the community." })}
          </div>
          <button class="self-start px-5 py-2.5 bg-accent text-white border-none rounded-lg font-semibold text-sm cursor-pointer hover:bg-accent-hover transition-all" onClick={onNeedLogin}>
            {i18next.t("auth.sign_in", { defaultValue: "Sign In" })}
          </button>
        </div>
      )}
    </div>
  );
}
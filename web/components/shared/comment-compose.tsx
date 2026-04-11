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
    <div class="flex gap-4 items-start mb-10">
      {user ? (
        <CommentAvatar name={user.display_name} size="md" />
      ) : (
        <div class="w-12 h-12 rounded-2xl bg-base-200 border border-base-content/5 flex items-center justify-center text-xl shrink-0 shadow-sm">👤</div>
      )}

      {user ? (
        <div class="flex-1 flex flex-col gap-4">
          <textarea
            class="textarea textarea-bordered w-full min-h-[100px] p-4 bg-base-200 border-base-content/10 rounded-2xl text-base-content text-sm font-medium resize-y focus:outline-none focus:border-primary transition-all shadow-inner"
            placeholder={i18next.t("comments.body_placeholder", { defaultValue: "Share your thoughts… (Ctrl+Enter to post)" })}
            value={text}
            onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
            onKeyDown={handleKeyDown}
          />
          <div class="flex justify-between items-center px-1">
            <label class="label cursor-pointer gap-3 group">
              <input
                type="checkbox"
                class="checkbox checkbox-primary checkbox-xs rounded-md transition-all group-hover:scale-110"
                checked={spoilers}
                onChange={(e) => setSpoilers((e.target as HTMLInputElement).checked)}
              />
              <span class={`label-text text-[10px] font-black uppercase tracking-widest transition-colors ${spoilers ? "text-primary" : "opacity-40"}`}>
                {i18next.t("comments.contains_spoilers", { defaultValue: "Contains Spoilers" })}
              </span>
            </label>
            <button 
              class="btn btn-primary btn-sm px-8 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all" 
              disabled={!text.trim() || posting} 
              onClick={submit}
            >
              {posting
                ? i18next.t("comments.posting", { defaultValue: "Posting…" })
                : i18next.t("comments.post_button", { defaultValue: "Post" })
              }
            </button>
          </div>
        </div>
      ) : (
        <div class="flex-1 flex flex-col gap-4 p-6 bg-base-200 border border-base-content/5 rounded-2xl shadow-sm">
          <div class="flex flex-col gap-1">
            <strong class="text-base-content text-lg font-black tracking-tight">{i18next.t("comments.join_discussion", { defaultValue: "Join the conversation" })}</strong>
            <p class="text-sm text-base-content/40 font-medium leading-relaxed">
              {i18next.t("comments.login_required", { defaultValue: "Sign in to comment and interact with the community." })}
            </p>
          </div>
          <button class="btn btn-primary btn-sm px-8 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all self-start" onClick={onNeedLogin}>
            {i18next.t("auth.sign_in", { defaultValue: "Sign In" })}
          </button>
        </div>
      )}
    </div>
  );
}
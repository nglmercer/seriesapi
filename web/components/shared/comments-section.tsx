import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { CommentCompose } from "./comment-compose";
import { CommentItem } from "./comment-item";
import { AuthModal } from "./AuthModal";
import { useAuth } from "../../contexts/auth-context";
import { mediaService } from "../../services/media-service";
import { api } from "../../services/api-service";
import i18next from "../../utils/i18n";
import type { CommentData } from "./comment-item";
import { Modal } from "./Modal";

interface CommentsSectionProps {
  entityType?: string;
  entityId?: number;
}

export function CommentsSection({ entityType = "", entityId = 0 }: CommentsSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [postingReply, setPostingReply] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (entityType && entityId) {
      fetchComments();
    }
  }, [entityType, entityId, page]);

  async function fetchComments(append = false) {
    if (!entityType || !entityId) return;
    if (!append) setLoading(true);

    const res = entityType === 'media'
      ? await mediaService.fetchMediaComments(entityId, page)
      : await mediaService.fetchEpisodeComments(entityId, page);

    if (res) {
      const rows: CommentData[] = Array.isArray(res.comments) ? res.comments : [];
      setTotal(res.total || rows.length);
      setComments(append ? [...comments, ...rows] : rows);
    }
    setLoading(false);
  }

  async function handleCommentSubmit(text: string, containsSpoilers: boolean) {
    if (!user) return;
    setPosting(true);

    const res = await api.postComment({
      entity_type: entityType,
      entity_id: entityId,
      display_name: user.display_name,
      body: text,
      contains_spoilers: containsSpoilers,
    });

    if (res.ok) {
      setPage(1);
      await fetchComments();
    }
    setPosting(false);
  }

  async function handleReplySubmit(parentId: number, text: string) {
    if (!user) return;
    setPostingReply(true);

    await api.postComment({
      entity_type: entityType,
      entity_id: entityId,
      display_name: user.display_name,
      body: text,
      parent_id: parentId,
    });

    setPage(1);
    await fetchComments();
    setPostingReply(false);
  }

  function handleNeedLogin() {
    setShowAuth(true);
  }

  function onAuthClose() {
    setShowAuth(false);
  }

  const remaining = total - comments.length;

  return (
    <div class="mt-8">
      {showAuth ? <AuthModal onAuthClose={onAuthClose} /> : null}

      <div class="flex items-center gap-3 mb-5">
        <h3 class="text-xl font-bold text-primary">{i18next.t("comments.title", { defaultValue: "Community" })}</h3>
        {total > 0 ? <span class="px-2.5 py-1 bg-secondary border border-border rounded-full text-xs font-semibold text-text-secondary">{total}</span> : null}
      </div>

      <CommentCompose
        user={user}
        posting={posting}
        onCommentSubmit={handleCommentSubmit}
        onNeedLogin={handleNeedLogin}
      />

      <div class="flex flex-col">
        {loading ? (
          <div class="flex flex-col items-center p-10 text-center">
            <div class="text-4xl mb-3 opacity-50">💬</div>
            <p class="text-text-secondary text-sm">{i18next.t("common.loading", { defaultValue: "Loading…" })}</p>
          </div>
        ) : comments.length === 0 ? (
          <div class="flex flex-col items-center p-10 text-center">
            <div class="text-4xl mb-3 opacity-50">💬</div>
            <p class="text-text-secondary text-sm">{i18next.t("comments.empty", { defaultValue: "No comments yet. Be the first!" })}</p>
          </div>
        ) : (
          comments.map(c => (
            <CommentItem
              key={c.id}
              comment={c}
              isLoggedIn={user !== null}
              isPosting={postingReply}
              onReplySubmit={handleReplySubmit}
              onNeedLogin={handleNeedLogin}
            />
          ))
        )}
      </div>

      {remaining > 0 && (
        <div class="flex justify-center py-4">
          <button class="px-6 py-2.5 bg-secondary border border-border rounded-lg text-sm text-primary cursor-pointer transition-all hover:bg-accent hover:border-accent hover:text-white" onClick={() => setPage(page + 1)}>
            {i18next.t("comments.load_more", { defaultValue: "Load more" })} ({remaining})
          </button>
        </div>
      )}
    </div>
  );
}
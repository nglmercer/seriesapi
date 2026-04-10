import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { CommentCompose } from "./comment-compose";
import { CommentItem } from "./comment-item";
import { AuthModal } from "./AuthModal";
import { authStore, type AuthUser } from "../../services/auth-store";
import { mediaService } from "../../services/media-service";
import { api } from "../../services/api-service";
import i18next from "../../utils/i18n";
import type { CommentData } from "./comment-item";

interface CommentsSectionProps {
  entityType?: string;
  entityId?: number;
}

export function CommentsSection({ entityType = "", entityId = 0 }: CommentsSectionProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [postingReply, setPostingReply] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    setUser(authStore.user);
    const unsub = authStore.subscribe(u => setUser(u));
    authStore.init().then(() => setUser(authStore.user));
    return () => unsub();
  }, []);

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
    setUser(authStore.user);
  }

  const remaining = total - comments.length;

  return (
    <div class="section">
      {showAuth && <AuthModal onAuthClose={onAuthClose} />}

      <div class="head">
        <h3>{i18next.t("comments.title", { defaultValue: "Community" })}</h3>
        {total > 0 ? <span class="badge">{total}</span> : null}
      </div>

      <CommentCompose
        user={user}
        posting={posting}
        onCommentSubmit={handleCommentSubmit}
        onNeedLogin={handleNeedLogin}
      />

      <div class="list">
        {loading ? (
          <div class="empty">
            <div class="empty-icon">💬</div>
            <p>{i18next.t("common.loading", { defaultValue: "Loading…" })}</p>
          </div>
        ) : comments.length === 0 ? (
          <div class="empty">
            <div class="empty-icon">💬</div>
            <p>{i18next.t("comments.empty", { defaultValue: "No comments yet. Be the first!" })}</p>
          </div>
        ) : (
          comments.map(c => (
            <CommentItem
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
        <div class="load-more">
          <button class="btn-more" onClick={() => setPage(page + 1)}>
            {i18next.t("comments.load_more", { defaultValue: "Load more" })} ({remaining})
          </button>
        </div>
      )}
    </div>
  );
}
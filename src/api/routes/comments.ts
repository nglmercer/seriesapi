/**
 * /api/v1/comments  –  Comment submission (POST only)
 *
 * POST /api/v1/comments
 *   Body (JSON):
 *     { entity_type, entity_id, body, locale?, contains_spoilers?, parent_id? }
 *
 * Auth required. display_name is taken from authenticated user.
 *
 * GET /api/v1/comments/:id  – single comment thread
 */

import { serverError } from "../response";
import { CommentController } from "../controllers/comment.controller";
import { CommentView } from "../views/comment.view";
import { withAuth } from "./auth";
import { ApiContext } from "../context";

export const handleCommentPost = withAuth(async (ctx: ApiContext, user) => {
  try {
    const result = await CommentController.createComment(ctx, user);
    if (result.error) return result.error;

    return ctx.ok(CommentView.formatCreated(result.data), { locale: result.locale }, 201);
  } catch (err) {
    return serverError(err, ctx.locale);
  }
});

export function handleCommentGet(ctx: ApiContext, id: number): Response {
  try {
    const { comment, locale } = CommentController.getComment(ctx, id);
    if (!comment) return ctx.notFound("Comment");

    return ctx.ok(CommentView.formatDetail(comment), { locale });
  } catch (err) {
    return serverError(err, ctx.locale);
  }
}

export const handleUserComments = withAuth(async (ctx: ApiContext, user) => {
  try {
    const { drizzle, locale, pagination } = ctx;
    const { limit, offset, page } = pagination;

    const results = drizzle.query(`
      SELECT c.id, c.entity_type, c.entity_id, c.parent_id, c.body, c.contains_spoilers, c.created_at,
             CASE 
               WHEN c.entity_type = 'media' THEN (SELECT title FROM media_translations mt WHERE mt.media_id = c.entity_id AND mt.locale = ?)
               WHEN c.entity_type = 'season' THEN (SELECT name FROM season_translations st WHERE st.season_id = c.entity_id AND st.locale = ?)
               WHEN c.entity_type = 'episode' THEN (SELECT title FROM episode_translations et WHERE et.episode_id = c.entity_id AND et.locale = ?)
               ELSE NULL
             END as title
      FROM comments c
      WHERE c.display_name = ?
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `).all([locale, locale, locale, user.username, limit, offset]);

    const total = drizzle.query<{ count: number }>(
      "SELECT count(id) as count FROM comments WHERE display_name = ?"
    ).get([user.username])?.count || 0;

    return ctx.ok(results, { total, page, pageSize: limit });
  } catch (err) {
    return serverError(err, ctx.locale);
  }
});

export function handleCommentUpdate(ctx: ApiContext, id: number) {
  return withAuth(async (ctx, user) => {
    try {
      const result = await CommentController.updateComment(ctx, id, user);
      if (result.error) return result.error;

      return ctx.ok(CommentView.formatDetail(result.data), { locale: result.locale });
    } catch (err) {
      return serverError(err, ctx.locale);
    }
  })(ctx);
}

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

import type { Database } from "sqlite-napi";
import { ok, notFound, serverError } from "../response";
import { CommentController } from "../controllers/comment.controller";
import { CommentView } from "../views/comment.view";
import { withAuth } from "./auth";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../i18n";
import { getDrizzle } from "../../init";

export const handleCommentPost = withAuth(async (req: Request, user) => {
  try {
    const result = await CommentController.createComment(req, user);
    if (result.error) return result.error;

    return ok(CommentView.formatCreated(result.data), { locale: result.locale }, 201);
  } catch (err) {
    return serverError(err, "en");
  }
});

export function handleCommentGet(req: Request, _db: Database, id: number): Response {
  try {
    const { comment, locale } = CommentController.getComment(req, id);
    if (!comment) return notFound("Comment", locale);
    
    return ok(CommentView.formatDetail(comment), { locale });
  } catch (err) {
    return serverError(err, "en");
  }
}

export const handleUserComments = withAuth(async (req: Request, user) => {
  try {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const offset = (page - 1) * limit;

    const drizzle = getDrizzle();

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

    return ok(results, { locale, total, page, pageSize: limit });
  } catch (err) {
    return serverError(err, getLocaleFromRequest(req, SUPPORTED_LOCALES));
  }
});

/**
 * /api/v1/comments  –  Public comment submission (POST only)
 *
 * POST /api/v1/comments
 *   Body (JSON):
 *     { entity_type, entity_id, display_name, body, locale?,
 *       contains_spoilers?, parent_id? }
 *
 * No auth required.  IP is hashed before storage.
 * Minimal validation; heavy moderation is out of scope for this layer.
 *
 * GET /api/v1/comments/:id  – single comment thread
 */

import type { Database } from "sqlite-napi";
import { ok, notFound, serverError } from "../response";
import { CommentController } from "../controllers/comment.controller";
import { CommentView } from "../views/comment.view";
import { withAuth } from "./auth";

export const handleCommentPost = withAuth(async (req: Request, user) => {
  try {
    const result = await CommentController.createComment(req);
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

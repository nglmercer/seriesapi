/**
 * /api/v1/episodes/:id  –  Episode-level routes
 *
 * GET  /api/v1/episodes/:id           – episode detail
 * GET  /api/v1/episodes/:id/credits   – guest cast & crew for this episode
 * GET  /api/v1/episodes/:id/images    – stills / thumbnails
 * GET  /api/v1/episodes/:id/comments  – threaded comments
 */

import type { Database } from "sqlite-napi";
import { ok, notFound, serverError, parsePagination } from "../response";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../i18n";

export function handleEpisodeDetail(req: Request, db: Database, id: number): Response {
  try {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);

    const row = db
      .query(
        `SELECT
          e.id, e.media_id, e.season_id, e.episode_number,
          e.absolute_number, e.episode_type, e.air_date,
          e.runtime_minutes, e.score, e.score_count, e.external_ids,
          s.season_number,
          COALESCE(et.title, 'Episode ' || e.episode_number) AS title,
          et.synopsis,
          (SELECT url FROM images
           WHERE entity_type='episode' AND entity_id=e.id
             AND image_type='still' AND is_primary=1 LIMIT 1) AS still_url
         FROM episodes e
         LEFT JOIN seasons s ON s.id = e.season_id
         LEFT JOIN episode_translations et ON et.episode_id = e.id AND et.locale = ?
         WHERE e.id = ?`,
      )
      .get([locale, id]);

    if (!row) return notFound("Episode", locale);
    return ok(row, { locale });
  } catch (err) {
    return serverError(err, "en");
  }
}

export function handleEpisodeCredits(req: Request, db: Database, episodeId: number): Response {
  try {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);

    const rows = db
      .query(
        `SELECT p.id, p.name, ec.credit_type, ec.role_name,
                (SELECT url FROM images
                 WHERE entity_type='person' AND entity_id=p.id
                   AND image_type='profile' AND is_primary=1 LIMIT 1) AS profile_url
         FROM episode_credits ec
         JOIN people p ON p.id = ec.person_id
         WHERE ec.episode_id = ?
         ORDER BY ec.credit_type ASC`,
      )
      .all([episodeId]);

    return ok(rows, { locale, total: (rows as unknown[]).length });
  } catch (err) {
    return serverError(err, "en");
  }
}

export function handleEpisodeImages(req: Request, db: Database, episodeId: number): Response {
  try {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);

    const rows = db
      .query(
        `SELECT id, image_type, locale, url, width, height, is_primary, vote_average
         FROM images
         WHERE entity_type = 'episode' AND entity_id = ?
         ORDER BY is_primary DESC, vote_average DESC`,
      )
      .all([episodeId]);

    return ok(rows, { locale, total: (rows as unknown[]).length });
  } catch (err) {
    return serverError(err, "en");
  }
}

export function handleEpisodeComments(req: Request, db: Database, episodeId: number): Response {
  try {
    const url = new URL(req.url);
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const { page, pageSize, offset } = parsePagination(url);

    const total = (
      db
        .query(
          `SELECT COUNT(*) as c FROM comments
           WHERE entity_type='episode' AND entity_id=? AND is_hidden=0 AND parent_id IS NULL`,
        )
        .get([episodeId]) as { c: number }
    ).c;

    const rows = db
      .query(
        `SELECT
          c.id, c.parent_id, c.display_name, c.locale,
          c.body, c.contains_spoilers, c.likes, c.dislikes, c.created_at,
          (SELECT JSON_GROUP_ARRAY(JSON_OBJECT(
             'id', r.id, 'display_name', r.display_name,
             'body', r.body, 'likes', r.likes, 'created_at', r.created_at
           )) FROM comments r
           WHERE r.parent_id = c.id AND r.is_hidden = 0) AS replies
         FROM comments c
         WHERE c.entity_type='episode' AND c.entity_id=?
           AND c.is_hidden=0 AND c.parent_id IS NULL
         ORDER BY c.likes DESC, c.created_at DESC
         LIMIT ? OFFSET ?`,
      )
      .all([episodeId, pageSize, offset]);

    return ok(rows, { locale, page, pageSize, total });
  } catch (err) {
    return serverError(err, "en");
  }
}

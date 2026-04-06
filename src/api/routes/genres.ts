/**
 * /api/v1/genres  –  Genre routes
 *
 * GET  /api/v1/genres          – full list (localized)
 * GET  /api/v1/genres/:slug    – genre detail + paginated media
 */

import type { Database } from "sqlite-napi";
import { ok, notFound, serverError, parsePagination } from "../response";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../i18n";

export function handleGenresList(req: Request, db: Database): Response {
  try {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);

    const rows = db
      .query(
        `SELECT g.id, g.slug, g.image_url,
                COALESCE(gt.name, g.slug) AS name
         FROM genres g
         LEFT JOIN genre_translations gt ON gt.genre_id = g.id AND gt.locale = ?
         ORDER BY name ASC`,
      )
      .all([locale]);

    return ok(rows, { locale, total: (rows as unknown[]).length });
  } catch (err) {
    return serverError(err, "en");
  }
}

export function handleGenreMedia(req: Request, db: Database, slug: string): Response {
  try {
    const url = new URL(req.url);
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const { page, pageSize, offset } = parsePagination(url);
    const type = url.searchParams.get("type");

    const genre = db
      .query(
        `SELECT g.id, g.slug, COALESCE(gt.name, g.slug) AS name
         FROM genres g
         LEFT JOIN genre_translations gt ON gt.genre_id = g.id AND gt.locale = ?
         WHERE g.slug = ?`,
      )
      .get([locale, slug]) as { id: number; slug: string; name: string } | undefined;

    if (!genre) return notFound("Genre", locale);

    const typeFilter = type ? "AND ct.slug = ?" : "";
    const typeParams = type ? [type] : [];

    const total = (
      db
        .query(
          `SELECT COUNT(*) as c FROM media_genres mg
           JOIN media m ON m.id = mg.media_id
           JOIN content_types ct ON ct.id = m.content_type_id
           WHERE mg.genre_id = ? ${typeFilter}`,
        )
        .get([genre.id, ...typeParams]) as { c: number }
    ).c;

    const rows = db
      .query(
        `SELECT
          m.id, m.slug, ct.slug AS content_type,
          m.original_title, m.status, m.release_date,
          m.score, m.popularity,
          COALESCE(mt.title, m.original_title) AS title,
          mt.synopsis_short,
          (SELECT url FROM images
           WHERE entity_type='media' AND entity_id=m.id
             AND image_type='poster' AND is_primary=1 LIMIT 1) AS poster_url
         FROM media_genres mg
         JOIN media m ON m.id = mg.media_id
         JOIN content_types ct ON ct.id = m.content_type_id
         LEFT JOIN media_translations mt ON mt.media_id = m.id AND mt.locale = ?
         WHERE mg.genre_id = ? ${typeFilter}
         ORDER BY m.popularity DESC
         LIMIT ? OFFSET ?`,
      )
      .all([locale, genre.id, ...typeParams, pageSize, offset]);

    return ok({ genre, items: rows }, { locale, page, pageSize, total });
  } catch (err) {
    return serverError(err, "en");
  }
}

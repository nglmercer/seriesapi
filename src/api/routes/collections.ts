/**
 * /api/v1/collections  –  Franchise / collection routes
 *
 * GET  /api/v1/collections            – all collections (paginated)
 * GET  /api/v1/collections/:slug      – collection detail + ordered media
 */

import type { Database } from "sqlite-napi";
import { ok, notFound, serverError, parsePagination } from "../response";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../i18n";

export function handleCollectionsList(req: Request, db: Database): Response {
  try {
    const url = new URL(req.url);
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const { page, pageSize, offset } = parsePagination(url);

    const total = (
      db.query("SELECT COUNT(*) as c FROM collections").get([]) as { c: number }
    ).c;

    const rows = db
      .query(
        `SELECT c.id, c.slug,
                COALESCE(ct.name, c.slug) AS name,
                ct.overview,
                (SELECT url FROM images
                 WHERE entity_type='collection' AND entity_id=c.id
                   AND image_type='backdrop' AND is_primary=1 LIMIT 1) AS backdrop_url,
                (SELECT url FROM images
                 WHERE entity_type='collection' AND entity_id=c.id
                   AND image_type='poster' AND is_primary=1 LIMIT 1) AS poster_url,
                (SELECT COUNT(*) FROM collection_items ci WHERE ci.collection_id = c.id) AS item_count
         FROM collections c
         LEFT JOIN collection_translations ct ON ct.collection_id = c.id AND ct.locale = ?
         ORDER BY name ASC
         LIMIT ? OFFSET ?`,
      )
      .all([locale, pageSize, offset]);

    return ok(rows, { locale, page, pageSize, total });
  } catch (err) {
    return serverError(err, "en");
  }
}

export function handleCollectionDetail(req: Request, db: Database, slug: string): Response {
  try {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);

    const collection = db
      .query(
        `SELECT c.id, c.slug,
                COALESCE(ct.name, c.slug) AS name,
                ct.overview,
                (SELECT url FROM images
                 WHERE entity_type='collection' AND entity_id=c.id
                   AND image_type='backdrop' AND is_primary=1 LIMIT 1) AS backdrop_url,
                (SELECT url FROM images
                 WHERE entity_type='collection' AND entity_id=c.id
                   AND image_type='poster' AND is_primary=1 LIMIT 1) AS poster_url
         FROM collections c
         LEFT JOIN collection_translations ct ON ct.collection_id = c.id AND ct.locale = ?
         WHERE c.slug = ?`,
      )
      .get([locale, slug]) as
      | { id: number; slug: string; name: string; overview: string | null }
      | undefined;

    if (!collection) return notFound("Collection", locale);

    const items = db
      .query(
        `SELECT
          ci.order,
          m.id, m.slug, ct2.slug AS content_type,
          m.original_title, m.status, m.release_date, m.score,
          COALESCE(mt.title, m.original_title) AS title,
          mt.synopsis_short,
          (SELECT url FROM images
           WHERE entity_type='media' AND entity_id=m.id
             AND image_type='poster' AND is_primary=1 LIMIT 1) AS poster_url
         FROM collection_items ci
         JOIN media m ON m.id = ci.media_id
         JOIN content_types ct2 ON ct2.id = m.content_type_id
         LEFT JOIN media_translations mt ON mt.media_id = m.id AND mt.locale = ?
         WHERE ci.collection_id = ?
         ORDER BY ci.order ASC`,
      )
      .all([locale, collection.id]);

    return ok({ ...collection, items }, { locale, total: (items as unknown[]).length });
  } catch (err) {
    return serverError(err, "en");
  }
}

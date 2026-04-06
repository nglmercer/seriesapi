/**
 * /api/v1/search  –  Cross-entity full-text search
 *
 * GET  /api/v1/search?q=...&type=media|person|collection&...
 *
 * Matches against:
 *   - media.original_title + media_translations.title
 *   - people.name + people_translations.name
 *   - collections via collection_translations.name
 *
 * Returns a unified result list with an entity_type discriminator.
 */

import type { Database } from "sqlite-napi";
import { ok, badRequest, serverError, parsePagination } from "../response";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../i18n";

type SearchEntityType = "media" | "person" | "collection";

export function handleSearch(req: Request, db: Database): Response {
  try {
    const url = new URL(req.url);
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const { page, pageSize, offset } = parsePagination(url);

    const q = url.searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
      return badRequest("Query param 'q' must be at least 2 characters.", locale);
    }

    const entityTypes = new Set<SearchEntityType>(["media", "person", "collection"]);
    const typeParam = url.searchParams.get("type") as SearchEntityType | null;
    const activeTypes: SearchEntityType[] =
      typeParam && entityTypes.has(typeParam) ? [typeParam] : [...entityTypes];

    const like = `%${q}%`;
    const results: unknown[] = [];

    // ── media ─────────────────────────────────────────────────────────────────
    if (activeTypes.includes("media")) {
      const rows = db
        .query(
          `SELECT DISTINCT
            'media' AS entity_type,
            m.id, m.slug, ct.slug AS content_type,
            COALESCE(mt.title, m.original_title) AS title,
            mt.synopsis_short AS description,
            m.score, m.release_date,
            (SELECT url FROM images
             WHERE entity_type='media' AND entity_id=m.id
               AND image_type='poster' AND is_primary=1 LIMIT 1) AS image_url
           FROM media m
           JOIN content_types ct ON ct.id = m.content_type_id
           LEFT JOIN media_translations mt ON mt.media_id = m.id AND mt.locale = ?
           WHERE m.original_title LIKE ? OR mt.title LIKE ?
           ORDER BY m.popularity DESC
           LIMIT ? OFFSET ?`,
        )
        .all([locale, like, like, pageSize, offset]);
      results.push(...(rows as unknown[]));
    }

    // ── people ────────────────────────────────────────────────────────────────
    if (activeTypes.includes("person")) {
      const rows = db
        .query(
          `SELECT DISTINCT
            'person' AS entity_type,
            p.id, p.name AS slug,
            COALESCE(pt.name, p.name) AS title,
            pt.biography AS description,
            NULL AS score, p.birth_date AS release_date,
            (SELECT url FROM images
             WHERE entity_type='person' AND entity_id=p.id
               AND image_type='profile' AND is_primary=1 LIMIT 1) AS image_url
           FROM people p
           LEFT JOIN people_translations pt ON pt.person_id = p.id AND pt.locale = ?
           WHERE p.name LIKE ? OR pt.name LIKE ?
           ORDER BY p.name ASC
           LIMIT ? OFFSET ?`,
        )
        .all([locale, like, like, pageSize, offset]);
      results.push(...(rows as unknown[]));
    }

    // ── collections ───────────────────────────────────────────────────────────
    if (activeTypes.includes("collection")) {
      const rows = db
        .query(
          `SELECT DISTINCT
            'collection' AS entity_type,
            c.id, c.slug,
            COALESCE(ct.name, c.slug) AS title,
            ct.overview AS description,
            NULL AS score, NULL AS release_date,
            (SELECT url FROM images
             WHERE entity_type='collection' AND entity_id=c.id
               AND image_type='poster' AND is_primary=1 LIMIT 1) AS image_url
           FROM collections c
           LEFT JOIN collection_translations ct ON ct.collection_id = c.id AND ct.locale = ?
           WHERE ct.name LIKE ? OR c.slug LIKE ?
           ORDER BY c.slug ASC
           LIMIT ? OFFSET ?`,
        )
        .all([locale, like, like, pageSize, offset]);
      results.push(...(rows as unknown[]));
    }

    return ok(results, { locale, page, pageSize, total: results.length, query: q });
  } catch (err) {
    return serverError(err, "en");
  }
}

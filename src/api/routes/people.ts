/**
 * /api/v1/people  –  Cast & crew routes
 *
 * GET  /api/v1/people                 – paginated list
 * GET  /api/v1/people/:id             – person detail + localized bio
 * GET  /api/v1/people/:id/credits     – all media they appear in
 */

import type { Database } from "sqlite-napi";
import { ok, notFound, serverError, parsePagination } from "../response";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../i18n";

export function handlePeopleList(req: Request, db: Database): Response {
  try {
    const url = new URL(req.url);
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const { page, pageSize, offset } = parsePagination(url);
    const search = url.searchParams.get("q");

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (search) {
      conditions.push("(p.name LIKE ? OR pt.name LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const total = (
      db
        .query(
          `SELECT COUNT(DISTINCT p.id) as c
           FROM people p
           LEFT JOIN people_translations pt ON pt.person_id = p.id AND pt.locale = ?
           ${where}`,
        )
        .get([locale, ...params]) as { c: number }
    ).c;

    const rows = db
      .query(
        `SELECT DISTINCT
          p.id, p.name, p.birth_date, p.birth_country, p.gender,
          COALESCE(pt.name, p.name) AS display_name,
          (SELECT url FROM images
           WHERE entity_type='person' AND entity_id=p.id
             AND image_type='profile' AND is_primary=1 LIMIT 1) AS profile_url
         FROM people p
         LEFT JOIN people_translations pt ON pt.person_id = p.id AND pt.locale = ?
         ${where}
         ORDER BY p.name ASC
         LIMIT ? OFFSET ?`,
      )
      .all([locale, ...params, pageSize, offset]);

    return ok(rows, { locale, page, pageSize, total });
  } catch (err) {
    return serverError(err, "en");
  }
}

export function handlePersonDetail(req: Request, db: Database, id: number): Response {
  try {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);

    const row = db
      .query(
        `SELECT
          p.id, p.birth_date, p.death_date, p.birth_country, p.gender,
          p.also_known_as, p.external_ids,
          COALESCE(pt.name, p.name) AS name,
          pt.biography,
          (SELECT url FROM images
           WHERE entity_type='person' AND entity_id=p.id
             AND image_type='profile' AND is_primary=1 LIMIT 1) AS profile_url
         FROM people p
         LEFT JOIN people_translations pt ON pt.person_id = p.id AND pt.locale = ?
         WHERE p.id = ?`,
      )
      .get([locale, id]);

    if (!row) return notFound("Person", locale);
    return ok(row, { locale });
  } catch (err) {
    return serverError(err, "en");
  }
}

export function handlePersonCredits(req: Request, db: Database, personId: number): Response {
  try {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);

    const rows = db
      .query(
        `SELECT
          c.credit_type, c.role_name, c.department, c.job, c."order" AS billing_order,
          m.id AS media_id, m.slug, ct.slug AS content_type,
          COALESCE(mt.title, m.original_title) AS title,
          m.score, m.release_date,
          (SELECT url FROM images
           WHERE entity_type='media' AND entity_id=m.id
             AND image_type='poster' AND is_primary=1 LIMIT 1) AS poster_url
         FROM credits c
         JOIN media m ON m.id = c.media_id
         JOIN content_types ct ON ct.id = m.content_type_id
         LEFT JOIN media_translations mt ON mt.media_id = m.id AND mt.locale = ?
         WHERE c.person_id = ?
         ORDER BY m.release_date DESC NULLS LAST`,
      )
      .all([locale, personId]);

    return ok(rows, { locale, total: (rows as unknown[]).length });
  } catch (err) {
    return serverError(err, "en");
  }
}

/**
 * /api/v1/seasons/:id  –  Season-level routes
 *
 * GET  /api/v1/seasons/:id            – season detail
 * GET  /api/v1/seasons/:id/episodes   – episodes in season
 * GET  /api/v1/seasons/:id/images     – season images
 */

import type { Database } from "sqlite-napi";
import { ok, notFound, serverError, parsePagination } from "../response";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../i18n";

export function handleSeasonDetail(req: Request, db: Database, id: number): Response {
  try {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);

    const row = db
      .query(
        `SELECT
          s.id, s.media_id, s.season_number, s.episode_count,
          s.air_date, s.end_date, s.score, s.score_count, s.external_ids,
          COALESCE(st.name, 'Season ' || s.season_number) AS name,
          st.synopsis,
          (SELECT url FROM images
           WHERE entity_type='season' AND entity_id=s.id
             AND image_type='poster' AND is_primary=1 LIMIT 1) AS poster_url
         FROM seasons s
         LEFT JOIN season_translations st ON st.season_id = s.id AND st.locale = ?
         WHERE s.id = ?`,
      )
      .get([locale, id]);

    if (!row) return notFound("Season", locale);
    return ok(row, { locale });
  } catch (err) {
    return serverError(err, "en");
  }
}

export function handleSeasonEpisodes(req: Request, db: Database, seasonId: number): Response {
  try {
    const url = new URL(req.url);
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const { page, pageSize, offset } = parsePagination(url);

    const total = (
      db
        .query(`SELECT COUNT(*) as c FROM episodes WHERE season_id = ?`)
        .get([seasonId]) as { c: number }
    ).c;

    const rows = db
      .query(
        `SELECT
          e.id, e.episode_number, e.absolute_number, e.episode_type,
          e.air_date, e.runtime_minutes, e.score,
          COALESCE(et.title, 'Episode ' || e.episode_number) AS title,
          et.synopsis,
          (SELECT url FROM images
           WHERE entity_type='episode' AND entity_id=e.id
             AND image_type='still' AND is_primary=1 LIMIT 1) AS still_url
         FROM episodes e
         LEFT JOIN episode_translations et ON et.episode_id = e.id AND et.locale = ?
         WHERE e.season_id = ?
         ORDER BY e.episode_number ASC
         LIMIT ? OFFSET ?`,
      )
      .all([locale, seasonId, pageSize, offset]);

    return ok(rows, { locale, page, pageSize, total });
  } catch (err) {
    return serverError(err, "en");
  }
}

export function handleSeasonImages(req: Request, db: Database, seasonId: number): Response {
  try {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);

    const rows = db
      .query(
        `SELECT id, image_type, locale, url, width, height, is_primary, vote_average
         FROM images
         WHERE entity_type = 'season' AND entity_id = ?
         ORDER BY is_primary DESC, vote_average DESC`,
      )
      .all([seasonId]);

    return ok(rows, { locale, total: (rows as unknown[]).length });
  } catch (err) {
    return serverError(err, "en");
  }
}

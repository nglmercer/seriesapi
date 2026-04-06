import { getDrizzle } from "../../init";
import { parsePagination } from "../response";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../i18n";

export class SeasonController {
  static getDetail(req: Request, id: number) {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const drizzle = getDrizzle();

    const row = drizzle.query(`
      SELECT
        s.id, s.media_id, s.season_number, s.episode_count,
        s.air_date, s.end_date, s.score, s.score_count, s.external_ids,
        COALESCE(st.name, 'Season ' || s.season_number) AS name,
        st.synopsis,
        (SELECT url FROM images
         WHERE entity_type='season' AND entity_id=s.id
           AND image_type='poster' AND is_primary=1 LIMIT 1) AS poster_url
       FROM seasons s
       LEFT JOIN season_translations st ON st.season_id = s.id AND st.locale = ?
       WHERE s.id = ?
    `).get([locale, id]);

    return { season: row, locale };
  }

  static getEpisodes(req: Request, seasonId: number) {
    const url = new URL(req.url);
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const { page, pageSize, offset } = parsePagination(url);
    const drizzle = getDrizzle();

    const totalRes = drizzle.query<{c: number}>(`SELECT COUNT(*) as c FROM episodes WHERE season_id = ?`).get([seasonId]);
    const total = totalRes ? totalRes.c : 0;

    const rows = drizzle.query(`
      SELECT
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
       LIMIT ? OFFSET ?
    `).all([locale, seasonId, pageSize, offset]);

    return { rows, locale, page, pageSize, total };
  }

  static getImages(req: Request, seasonId: number) {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const drizzle = getDrizzle();

    const rows = drizzle.query(`
      SELECT id, image_type, locale, url, width, height, is_primary, vote_average
      FROM images
      WHERE entity_type = 'season' AND entity_id = ?
      ORDER BY is_primary DESC, vote_average DESC
    `).all([seasonId]);

    return { rows, locale, total: rows.length };
  }

  static create(data: { mediaId: number; seasonNumber: number; title?: string }) {
    const drizzle = getDrizzle();
    const now = new Date().toISOString();

    const seasonId = drizzle.query(`
      INSERT INTO seasons (media_id, season_number, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `).run([data.mediaId, data.seasonNumber, now, now]).lastInsertRowid;

    if (data.title) {
      drizzle.query(`
        INSERT INTO season_translations (season_id, locale, name)
        VALUES (?, 'es', ?)
      `).run([seasonId, data.title]);
    }

    return { id: seasonId };
  }

  static update(id: number, data: { seasonNumber?: number; title?: string }) {
    const drizzle = getDrizzle();
    const now = new Date().toISOString();

    if (data.seasonNumber !== undefined) {
      drizzle.query(`UPDATE seasons SET season_number = ?, updated_at = ? WHERE id = ?`)
        .run([data.seasonNumber, now, id]);
    }

    if (data.title !== undefined) {
      // Upsert translation for 'es'
      const existing = drizzle.query(`SELECT id FROM season_translations WHERE season_id = ? AND locale = 'es'`).get([id]);
      if (existing) {
        drizzle.query(`UPDATE season_translations SET name = ? WHERE season_id = ? AND locale = 'es'`)
          .run([data.title, id]);
      } else {
        drizzle.query(`INSERT INTO season_translations (season_id, locale, name) VALUES (?, 'es', ?)`)
          .run([id, data.title]);
      }
    }

    return { ok: true };
  }

  static delete(id: number) {
    const drizzle = getDrizzle();
    drizzle.query(`DELETE FROM seasons WHERE id = ?`).run([id]);
    drizzle.query(`DELETE FROM season_translations WHERE season_id = ?`).run([id]);
    // Note: Episodes should probably be deleted too, but we might want cascading for that in the schema.
    return { ok: true };
  }
}

import { seasonsTable, seasonTranslationsTable, episodesTable, episodeTranslationsTable, imagesTable, commentsTable } from "../../schema";
import { getDrizzle } from "../../init";
import { validateParams, paginationSchema } from "../validation";
import { getLocaleFromRequest, SUPPORTED_LOCALES, DEFAULT_LOCALE } from "../../i18n";

export class SeasonController {
  static getComments(req: Request, seasonId: number) {
    const url = new URL(req.url);
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const drizzle = getDrizzle();

    const queryParams = Object.fromEntries(url.searchParams);
    const v = validateParams(paginationSchema, queryParams, locale);
    if (!v.success) return { error: v.error };

    const { page, limit: pageSize } = v.data;
    const offset = (page - 1) * pageSize;

    const totalRes = drizzle.select(commentsTable)
      .selectRaw("COUNT(*) as c")
      .where("entity_type = 'season' AND entity_id = ? AND is_hidden = 0 AND parent_id IS NULL", [seasonId])
      .get() as { c: number } | undefined;
    const total = totalRes ? totalRes.c : 0;

    const repliesSubquery = `(SELECT JSON_GROUP_ARRAY(JSON_OBJECT('id', r.id, 'display_name', r.display_name, 'body', r.body, 'locale', r.locale, 'likes', r.likes, 'created_at', r.created_at)) FROM comments r WHERE r.parent_id = c.id AND r.is_hidden = 0)`;

    const rows = drizzle.select(commentsTable).as("c")
      .selectRaw(`c.id, c.parent_id, c.display_name, c.locale, c.body, c.contains_spoilers, c.likes, c.dislikes, c.created_at, ${repliesSubquery} AS replies`)
      .where("c.entity_type = 'season' AND c.entity_id = ?", [seasonId])
      .andWhere("c.is_hidden = 0 AND c.parent_id IS NULL")
      .orderBy("c.likes", "desc")
      .orderBy("c.created_at", "desc")
      .limit(pageSize)
      .offset(offset)
      .all();

    return { rows, locale, page, pageSize, total };
  }

  static getDetail(req: Request, id: number) {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const drizzle = getDrizzle();

    const posterSubquery = `(SELECT url FROM images WHERE entity_type='season' AND entity_id=s.id AND image_type='poster' AND is_primary=1 LIMIT 1)`;

    const row = drizzle.select(seasonsTable).as("s")
      .selectRaw(`s.id, s.media_id, s.season_number, s.episode_count, s.air_date, s.end_date, s.score, s.score_count, s.external_ids, COALESCE(st.name, 'Season ' || s.season_number) AS name, st.synopsis, ${posterSubquery} AS poster_url, st.id AS translation_id`)
      .leftJoin("season_translations st", "st.season_id = s.id AND st.locale = ?", [locale])
      .where("s.id = ?", [id])
      .get();

    return { season: row, locale };
  }

  static getEpisodes(req: Request, seasonId: number) {
    const url = new URL(req.url);
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const drizzle = getDrizzle();

    const queryParams = Object.fromEntries(url.searchParams);
    const v = validateParams(paginationSchema, queryParams, locale);
    if (!v.success) return { error: v.error };

    const { page, limit: pageSize } = v.data;
    const offset = (page - 1) * pageSize;

    const totalRes = drizzle.select(episodesTable)
      .selectRaw("COUNT(*) as c")
      .where("season_id = ?", [seasonId])
      .get() as { c: number } | undefined;
    const total = totalRes ? totalRes.c : 0;

    const stillSubquery = `(SELECT url FROM images WHERE entity_type='episode' AND entity_id=e.id AND image_type='still' AND is_primary=1 LIMIT 1)`;

    const rows = drizzle.select(episodesTable).as("e")
      .selectRaw(`e.id, e.episode_number, e.absolute_number, e.episode_type, e.air_date, e.runtime_minutes, e.score, COALESCE(et.title, 'Episode ' || e.episode_number) AS title, et.synopsis, ${stillSubquery} AS still_url, et.id AS translation_id, COALESCE(r.rating_average, 0) AS rating_average, COALESCE(r.rating_count, 0) AS rating_count`)
      .leftJoin("episode_translations et", "et.episode_id = e.id AND et.locale = ?", [locale])
      .leftJoin("(SELECT entity_id, avg(score) as rating_average, count(id) as rating_count FROM ratings WHERE entity_type='episode' GROUP BY entity_id) r", "r.entity_id = e.id")
      .where("e.season_id = ?", [seasonId])
      .orderBy("e.episode_number", "asc")
      .limit(pageSize)
      .offset(offset)
      .all();

    return { rows, locale, page, pageSize, total };
  }

  static getImages(req: Request, seasonId: number) {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const drizzle = getDrizzle();

    const rows = drizzle.select(imagesTable)
      .where("entity_type = 'season'")
      .andWhere("entity_id = ?", [seasonId])
      .orderBy("is_primary", "desc")
      .orderBy("vote_average", "desc")
      .all();

    return { rows, locale, total: rows.length };
  }

  static create(data: { mediaId: number; seasonNumber: number; title?: string }, locale = DEFAULT_LOCALE) {
    const drizzle = getDrizzle();
    const now = new Date().toISOString();

    const res = drizzle.insert(seasonsTable).values({
      media_id: data.mediaId,
      season_number: data.seasonNumber,
      created_at: now,
      updated_at: now
    }).run();
    const seasonId = res.lastInsertRowid;

    if (data.title) {
      drizzle.insert(seasonTranslationsTable).values({
        season_id: Number(seasonId),
        locale,
        name: data.title
      }).run();
    }

    return { id: seasonId };
  }

  static update(id: number, data: { seasonNumber?: number; title?: string }, locale = DEFAULT_LOCALE) {
    const drizzle = getDrizzle();
    const now = new Date().toISOString();

    if (data.seasonNumber !== undefined) {
      drizzle.update(seasonsTable)
        .set({ season_number: data.seasonNumber, updated_at: now })
        .where("id = ?", [id])
        .run();
    }

    if (data.title !== undefined) {
      const existing = drizzle.select(seasonTranslationsTable)
        .select("id")
        .where("season_id = ? AND locale = ?", [id, locale])
        .get();
      
      if (existing) {
        drizzle.update(seasonTranslationsTable)
          .set({ name: data.title })
          .where("season_id = ? AND locale = ?", [id, locale])
          .run();
      } else {
        drizzle.insert(seasonTranslationsTable).values({
          season_id: id,
          locale,
          name: data.title
        }).run();
      }
    }

    return { ok: true };
  }

  static delete(id: number) {
    const drizzle = getDrizzle();
    drizzle.delete(seasonsTable).where("id = ?", [id]).run();
    drizzle.delete(seasonTranslationsTable).where("season_id = ?", [id]).run();
    return { ok: true };
  }
}

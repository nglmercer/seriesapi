import { episodesTable, episodeTranslationsTable, seasonsTable, imagesTable, commentsTable, peopleTable, episodeCreditsTable } from "../../schema";
import { getDrizzle } from "../../init";
import { validateParams, paginationSchema } from "../validation";
import { getLocaleFromRequest, SUPPORTED_LOCALES, DEFAULT_LOCALE } from "../../i18n";

export class EpisodeController {
  static getDetail(req: Request, id: number) {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const drizzle = getDrizzle();

    const stillSubquery = `(SELECT url FROM images WHERE entity_type='episode' AND entity_id=e.id AND image_type='still' AND is_primary=1 LIMIT 1)`;

    const row = drizzle.select(episodesTable).as("e")
      .selectRaw(`e.id, e.media_id, e.season_id, e.episode_number, e.absolute_number, e.episode_type, e.air_date, e.runtime_minutes, e.score, e.score_count, e.external_ids, s.season_number, COALESCE(et.title, 'Episode ' || e.episode_number) AS title, et.synopsis, ${stillSubquery} AS still_url, et.id AS translation_id`)
      .leftJoin("seasons s", "s.id = e.season_id")
      .leftJoin("episode_translations et", "et.episode_id = e.id AND et.locale = ?", [locale])
      .where("e.id = ?", [id])
      .get();

    if (!row) return { episode: null, locale };

    const ratingInfo = drizzle.query<{ avgScore: number, count: number }>(
      "SELECT avg(score) as avgScore, count(id) as count FROM ratings WHERE entity_type = 'episode' AND entity_id = ?"
    ).get([id]);

    const episode = {
      ...row,
      rating_average: ratingInfo?.avgScore || 0,
      rating_count: ratingInfo?.count || 0
    };

    return { episode, locale };
  }

  static getCredits(req: Request, episodeId: number) {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const drizzle = getDrizzle();

    const profileSubquery = `(SELECT url FROM images WHERE entity_type='person' AND entity_id=p.id AND image_type='profile' AND is_primary=1 LIMIT 1)`;

    const rows = drizzle.select(episodeCreditsTable).as("ec")
      .selectRaw(`p.id, p.name, ec.credit_type, ec.role_name, ${profileSubquery} AS profile_url`)
      .join("people p", "p.id = ec.person_id")
      .where("ec.episode_id = ?", [episodeId])
      .orderBy("ec.credit_type", "asc")
      .all();

    return { rows, locale, total: rows.length };
  }

  static getImages(req: Request, episodeId: number) {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const drizzle = getDrizzle();

    const rows = drizzle.select(imagesTable)
      .where("entity_type = 'episode'")
      .andWhere("entity_id = ?", [episodeId])
      .orderBy("is_primary", "desc")
      .orderBy("vote_average", "desc")
      .all();

    return { rows, locale, total: rows.length };
  }

  static getComments(req: Request, episodeId: number) {
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
      .where("entity_type='episode' AND entity_id=? AND is_hidden=0 AND parent_id IS NULL", [episodeId])
      .get() as { c: number } | undefined;
    const total = totalRes ? totalRes.c : 0;

    const repliesSubquery = `(SELECT JSON_GROUP_ARRAY(JSON_OBJECT('id', r.id, 'display_name', r.display_name, 'body', r.body, 'locale', r.locale, 'likes', r.likes, 'created_at', r.created_at)) FROM comments r WHERE r.parent_id = c.id AND r.is_hidden = 0)`;

    const rows = drizzle.select(commentsTable).as("c")
      .selectRaw(`c.id, c.parent_id, c.display_name, c.locale, c.body, c.contains_spoilers, c.likes, c.dislikes, c.created_at, ${repliesSubquery} AS replies`)
      .where("c.entity_type='episode' AND c.entity_id=?", [episodeId])
      .andWhere("c.is_hidden=0 AND c.parent_id IS NULL")
      .orderBy("c.likes", "desc")
      .orderBy("c.created_at", "desc")
      .limit(pageSize)
      .offset(offset)
      .all();

    return { rows, locale, page, pageSize, total };
  }

  static create(data: { mediaId: number; seasonId: number; number: number; title?: string; synopsis?: string }, locale = DEFAULT_LOCALE) {
    const drizzle = getDrizzle();
    const now = new Date().toISOString();

    const res = drizzle.insert(episodesTable).values({
      media_id: data.mediaId,
      season_id: data.seasonId,
      episode_number: data.number,
      created_at: now,
      updated_at: now
    }).run();
    const episodeId = res.lastInsertRowid;

    if (data.title || data.synopsis) {
      drizzle.insert(episodeTranslationsTable).values({
        episode_id: Number(episodeId),
        locale,
        title: data.title || undefined,
        synopsis: data.synopsis || undefined
      }).run();
    }

    return { id: episodeId };
  }

  static update(id: number, data: { number?: number; title?: string; synopsis?: string }, locale = DEFAULT_LOCALE) {
    const drizzle = getDrizzle();
    const now = new Date().toISOString();

    if (data.number !== undefined) {
      drizzle.update(episodesTable)
        .set({ episode_number: data.number, updated_at: now })
        .where("id = ?", [id])
        .run();
    }

    if (data.title !== undefined || data.synopsis !== undefined) {
      const existing = drizzle.select(episodeTranslationsTable)
        .select("id")
        .where("episode_id = ? AND locale = ?", [id, locale])
        .get();
      
      if (existing) {
        const updateData: Record<string, string | null> = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.synopsis !== undefined) updateData.synopsis = data.synopsis;
        
        drizzle.update(episodeTranslationsTable)
          .set(updateData)
          .where("episode_id = ? AND locale = ?", [id, locale])
          .run();
      } else {
        drizzle.insert(episodeTranslationsTable).values({
          episode_id: id,
          locale,
          title: data.title || undefined,
          synopsis: data.synopsis || undefined
        }).run();
      }
    }

    return { ok: true };
  }

  static delete(id: number) {
    const drizzle = getDrizzle();
    drizzle.delete(episodesTable).where("id = ?", [id]).run();
    drizzle.delete(episodeTranslationsTable).where("episode_id = ?", [id]).run();
    return { ok: true };
  }
}

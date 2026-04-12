import { episodesTable, episodeTranslationsTable, seasonsTable, imagesTable, commentsTable, episodeCreditsTable } from "../../schema";
import { paginationSchema } from "../validation";
import { DEFAULT_LOCALE } from "../../i18n";
import { badRequest } from "../response";
import { ApiContext } from "../context";

export class EpisodeController {
  static getDetail(ctx: ApiContext, id: number) {
    const { drizzle, locale } = ctx;

    const stillSubquery = `(SELECT url FROM images WHERE entity_type='episode' AND entity_id=e.id AND image_type='still' AND is_primary=1 LIMIT 1)`;

    const row = drizzle.select(episodesTable).as("e")
      .selectRaw(`e.id, e.media_id, e.season_id, e.episode_number, e.absolute_number, e.episode_type, e.air_date, e.runtime_minutes, e.score, e.score_count, e.view_count, e.external_ids, s.season_number, COALESCE(et.title, 'Episode ' || e.episode_number) AS title, et.synopsis, ${stillSubquery} AS still_url, et.id AS translation_id`)
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

  static getCredits(ctx: ApiContext, episodeId: number) {
    const { drizzle, locale } = ctx;

    const profileSubquery = `(SELECT url FROM images WHERE entity_type='person' AND entity_id=p.id AND image_type='profile' AND is_primary=1 LIMIT 1)`;

    const rows = drizzle.select(episodeCreditsTable).as("ec")
      .selectRaw(`p.id, p.name, ec.credit_type, ec.role_name, ${profileSubquery} AS profile_url`)
      .join("people p", "p.id = ec.person_id")
      .where("ec.episode_id = ?", [episodeId])
      .orderBy("ec.credit_type", "asc")
      .all();

    return { rows, locale, total: rows.length };
  }

  static getImages(ctx: ApiContext, episodeId: number) {
    const { drizzle, locale } = ctx;

    const rows = drizzle.select(imagesTable)
      .where("entity_type = 'episode'")
      .andWhere("entity_id = ?", [episodeId])
      .orderBy("is_primary", "desc")
      .orderBy("vote_average", "desc")
      .all();

    return { rows, locale, total: rows.length };
  }

  static getComments(ctx: ApiContext, episodeId: number) {
    const { drizzle, locale } = ctx;

    const v = ctx.validate(paginationSchema);
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

  static create(ctx: ApiContext, data: { mediaId: number; seasonId?: number; number: number; title?: string; synopsis?: string; runtimeMinutes?: number }) {
    const { drizzle, locale } = ctx;
    const now = new Date().toISOString();

    const insertData: Record<string, unknown> = {
      media_id: data.mediaId,
      episode_number: data.number,
      created_at: now,
      updated_at: now
    };
    if (data.seasonId) insertData.season_id = data.seasonId;
    if (data.runtimeMinutes) insertData.runtime_minutes = data.runtimeMinutes;

    const res = drizzle.insert(episodesTable).values(insertData).run();
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

  static update(ctx: ApiContext, id: number, data: { number?: number; episode_number?: number; absolute_number?: number | null; episode_type?: string; air_date?: string | null; runtime_minutes?: number | null; title?: string; synopsis?: string; season_id?: number; thumbnail?: string }) {
    const { drizzle, locale } = ctx;
    const now = new Date().toISOString();

    const updateData: Record<string, any> = { updated_at: now };
    const num = data.episode_number ?? data.number;
    if (num !== undefined) updateData.episode_number = num;
    if (data.absolute_number !== undefined) updateData.absolute_number = data.absolute_number;
    if (data.episode_type !== undefined) updateData.episode_type = data.episode_type;
    if (data.air_date !== undefined) updateData.air_date = data.air_date;
    if (data.runtime_minutes !== undefined) updateData.runtime_minutes = data.runtime_minutes;
    if (data.season_id !== undefined) updateData.season_id = data.season_id;

    if (Object.keys(updateData).length > 1) {
      drizzle.update(episodesTable)
        .set(updateData)
        .where("id = ?", [id])
        .run();
    }

    if (data.title !== undefined || data.synopsis !== undefined) {
      const existing = drizzle.select(episodeTranslationsTable)
        .select("id")
        .where("episode_id = ? AND locale = ?", [id, locale])
        .get();
      
      if (existing) {
        const transUpdate: Record<string, string | null> = {};
        if (data.title !== undefined) transUpdate.title = data.title;
        if (data.synopsis !== undefined) transUpdate.synopsis = data.synopsis;
        
        drizzle.update(episodeTranslationsTable)
          .set(transUpdate)
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

    if (data.thumbnail !== undefined) {
      const existingImg = drizzle.select(imagesTable)
        .select("id")
        .where("entity_type = 'episode' AND entity_id = ? AND image_type = 'still' AND is_primary = 1", [id])
        .get() as { id: number } | undefined;
      
      if (existingImg) {
        drizzle.update(imagesTable)
          .set({ url: data.thumbnail })
          .where("id = ?", [existingImg.id])
          .run();
      } else {
        drizzle.insert(imagesTable).values({
          entity_type: 'episode',
          entity_id: id,
          image_type: 'still',
          url: data.thumbnail,
          is_primary: 1
        }).run();
      }
    }

    return { ok: true };
  }

  static getNeighbors(ctx: ApiContext, episodeId: number) {
    const { drizzle, locale } = ctx;

    const current = drizzle.select(episodesTable)
      .selectRaw("e.id, e.media_id, e.season_id, e.episode_number")
      .as("e")
      .where("e.id = ?", [episodeId])
      .get();
    if (!current) return { error: badRequest("Episode not found", locale) };

    const prev = drizzle.select(episodesTable).as("e")
      .selectRaw("e.id, e.episode_number, COALESCE(et.title, 'Episode ' || e.episode_number) AS title")
      .leftJoin("episode_translations et", "et.episode_id = e.id AND et.locale = ?", [locale])
      .where("e.season_id = ? AND e.episode_number < ?", [current.season_id, current.episode_number])
      .orderBy("e.episode_number", "desc")
      .limit(1)
      .get();

    const next = drizzle.select(episodesTable).as("e")
      .selectRaw("e.id, e.episode_number, COALESCE(et.title, 'Episode ' || e.episode_number) AS title")
      .leftJoin("episode_translations et", "et.episode_id = e.id AND et.locale = ?", [locale])
      .where("e.season_id = ? AND e.episode_number > ?", [current.season_id, current.episode_number])
      .orderBy("e.episode_number", "asc")
      .limit(1)
      .get();

    return { prev, next };
  }

  static delete(ctx: ApiContext, id: number) {
    const { drizzle } = ctx;
    drizzle.delete(episodesTable).where("id = ?", [id]).run();
    drizzle.delete(episodeTranslationsTable).where("episode_id = ?", [id]).run();
    return { ok: true };
  }

  static incrementView(ctx: ApiContext, id: number) {
    const { drizzle } = ctx;
    
    // Get related IDs first
    const ep = drizzle.select(episodesTable)
      .selectRaw("media_id, season_id")
      .where("id = ?", [id])
      .get() as { media_id: number; season_id: number | null } | undefined;
      
    if (!ep) return { error: { message: "Episode not found", status: 404 } };
    
    // Execute increment queries directly
    drizzle.execute("UPDATE episodes SET view_count = view_count + 1 WHERE id = ?", [id]);
    drizzle.execute("UPDATE media SET view_count = view_count + 1 WHERE id = ?", [ep.media_id]);
    
    if (ep.season_id) {
      drizzle.execute("UPDATE seasons SET view_count = view_count + 1 WHERE id = ?", [ep.season_id]);
    }
    
    return { ok: true };
  }
}

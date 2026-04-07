import { imagesTable, videosTable, contentTypesTable, mediaTable, mediaTranslationsTable, mediaGenresTable, genresTable, genreTranslationsTable, mediaTagsTable, tagsTable, mediaStudiosTable, studiosTable, mediaNetworksTable, networksTable, seasonsTable, seasonTranslationsTable, episodesTable, episodeTranslationsTable, peopleTable, peopleTranslationsTable, creditsTable, mediaRelationsTable, commentsTable } from "../../schema";
import { getDrizzle } from "../../init";
import { parsePagination } from "../response";
import { validateParams, mediaListParamsSchema, episodeParamsSchema, imageParamsSchema, paginationSchema } from "../validation";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../i18n";

// function getPosterUrl(drizzle: any, mediaId: number): string | null {
//   const row = drizzle.select(imagesTable)
//     .select("url")
//     .where("entity_type = 'media'")
//     .andWhere("entity_id = ?", [mediaId])
//     .andWhere("image_type = 'poster'")
//     .andWhere("is_primary = 1")
//     .limit(1)
//     .get();
//   return row?.url ?? null;
// }

export class MediaController {
  static getList(req: Request) {
    const url = new URL(req.url);
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    
    const params = Object.fromEntries(url.searchParams);
    const v = validateParams(mediaListParamsSchema, params, locale);
    if (!v.success) return { error: v.error };

    const { 
      page, limit: pageSize, type, genre, status, 
      sort_by: sortBy, order, q: search, 
      year_from: yearFrom, year_to: yearTo, score_from: scoreFrom 
    } = v.data;

    const offset = (page - 1) * pageSize;
    const safeSort = sortBy;

    const drizzle = getDrizzle();
    const posterSubquery = `(SELECT url FROM images WHERE entity_type='media' AND entity_id=m.id AND image_type='poster' AND is_primary=1 LIMIT 1)`;

    const itemsQuery = drizzle.select(mediaTable).as("m")
      .distinct()
      .selectRaw(`m.id, m.slug, ct.slug AS content_type, m.original_title, m.status, m.release_date, m.score, m.popularity, COALESCE(mt.title, m.original_title) AS title, mt.synopsis_short, ${posterSubquery} AS poster_url, mt.id AS translation_id`)
      .join("content_types ct", "ct.id = m.content_type_id")
      .leftJoin("media_translations mt", "mt.media_id = m.id AND mt.locale = ?", [locale]);

    const totalQuery = drizzle.select(mediaTable).as("m")
      .selectRaw("COUNT(DISTINCT m.id) as total")
      .join("content_types ct", "ct.id = m.content_type_id")
      .leftJoin("media_translations mt", "mt.media_id = m.id AND mt.locale = ?", [locale]);

    if (type) {
      itemsQuery.andWhere("ct.slug = ?", [type]);
      totalQuery.andWhere("ct.slug = ?", [type]);
    }
    if (status) {
      itemsQuery.andWhere("m.status = ?", [status]);
      totalQuery.andWhere("m.status = ?", [status]);
    }
    if (genre) {
      const cond = `m.id IN (SELECT media_id FROM media_genres mg JOIN genres g ON g.id = mg.genre_id WHERE g.slug = ?)`;
      itemsQuery.andWhere(cond, [genre]);
      totalQuery.andWhere(cond, [genre]);
    }
    if (search) {
      const cond = `(m.original_title LIKE ? OR mt.title LIKE ?)`;
      const params = [`%${search}%`, `%${search}%`];
      itemsQuery.andWhere(cond, params);
      totalQuery.andWhere(cond, params);
    }
    if (yearFrom) {
      itemsQuery.andWhere(`m.release_date >= ?`, [`${yearFrom.toString()}-01-01`]);
      totalQuery.andWhere(`m.release_date >= ?`, [`${yearFrom.toString()}-01-01`]);
    }
    if (yearTo) {
      itemsQuery.andWhere(`m.release_date <= ?`, [`${yearTo.toString()}-12-31`]);
      totalQuery.andWhere(`m.release_date <= ?`, [`${yearTo.toString()}-12-31`]);
    }
    if (scoreFrom !== undefined) {
      itemsQuery.andWhere(`m.score >= ?`, [scoreFrom]);
      totalQuery.andWhere(`m.score >= ?`, [scoreFrom]);
    }

    if (safeSort === "title") {
      itemsQuery.orderBy("COALESCE(mt.title, m.original_title)", order);
    } else {
      itemsQuery.orderBy(`m.${safeSort}`, order);
    }

    const countRes = totalQuery.get() as { total: number } | undefined;
    const total = countRes ? countRes.total : 0;

    const data = itemsQuery
      .limit(pageSize)
      .offset(offset)
      .all();

    return { data, params: { locale, page, pageSize, total } };
  }

  static getDetail(req: Request, id: number) {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const drizzle = getDrizzle();

    const posterSubquery = `(SELECT url FROM images WHERE entity_type='media' AND entity_id=m.id AND image_type='poster' AND is_primary=1 LIMIT 1)`;

    const row = drizzle.select(mediaTable).as("m")
      .selectRaw(`m.id, m.slug, ct.slug AS content_type, m.original_title, m.original_language, m.status, m.release_date, m.end_date, m.runtime_minutes, m.total_episodes, m.total_seasons, m.score, m.score_count, m.popularity, m.age_rating, m.is_adult, m.external_ids, COALESCE(mt.title, m.original_title) AS title, mt.tagline, mt.synopsis, mt.synopsis_short, ${posterSubquery} AS poster_url, mt.id AS translation_id`)
      .join("content_types ct", "ct.id = m.content_type_id")
      .leftJoin("media_translations mt", "mt.media_id = m.id AND mt.locale = ?", [locale])
      .where("m.id = ?", [id])
      .get();

    if (!row) return null;

    const genres = drizzle.select(mediaGenresTable).as("mg")
      .selectRaw("g.id, g.slug, COALESCE(gt.name, g.slug) AS name")
      .join("genres g", "g.id = mg.genre_id")
      .leftJoin("genre_translations gt", "gt.genre_id = g.id AND gt.locale = ?", [locale])
      .where("mg.media_id = ?", [id])
      .all();

    const tags = drizzle.select(mediaTagsTable).as("mt2")
      .selectRaw("t.id, t.slug, t.label, mt2.spoiler")
      .join("tags t", "t.id = mt2.tag_id")
      .where("mt2.media_id = ?", [id])
      .all();

    const studios = drizzle.select(mediaStudiosTable).as("ms")
      .selectRaw("s.id, s.name, s.logo_url")
      .join("studios s", "s.id = ms.studio_id")
      .where("ms.media_id = ?", [id])
      .all();

    const networks = drizzle.select(mediaNetworksTable).as("mn")
      .selectRaw("n.id, n.name, n.slug, n.logo_url")
      .join("networks n", "n.id = mn.network_id")
      .where("mn.media_id = ?", [id])
      .all();

    return { detail: { ...row, genres, tags, studios, networks }, locale };
  }

  static getSeasons(req: Request, mediaId: number) {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const drizzle = getDrizzle();

    const rows = drizzle.select(seasonsTable).as("s")
      .selectRaw(`s.id, s.season_number, s.episode_count, s.air_date, s.score, COALESCE(st.name, 'Season ' || s.season_number) AS name, st.synopsis`)
      .leftJoin("season_translations st", "st.season_id = s.id AND st.locale = ?", [locale])
      .where("s.media_id = ?", [mediaId])
      .orderBy("s.season_number", "asc")
      .all();

    return { rows, locale, total: rows.length };
  }

  static getEpisodes(req: Request, mediaId: number) {
    const url = new URL(req.url);
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const drizzle = getDrizzle();

    const queryParams = Object.fromEntries(url.searchParams);
    const v = validateParams(episodeParamsSchema, queryParams, locale);
    if (!v.success) return { error: v.error };

    const { page, limit: pageSize, season } = v.data;
    const offset = (page - 1) * pageSize;

    const itemsQuery = drizzle.select(episodesTable).as("e")
      .selectRaw(`e.id, e.season_id, e.episode_number, e.absolute_number, e.episode_type, e.air_date, e.runtime_minutes, e.score, s.season_number, COALESCE(et.title, 'Episode ' || e.episode_number) AS title, et.synopsis`)
      .leftJoin("seasons s", "s.id = e.season_id")
      .leftJoin("episode_translations et", "et.episode_id = e.id AND et.locale = ?", [locale])
      .where("e.media_id = ?", [mediaId]);

    const totalQuery = drizzle.select(episodesTable).as("e")
      .selectRaw("COUNT(*) as c")
      .leftJoin("seasons s", "s.id = e.season_id")
      .where("e.media_id = ?", [mediaId]);

    if (season !== undefined) {
      itemsQuery.andWhere("s.season_number = ?", [season]);
      totalQuery.andWhere("s.season_number = ?", [season]);
    }

    const totalRes = totalQuery.get() as { c: number } | undefined;
    const total = totalRes ? totalRes.c : 0;

    const rows = itemsQuery
      .orderBy("s.season_number", "asc")
      .orderBy("e.episode_number", "asc")
      .limit(pageSize)
      .offset(offset)
      .all();

    return { rows, params: { locale, page, pageSize, total } };
  }

  static getCredits(req: Request, mediaId: number) {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const drizzle = getDrizzle();

    const profileSubquery = `(SELECT url FROM images WHERE entity_type='person' AND entity_id=p.id AND image_type='profile' AND is_primary=1 LIMIT 1)`;

    const cast = drizzle.select(creditsTable).as("c")
      .selectRaw(`p.id, p.name, c.role_name, c."order" AS billing_order, c.is_recurring, c.episode_count, ${profileSubquery} AS profile_url`)
      .join("people p", "p.id = c.person_id")
      .where("c.media_id = ?", [mediaId])
      .andWhere("c.credit_type = 'cast'")
      .orderBy("billing_order", "asc")
      .all();

    const crew = drizzle.select(creditsTable).as("c")
      .selectRaw(`p.id, p.name, c.department, c.job, c.role_name, ${profileSubquery} AS profile_url`)
      .join("people p", "p.id = c.person_id")
      .where("c.media_id = ?", [mediaId])
      .andWhere("c.credit_type = 'crew'")
      .orderBy("c.department", "asc")
      .orderBy("c.job", "asc")
      .all();

    return { credits: { cast, crew }, locale };
  }

  static getImages(req: Request, mediaId: number) {
    const url = new URL(req.url);
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const drizzle = getDrizzle();

    const queryParams = Object.fromEntries(url.searchParams);
    const v = validateParams(imageParamsSchema, queryParams, locale);
    if (!v.success) return { error: v.error };

    const { type } = v.data;

    const query = drizzle.select(imagesTable)
      .where("entity_type = 'media'")
      .andWhere("entity_id = ?", [mediaId]);

    if (type) {
      query.andWhere("image_type = ?", [type]);
    }

    const rows = query
      .orderBy("is_primary", "desc")
      .orderBy("vote_average", "desc")
      .all();

    return { rows, locale, total: rows.length };
  }

  static getVideos(req: Request, mediaId: number) {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const drizzle = getDrizzle();
    
    const rows = drizzle.select(videosTable)
      .where("media_id = ?", [mediaId])
      .orderBy("official", "desc")
      .orderBy("published_at", "desc")
      .all();
      
    return { rows, locale, total: rows.length };
  }

  static getRelated(req: Request, mediaId: number) {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const drizzle = getDrizzle();

    const posterSubquery = `(SELECT url FROM images WHERE entity_type='media' AND entity_id=m.id AND image_type='poster' AND is_primary=1 LIMIT 1)`;

    const rows = drizzle.select(mediaRelationsTable).as("r")
      .selectRaw(`r.relation_type, m.id, m.slug, ct.slug AS content_type, m.original_title, m.score, m.status, COALESCE(mt.title, m.original_title) AS title, ${posterSubquery} AS poster_url`)
      .join("media m", "m.id = r.related_media_id")
      .join("content_types ct", "ct.id = m.content_type_id")
      .leftJoin("media_translations mt", "mt.media_id = m.id AND mt.locale = ?", [locale])
      .where("r.source_media_id = ?", [mediaId])
      .orderBy("r.relation_type", "asc")
      .all();
    
    return { rows, locale, total: rows.length };
  }

  static getComments(req: Request, mediaId: number) {
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
      .where("entity_type = 'media' AND entity_id = ? AND is_hidden = 0 AND parent_id IS NULL", [mediaId])
      .get() as { c: number } | undefined;
    const total = totalRes ? totalRes.c : 0;

    const repliesSubquery = `(SELECT JSON_GROUP_ARRAY(JSON_OBJECT('id', r.id, 'display_name', r.display_name, 'body', r.body, 'likes', r.likes, 'created_at', r.created_at)) FROM comments r WHERE r.parent_id = c.id AND r.is_hidden = 0)`;

    const rows = drizzle.select(commentsTable).as("c")
      .selectRaw(`c.id, c.parent_id, c.display_name, c.locale, c.body, c.contains_spoilers, c.likes, c.dislikes, c.created_at, ${repliesSubquery} AS replies`)
      .where("c.entity_type = 'media' AND c.entity_id = ?", [mediaId])
      .andWhere("c.is_hidden = 0 AND c.parent_id IS NULL")
      .orderBy("c.likes", "desc")
      .orderBy("c.created_at", "desc")
      .limit(pageSize)
      .offset(offset)
      .all();

    return { rows, params: { locale, page, pageSize, total } };
  }
}

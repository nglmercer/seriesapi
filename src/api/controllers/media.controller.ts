import { getDrizzle } from "../../init";
import { parsePagination } from "../response";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../i18n";
import type { Database } from "sqlite-napi";
import { imagesTable, videosTable, contentTypesTable, mediaTable, mediaTranslationsTable } from "../../schema";

function getPosterUrl(drizzle: any, mediaId: number): string | null {
  const row = drizzle.select(imagesTable)
    .select("url")
    .where("entity_type = 'media'")
    .andWhere("entity_id = ?", [mediaId])
    .andWhere("image_type = 'poster'")
    .andWhere("is_primary = 1")
    .limit(1)
    .get();
  return row?.url ?? null;
}

export class MediaController {
  static getList(req: Request) {
    const url = new URL(req.url);
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const { page, pageSize, offset } = parsePagination(url);

    const type = url.searchParams.get("type");
    const genre = url.searchParams.get("genre");
    const status = url.searchParams.get("status");
    const sortBy = url.searchParams.get("sort_by") ?? "popularity";
    const order = url.searchParams.get("order") === "asc" ? "ASC" : "DESC";
    const search = url.searchParams.get("q");
    const yearFrom = url.searchParams.get("year_from");
    const yearTo = url.searchParams.get("year_to");
    const scoreFrom = url.searchParams.get("score_from");

    const allowedSorts = new Set(["popularity", "score", "release_date", "title"]);
    const safeSort = allowedSorts.has(sortBy) ? sortBy : "popularity";

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (type) { conditions.push("ct.slug = ?"); params.push(type); }
    if (status) { conditions.push("m.status = ?"); params.push(status); }
    if (genre) {
      conditions.push(`m.id IN (SELECT media_id FROM media_genres mg JOIN genres g ON g.id = mg.genre_id WHERE g.slug = ?)`);
      params.push(genre);
    }
    if (search) {
      conditions.push(`(m.original_title LIKE ? OR mt.title LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`);
    }
    if (yearFrom) {
      conditions.push(`m.release_date >= ?`);
      params.push(`${yearFrom}-01-01`);
    }
    if (yearTo) {
      conditions.push(`m.release_date <= ?`);
      params.push(`${yearTo}-12-31`);
    }
    if (scoreFrom) {
      conditions.push(`m.score >= ?`);
      params.push(parseFloat(scoreFrom));
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const orderClause = safeSort === "title"
      ? `ORDER BY COALESCE(mt.title, m.original_title) ${order}`
      : `ORDER BY m.${safeSort} ${order}`;

    const drizzle = getDrizzle();

    const countRow = drizzle.query<{total: number}>(`
      SELECT COUNT(DISTINCT m.id) as total
      FROM media m
      JOIN content_types ct ON ct.id = m.content_type_id
      LEFT JOIN media_translations mt ON mt.media_id = m.id AND mt.locale = ?
      ${where}
    `).get([locale, ...params]);
    const total = countRow?.total ?? 0;

    const rows = drizzle.query(`
      SELECT DISTINCT
        m.id, m.slug, ct.slug AS content_type,
        m.original_title, m.status, m.release_date,
        m.score, m.popularity,
        COALESCE(mt.title, m.original_title) AS title,
        mt.synopsis_short
      FROM media m
      JOIN content_types ct ON ct.id = m.content_type_id
      LEFT JOIN media_translations mt ON mt.media_id = m.id AND mt.locale = ?
      ${where}
      ${orderClause}
      LIMIT ? OFFSET ?
    `).all([locale, ...params, pageSize, offset]) as any[];

    const data = rows.map((r) => ({ ...r, poster_url: getPosterUrl(drizzle, r.id) }));
    return { data, params: { locale, page, pageSize, total } };
  }

  static getDetail(req: Request, id: number) {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const drizzle = getDrizzle();

    const row = drizzle.query(`
      SELECT
        m.id, m.slug, ct.slug AS content_type,
        m.original_title, m.original_language,
        m.status, m.release_date, m.end_date,
        m.runtime_minutes, m.total_episodes, m.total_seasons,
        m.score, m.score_count, m.popularity,
        m.age_rating, m.is_adult, m.external_ids,
        COALESCE(mt.title, m.original_title) AS title,
        mt.tagline, mt.synopsis, mt.synopsis_short
      FROM media m
      JOIN content_types ct ON ct.id = m.content_type_id
      LEFT JOIN media_translations mt ON mt.media_id = m.id AND mt.locale = ?
      WHERE m.id = ?
    `).get([locale, id]);

    if (!row) return null;

    const genres = drizzle.query(`
      SELECT g.id, g.slug, COALESCE(gt.name, g.slug) AS name
      FROM media_genres mg
      JOIN genres g ON g.id = mg.genre_id
      LEFT JOIN genre_translations gt ON gt.genre_id = g.id AND gt.locale = ?
      WHERE mg.media_id = ?
    `).all([locale, id]);

    const tags = drizzle.query(`
      SELECT t.id, t.slug, t.label, mt2.spoiler
      FROM media_tags mt2
      JOIN tags t ON t.id = mt2.tag_id
      WHERE mt2.media_id = ?
    `).all([id]);

    const studios = drizzle.query(`
      SELECT s.id, s.name, s.logo_url
      FROM media_studios ms
      JOIN studios s ON s.id = ms.studio_id
      WHERE ms.media_id = ?
    `).all([id]);

    const networks = drizzle.query(`
      SELECT n.id, n.name, n.slug, n.logo_url
      FROM media_networks mn
      JOIN networks n ON n.id = mn.network_id
      WHERE mn.media_id = ?
    `).all([id]);

    return { detail: { ...row, poster_url: getPosterUrl(drizzle, id), genres, tags, studios, networks }, locale };
  }

  static getSeasons(req: Request, mediaId: number) {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const drizzle = getDrizzle();

    const rows = drizzle.query(`
      SELECT
        s.id, s.season_number, s.episode_count, s.air_date, s.score,
        COALESCE(st.name, 'Season ' || s.season_number) AS name,
        st.synopsis
       FROM seasons s
       LEFT JOIN season_translations st ON st.season_id = s.id AND st.locale = ?
       WHERE s.media_id = ?
       ORDER BY s.season_number ASC
    `).all([locale, mediaId]);

    return { rows, locale, total: rows.length };
  }

  static getEpisodes(req: Request, mediaId: number) {
    const url = new URL(req.url);
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const { page, pageSize, offset } = parsePagination(url);
    const season = url.searchParams.get("season");
    const drizzle = getDrizzle();

    const conditions = ["e.media_id = ?"];
    const params: unknown[] = [locale, mediaId];

    if (season) { conditions.push("s.season_number = ?"); params.push(parseInt(season, 10)); }

    const where = `WHERE ${conditions.join(" AND ")}`;

    const totalRes = drizzle.query<{c: number}>(`
      SELECT COUNT(*) as c FROM episodes e
      LEFT JOIN seasons s ON s.id = e.season_id
      WHERE e.media_id = ?${season ? " AND s.season_number = ?" : ""}
    `).get(season ? [mediaId, parseInt(season, 10)] : [mediaId]);
    const total = totalRes ? totalRes.c : 0;

    const rows = drizzle.query(`
      SELECT
        e.id, e.season_id, e.episode_number, e.absolute_number,
        e.episode_type, e.air_date, e.runtime_minutes, e.score,
        s.season_number,
        COALESCE(et.title, 'Episode ' || e.episode_number) AS title,
        et.synopsis
       FROM episodes e
       LEFT JOIN seasons s ON s.id = e.season_id
       LEFT JOIN episode_translations et ON et.episode_id = e.id AND et.locale = ?
       ${where}
       ORDER BY s.season_number ASC, e.episode_number ASC
       LIMIT ? OFFSET ?
    `).all([...params, pageSize, offset]);

    return { rows, params: { locale, page, pageSize, total } };
  }

  static getCredits(req: Request, mediaId: number) {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const drizzle = getDrizzle();

    const cast = drizzle.query(`
      SELECT p.id, p.name, c.role_name, c."order" AS billing_order,
             c.is_recurring, c.episode_count,
             (SELECT url FROM images
              WHERE entity_type='person' AND entity_id=p.id
                AND image_type='profile' AND is_primary=1 LIMIT 1) AS profile_url
       FROM credits c
       JOIN people p ON p.id = c.person_id
       WHERE c.media_id = ? AND c.credit_type = 'cast'
       ORDER BY c."order" ASC
    `).all([mediaId]);

    const crew = drizzle.query(`
      SELECT p.id, p.name, c.department, c.job, c.role_name,
             (SELECT url FROM images
              WHERE entity_type='person' AND entity_id=p.id
                AND image_type='profile' AND is_primary=1 LIMIT 1) AS profile_url
       FROM credits c
       JOIN people p ON p.id = c.person_id
       WHERE c.media_id = ? AND c.credit_type = 'crew'
       ORDER BY c.department ASC, c.job ASC
    `).all([mediaId]);

    return { credits: { cast, crew }, locale };
  }

  static getImages(req: Request, mediaId: number) {
    const url = new URL(req.url);
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const type = url.searchParams.get("type");
    const drizzle = getDrizzle();

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
    const rows = drizzle.query(`
      SELECT
        r.relation_type,
        m.id, m.slug, ct.slug AS content_type,
        m.original_title, m.score, m.status,
        COALESCE(mt.title, m.original_title) AS title,
        (SELECT url FROM images
         WHERE entity_type='media' AND entity_id=m.id
           AND image_type='poster' AND is_primary=1 LIMIT 1) AS poster_url
       FROM media_relations r
       JOIN media m ON m.id = r.related_media_id
       JOIN content_types ct ON ct.id = m.content_type_id
       LEFT JOIN media_translations mt ON mt.media_id = m.id AND mt.locale = ?
       WHERE r.source_media_id = ?
       ORDER BY r.relation_type ASC
    `).all([locale, mediaId]);
    return { rows, locale, total: rows.length };
  }

  static getComments(req: Request, mediaId: number) {
    const url = new URL(req.url);
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const { page, pageSize, offset } = parsePagination(url);
    const drizzle = getDrizzle();

    const totalRes = drizzle.query<{c: number}>(`
      SELECT COUNT(*) as c FROM comments
      WHERE entity_type = 'media' AND entity_id = ?
        AND is_hidden = 0 AND parent_id IS NULL
    `).get([mediaId]);
    const total = totalRes ? totalRes.c : 0;

    const rows = drizzle.query(`
      SELECT
        c.id, c.parent_id, c.display_name, c.locale,
        c.body, c.contains_spoilers, c.likes, c.dislikes, c.created_at,
        (SELECT JSON_GROUP_ARRAY(JSON_OBJECT(
           'id', r.id, 'display_name', r.display_name,
           'body', r.body, 'likes', r.likes, 'created_at', r.created_at
         )) FROM comments r
         WHERE r.parent_id = c.id AND r.is_hidden = 0) AS replies
       FROM comments c
       WHERE c.entity_type = 'media' AND c.entity_id = ?
         AND c.is_hidden = 0 AND c.parent_id IS NULL
       ORDER BY c.likes DESC, c.created_at DESC
       LIMIT ? OFFSET ?
    `).all([mediaId, pageSize, offset]);

    return { rows, params: { locale, page, pageSize, total } };
  }
}

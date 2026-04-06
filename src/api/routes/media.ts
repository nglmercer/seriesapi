/**
 * /api/v1/media  –  Media catalogue routes
 *
 * GET  /api/v1/media                  – paginated list (filter by type/genre/status)
 * GET  /api/v1/media/:id              – single media detail
 * GET  /api/v1/media/:id/seasons      – seasons for a media entry
 * GET  /api/v1/media/:id/episodes     – flat episode list (movies / OVAs)
 * GET  /api/v1/media/:id/credits      – cast & crew
 * GET  /api/v1/media/:id/images       – all images
 * GET  /api/v1/media/:id/videos       – trailers / openings / endings
 * GET  /api/v1/media/:id/related      – related titles
 * GET  /api/v1/media/:id/comments     – public comments
 */

import type { Database } from "sqlite-napi";
import { ok, notFound, badRequest, serverError, parsePagination } from "../response";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../i18n";

// ─── Types returned to clients ────────────────────────────────────────────────

interface MediaListItem {
  id: number;
  slug: string;
  content_type: string;
  original_title: string;
  title: string;
  synopsis_short: string | null;
  status: string;
  release_date: string | null;
  score: number;
  popularity: number;
  poster_url: string | null;
}

interface MediaDetail extends MediaListItem {
  tagline: string | null;
  synopsis: string | null;
  original_language: string | null;
  end_date: string | null;
  runtime_minutes: number | null;
  total_episodes: number | null;
  total_seasons: number | null;
  score_count: number;
  age_rating: string | null;
  is_adult: number;
  external_ids: string | null;
  genres: { id: number; slug: string; name: string }[];
  tags: { id: number; slug: string; label: string; spoiler: number }[];
  studios: { id: number; name: string; logo_url: string | null }[];
  networks: { id: number; name: string; slug: string; logo_url: string | null }[];
}

// ─── Helper: fetch primary poster ────────────────────────────────────────────

function getPosterUrl(db: Database, mediaId: number): string | null {
  const row = db
    .query(
      `SELECT url FROM images
       WHERE entity_type = 'media' AND entity_id = ?
         AND image_type = 'poster' AND is_primary = 1
       LIMIT 1`,
    )
    .get([mediaId]) as { url: string } | undefined;
  return row?.url ?? null;
}

// ─── Handler: list ────────────────────────────────────────────────────────────

export function handleMediaList(req: Request, db: Database): Response {
  try {
    const url = new URL(req.url);
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const { page, pageSize, offset } = parsePagination(url);

    // optional filters
    const type = url.searchParams.get("type");        // content_type slug
    const genre = url.searchParams.get("genre");       // genre slug
    const status = url.searchParams.get("status");     // ongoing|completed|cancelled|upcoming
    const sort = url.searchParams.get("sort") ?? "popularity"; // popularity|score|release_date
    const order = url.searchParams.get("order") === "asc" ? "ASC" : "DESC";
    const search = url.searchParams.get("q");

    const allowedSorts = new Set(["popularity", "score", "release_date", "title"]);
    const safeSort = allowedSorts.has(sort) ? sort : "popularity";

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (type) {
      conditions.push("ct.slug = ?");
      params.push(type);
    }
    if (status) {
      conditions.push("m.status = ?");
      params.push(status);
    }
    if (genre) {
      conditions.push(
        `m.id IN (SELECT media_id FROM media_genres mg
                  JOIN genres g ON g.id = mg.genre_id WHERE g.slug = ?)`,
      );
      params.push(genre);
    }
    if (search) {
      conditions.push(
        `(m.original_title LIKE ? OR mt.title LIKE ?)`,
      );
      params.push(`%${search}%`, `%${search}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const orderClause =
      safeSort === "title"
        ? `ORDER BY COALESCE(mt.title, m.original_title) ${order}`
        : `ORDER BY m.${safeSort} ${order}`;

    // count
    const countSql = `
      SELECT COUNT(DISTINCT m.id) as total
      FROM media m
      JOIN content_types ct ON ct.id = m.content_type_id
      LEFT JOIN media_translations mt ON mt.media_id = m.id AND mt.locale = ?
      ${where}`;
    const countRow = db.query(countSql).get([locale, ...params]) as { total: number };
    const total = countRow?.total ?? 0;

    const rowsSql = `
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
      LIMIT ? OFFSET ?`;

    const rows = db.query(rowsSql).all([locale, ...params, pageSize, offset]) as MediaListItem[];

    const data = rows.map((r) => ({
      ...r,
      poster_url: getPosterUrl(db, r.id),
    }));

    return ok(data, { locale, page, pageSize, total });
  } catch (err) {
    return serverError(err, "en");
  }
}

// ─── Handler: detail ─────────────────────────────────────────────────────────

export function handleMediaDetail(req: Request, db: Database, id: number): Response {
  try {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);

    const row = db
      .query(
        `SELECT
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
        WHERE m.id = ?`,
      )
      .get([locale, id]) as MediaDetail | undefined;

    if (!row) return notFound("Media", locale);

    // genres
    const genres = db
      .query(
        `SELECT g.id, g.slug,
          COALESCE(gt.name, g.slug) AS name
         FROM media_genres mg
         JOIN genres g ON g.id = mg.genre_id
         LEFT JOIN genre_translations gt ON gt.genre_id = g.id AND gt.locale = ?
         WHERE mg.media_id = ?`,
      )
      .all([locale, id]) as { id: number; slug: string; name: string }[];

    // tags
    const tags = db
      .query(
        `SELECT t.id, t.slug, t.label, mt2.spoiler
         FROM media_tags mt2
         JOIN tags t ON t.id = mt2.tag_id
         WHERE mt2.media_id = ?`,
      )
      .all([id]) as { id: number; slug: string; label: string; spoiler: number }[];

    // studios
    const studios = db
      .query(
        `SELECT s.id, s.name, s.logo_url
         FROM media_studios ms
         JOIN studios s ON s.id = ms.studio_id
         WHERE ms.media_id = ?`,
      )
      .all([id]) as { id: number; name: string; logo_url: string | null }[];

    // networks
    const networks = db
      .query(
        `SELECT n.id, n.name, n.slug, n.logo_url
         FROM media_networks mn
         JOIN networks n ON n.id = mn.network_id
         WHERE mn.media_id = ?`,
      )
      .all([id]) as { id: number; name: string; slug: string; logo_url: string | null }[];

    return ok(
      { ...row, poster_url: getPosterUrl(db, id), genres, tags, studios, networks },
      { locale },
    );
  } catch (err) {
    return serverError(err, "en");
  }
}

// ─── Handler: seasons ────────────────────────────────────────────────────────

export function handleMediaSeasons(req: Request, db: Database, mediaId: number): Response {
  try {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);

    const rows = db
      .query(
        `SELECT
          s.id, s.season_number, s.episode_count, s.air_date, s.score,
          COALESCE(st.name, 'Season ' || s.season_number) AS name,
          st.synopsis
         FROM seasons s
         LEFT JOIN season_translations st ON st.season_id = s.id AND st.locale = ?
         WHERE s.media_id = ?
         ORDER BY s.season_number ASC`,
      )
      .all([locale, mediaId]);

    if (!rows.length) return notFound("Seasons", locale);
    return ok(rows, { locale, total: rows.length });
  } catch (err) {
    return serverError(err, "en");
  }
}

// ─── Handler: episodes ───────────────────────────────────────────────────────

export function handleMediaEpisodes(req: Request, db: Database, mediaId: number): Response {
  try {
    const url = new URL(req.url);
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const { page, pageSize, offset } = parsePagination(url);
    const season = url.searchParams.get("season");

    const conditions = ["e.media_id = ?"];
    const params: unknown[] = [locale, mediaId];

    if (season) {
      conditions.push("s.season_number = ?");
      params.push(parseInt(season, 10));
    }

    const where = `WHERE ${conditions.join(" AND ")}`;

    const total = (
      db
        .query(
          `SELECT COUNT(*) as c FROM episodes e
           LEFT JOIN seasons s ON s.id = e.season_id
           WHERE e.media_id = ?${season ? " AND s.season_number = ?" : ""}`,
        )
        .get(season ? [mediaId, parseInt(season, 10)] : [mediaId]) as { c: number }
    ).c;

    const rows = db
      .query(
        `SELECT
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
         LIMIT ? OFFSET ?`,
      )
      .all([...params, pageSize, offset]);

    return ok(rows, { locale, page, pageSize, total });
  } catch (err) {
    return serverError(err, "en");
  }
}

// ─── Handler: credits ────────────────────────────────────────────────────────

export function handleMediaCredits(req: Request, db: Database, mediaId: number): Response {
  try {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);

    const cast = db
      .query(
        `SELECT p.id, p.name, c.role_name, c."order" AS billing_order,
                c.is_recurring, c.episode_count,
                (SELECT url FROM images
                 WHERE entity_type='person' AND entity_id=p.id
                   AND image_type='profile' AND is_primary=1 LIMIT 1) AS profile_url
         FROM credits c
         JOIN people p ON p.id = c.person_id
         WHERE c.media_id = ? AND c.credit_type = 'cast'
         ORDER BY c."order" ASC`,
      )
      .all([mediaId]);

    const crew = db
      .query(
        `SELECT p.id, p.name, c.department, c.job, c.role_name,
                (SELECT url FROM images
                 WHERE entity_type='person' AND entity_id=p.id
                   AND image_type='profile' AND is_primary=1 LIMIT 1) AS profile_url
         FROM credits c
         JOIN people p ON p.id = c.person_id
         WHERE c.media_id = ? AND c.credit_type = 'crew'
         ORDER BY c.department ASC, c.job ASC`,
      )
      .all([mediaId]);

    return ok({ cast, crew }, { locale });
  } catch (err) {
    return serverError(err, "en");
  }
}

// ─── Handler: images ─────────────────────────────────────────────────────────

export function handleMediaImages(req: Request, db: Database, mediaId: number): Response {
  try {
    const url = new URL(req.url);
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const type = url.searchParams.get("type"); // poster|backdrop|logo|banner|still|thumbnail

    const conditions = ["entity_type = 'media'", "entity_id = ?"];
    const params: unknown[] = [mediaId];

    if (type) {
      conditions.push("image_type = ?");
      params.push(type);
    }

    const rows = db
      .query(
        `SELECT id, image_type, locale, url, width, height, aspect_ratio,
                is_primary, vote_average, vote_count, source
         FROM images
         WHERE ${conditions.join(" AND ")}
         ORDER BY is_primary DESC, vote_average DESC`,
      )
      .all(params);

    return ok(rows, { locale, total: (rows as unknown[]).length });
  } catch (err) {
    return serverError(err, "en");
  }
}

// ─── Handler: videos ─────────────────────────────────────────────────────────

export function handleMediaVideos(req: Request, db: Database, mediaId: number): Response {
  try {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);

    const rows = db
      .query(
        `SELECT id, video_type, name, site, key, thumbnail_url, published_at, official, locale
         FROM videos
         WHERE media_id = ?
         ORDER BY official DESC, published_at DESC`,
      )
      .all([mediaId]);

    return ok(rows, { locale, total: (rows as unknown[]).length });
  } catch (err) {
    return serverError(err, "en");
  }
}

// ─── Handler: related ────────────────────────────────────────────────────────

export function handleMediaRelated(req: Request, db: Database, mediaId: number): Response {
  try {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);

    const rows = db
      .query(
        `SELECT
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
         ORDER BY r.relation_type ASC`,
      )
      .all([locale, mediaId]);

    return ok(rows, { locale, total: (rows as unknown[]).length });
  } catch (err) {
    return serverError(err, "en");
  }
}

// ─── Handler: comments ───────────────────────────────────────────────────────

export function handleMediaComments(req: Request, db: Database, mediaId: number): Response {
  try {
    const url = new URL(req.url);
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const { page, pageSize, offset } = parsePagination(url);

    const total = (
      db
        .query(
          `SELECT COUNT(*) as c FROM comments
           WHERE entity_type = 'media' AND entity_id = ?
             AND is_hidden = 0 AND parent_id IS NULL`,
        )
        .get([mediaId]) as { c: number }
    ).c;

    const rows = db
      .query(
        `SELECT
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
         LIMIT ? OFFSET ?`,
      )
      .all([mediaId, pageSize, offset]);

    return ok(rows, { locale, page, pageSize, total });
  } catch (err) {
    return serverError(err, "en");
  }
}

import { getDrizzle } from "../../init";
import { parsePagination } from "../response";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../i18n";

export class GenreController {
  static getList(req: Request) {
    const drizzle = getDrizzle();
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);

    const query = drizzle.query(`
      SELECT g.id, g.slug, g.image_url,
             COALESCE(gt.name, g.slug) AS name
      FROM genres g
      LEFT JOIN genre_translations gt ON gt.genre_id = g.id AND gt.locale = ?
      ORDER BY name ASC
    `);

    const rows = query.all([locale]);

    return { params: { locale, total: rows.length }, rows };
  }

  static getDetail(req: Request, slug: string) {
    const drizzle = getDrizzle();
    const url = new URL(req.url);
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const { page, pageSize, offset } = parsePagination(url);
    const type = url.searchParams.get("type");

    const genreQuery = drizzle.query<{ id: number; slug: string; name: string }>(`
      SELECT g.id, g.slug, COALESCE(gt.name, g.slug) AS name
      FROM genres g
      LEFT JOIN genre_translations gt ON gt.genre_id = g.id AND gt.locale = ?
      WHERE g.slug = ?
    `);

    const genre = genreQuery.get([locale, slug]);
    if (!genre) return null;

    const typeFilter = type ? "AND ct.slug = ?" : "";
    const typeParams = type ? [type] : [];

    const totalRes = drizzle.query<{ c: number }>(`
      SELECT COUNT(*) as c FROM media_genres mg
      JOIN media m ON m.id = mg.media_id
      JOIN content_types ct ON ct.id = m.content_type_id
      WHERE mg.genre_id = ? ${typeFilter}
    `).get([genre.id, ...typeParams]);

    const total = totalRes ? totalRes.c : 0;

    const itemsQuery = drizzle.query(`
      SELECT
        m.id, m.slug, ct.slug AS content_type,
        m.original_title, m.status, m.release_date,
        m.score, m.popularity,
        COALESCE(mt.title, m.original_title) AS title,
        mt.synopsis_short,
        (SELECT url FROM images
         WHERE entity_type='media' AND entity_id=m.id
           AND image_type='poster' AND is_primary=1 LIMIT 1) AS poster_url
       FROM media_genres mg
       JOIN media m ON m.id = mg.media_id
       JOIN content_types ct ON ct.id = m.content_type_id
       LEFT JOIN media_translations mt ON mt.media_id = m.id AND mt.locale = ?
       WHERE mg.genre_id = ? ${typeFilter}
       ORDER BY m.popularity DESC
       LIMIT ? OFFSET ?
    `);

    const items = itemsQuery.all([locale, genre.id, ...typeParams, pageSize, offset]);

    return { genre, items, locale, page, pageSize, total };
  }
}

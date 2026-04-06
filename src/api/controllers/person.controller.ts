import { getDrizzle } from "../../init";
import { parsePagination } from "../response";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../i18n";

export class PersonController {
  static getList(req: Request) {
    const url = new URL(req.url);
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const { page, pageSize, offset } = parsePagination(url);
    const search = url.searchParams.get("q");
    const drizzle = getDrizzle();

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (search) {
      conditions.push("(p.name LIKE ? OR pt.name LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const totalRes = drizzle.query<{c: number}>(`
      SELECT COUNT(DISTINCT p.id) as c
      FROM people p
      LEFT JOIN people_translations pt ON pt.person_id = p.id AND pt.locale = ?
      ${where}
    `).get([locale, ...params]);
    const total = totalRes ? totalRes.c : 0;

    const rows = drizzle.query(`
      SELECT DISTINCT
        p.id, p.name, p.birth_date, p.birth_country, p.gender,
        COALESCE(pt.name, p.name) AS display_name,
        (SELECT url FROM images
         WHERE entity_type='person' AND entity_id=p.id
           AND image_type='profile' AND is_primary=1 LIMIT 1) AS profile_url
       FROM people p
       LEFT JOIN people_translations pt ON pt.person_id = p.id AND pt.locale = ?
       ${where}
       ORDER BY p.name ASC
       LIMIT ? OFFSET ?
    `).all([locale, ...params, pageSize, offset]);

    return { rows, params: { locale, page, pageSize, total } };
  }

  static getDetail(req: Request, id: number) {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const drizzle = getDrizzle();

    const row = drizzle.query(`
      SELECT
        p.id, p.birth_date, p.death_date, p.birth_country, p.gender,
        p.also_known_as, p.external_ids,
        COALESCE(pt.name, p.name) AS name,
        pt.biography,
        (SELECT url FROM images
         WHERE entity_type='person' AND entity_id=p.id
           AND image_type='profile' AND is_primary=1 LIMIT 1) AS profile_url
       FROM people p
       LEFT JOIN people_translations pt ON pt.person_id = p.id AND pt.locale = ?
       WHERE p.id = ?
    `).get([locale, id]);

    return { person: row, locale };
  }

  static getCredits(req: Request, personId: number) {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const drizzle = getDrizzle();

    const rows = drizzle.query(`
      SELECT
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
       ORDER BY m.release_date DESC NULLS LAST
    `).all([locale, personId]);

    return { rows, locale, total: rows.length };
  }
}

import { getDrizzle } from "../../init";
import { parsePagination } from "../response";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../i18n";

export class CollectionController {
  static getList(req: Request) {
    const drizzle = getDrizzle();
    const url = new URL(req.url);
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const { page, pageSize, offset } = parsePagination(url);

    const totalRes = drizzle.query<{ c: number }>("SELECT COUNT(*) as c FROM collections").get();
    const total = totalRes ? totalRes.c : 0;

    const query = drizzle.query(`
      SELECT c.id, c.slug,
             COALESCE(ct.name, c.slug) AS name,
             ct.overview,
             (SELECT url FROM images
              WHERE entity_type='collection' AND entity_id=c.id
                AND image_type='backdrop' AND is_primary=1 LIMIT 1) AS backdrop_url,
             (SELECT url FROM images
              WHERE entity_type='collection' AND entity_id=c.id
                AND image_type='poster' AND is_primary=1 LIMIT 1) AS poster_url,
             (SELECT COUNT(*) FROM collection_items ci WHERE ci.collection_id = c.id) AS item_count
      FROM collections c
      LEFT JOIN collection_translations ct ON ct.collection_id = c.id AND ct.locale = ?
      ORDER BY name ASC
      LIMIT ? OFFSET ?
    `);

    const rows = query.all([locale, pageSize, offset]);

    return { params: { locale, page, pageSize, total }, rows };
  }

  static getDetail(req: Request, slug: string) {
    const drizzle = getDrizzle();
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);

    const collectionQuery = drizzle.query<{ id: number; slug: string; name: string; overview: string | null; backdrop_url: string | null; poster_url: string | null }>(`
      SELECT c.id, c.slug,
             COALESCE(ct.name, c.slug) AS name,
             ct.overview,
             (SELECT url FROM images
              WHERE entity_type='collection' AND entity_id=c.id
                AND image_type='backdrop' AND is_primary=1 LIMIT 1) AS backdrop_url,
             (SELECT url FROM images
              WHERE entity_type='collection' AND entity_id=c.id
                AND image_type='poster' AND is_primary=1 LIMIT 1) AS poster_url
      FROM collections c
      LEFT JOIN collection_translations ct ON ct.collection_id = c.id AND ct.locale = ?
      WHERE c.slug = ?
    `);

    const collection = collectionQuery.get([locale, slug]);
    if (!collection) return null;

    const itemsQuery = drizzle.query(`
      SELECT
        ci."order",
        m.id, m.slug, ct2.slug AS content_type,
        m.original_title, m.status, m.release_date, m.score,
        COALESCE(mt.title, m.original_title) AS title,
        mt.synopsis_short,
        (SELECT url FROM images
          WHERE entity_type='media' AND entity_id=m.id
            AND image_type='poster' AND is_primary=1 LIMIT 1) AS poster_url
        FROM collection_items ci
        JOIN media m ON m.id = ci.media_id
        JOIN content_types ct2 ON ct2.id = m.content_type_id
        LEFT JOIN media_translations mt ON mt.media_id = m.id AND mt.locale = ?
        WHERE ci.collection_id = ?
        ORDER BY ci."order" ASC
    `);

    const items = itemsQuery.all([locale, collection.id]);

    return { collection, items, locale };
  }
}

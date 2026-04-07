import { collectionsTable, collectionTranslationsTable, imagesTable, collectionItemsTable, mediaTable, contentTypesTable, mediaTranslationsTable } from "../../schema";
import { getDrizzle } from "../../init";
import { validateParams, paginationSchema } from "../validation";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../i18n";

export class CollectionController {
  static getList(req: Request) {
    const drizzle = getDrizzle();
    const url = new URL(req.url);
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    
    const queryParams = Object.fromEntries(url.searchParams);
    const v = validateParams(paginationSchema, queryParams, locale);
    if (!v.success) return { error: v.error };

    const { page, limit: pageSize } = v.data;
    const offset = (page - 1) * pageSize;

    const totalRes = drizzle.select(collectionsTable)
      .selectRaw("COUNT(*) as c")
      .get() as { c: number } | undefined;
    const total = totalRes ? totalRes.c : 0;

    const backdropSubquery = `(SELECT url FROM images WHERE entity_type='collection' AND entity_id=c.id AND image_type='backdrop' AND is_primary=1 LIMIT 1)`;
    const posterSubquery = `(SELECT url FROM images WHERE entity_type='collection' AND entity_id=c.id AND image_type='poster' AND is_primary=1 LIMIT 1)`;
    const countSubquery = `(SELECT COUNT(*) FROM collection_items ci WHERE ci.collection_id = c.id)`;

    const rows = drizzle.select(collectionsTable).as("c")
      .selectRaw(`c.id, c.slug, COALESCE(ct.name, c.slug) AS name, ct.overview, ${backdropSubquery} AS backdrop_url, ${posterSubquery} AS poster_url, ${countSubquery} AS item_count`)
      .leftJoin("collection_translations ct", "ct.collection_id = c.id AND ct.locale = ?", [locale])
      .orderBy("name", "asc")
      .limit(pageSize)
      .offset(offset)
      .all();

    return { params: { locale, page, pageSize, total }, rows };
  }

  static getDetail(req: Request, slug: string) {
    const drizzle = getDrizzle();
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);

    const backdropSubquery = `(SELECT url FROM images WHERE entity_type='collection' AND entity_id=c.id AND image_type='backdrop' AND is_primary=1 LIMIT 1)`;
    const posterSubquery = `(SELECT url FROM images WHERE entity_type='collection' AND entity_id=c.id AND image_type='poster' AND is_primary=1 LIMIT 1)`;

    const collection = drizzle.select(collectionsTable).as("c")
      .selectRaw(`c.id, c.slug, COALESCE(ct.name, c.slug) AS name, ct.overview, ${backdropSubquery} AS backdrop_url, ${posterSubquery} AS poster_url`)
      .leftJoin("collection_translations ct", "ct.collection_id = c.id AND ct.locale = ?", [locale])
      .where("c.slug = ?", [slug])
      .get() as { id: number; slug: string; name: string; overview: string | null; backdrop_url: string | null; poster_url: string | null } | undefined;

    if (!collection) return null;

    const mediaPosterSubquery = `(SELECT url FROM images WHERE entity_type='media' AND entity_id=m.id AND image_type='poster' AND is_primary=1 LIMIT 1)`;

    const items = drizzle.select(collectionItemsTable).as("ci")
      .selectRaw(`ci."order", m.id, m.slug, ct2.slug AS content_type, m.original_title, m.status, m.release_date, m.score, COALESCE(mt.title, m.original_title) AS title, mt.synopsis_short, ${mediaPosterSubquery} AS poster_url`)
      .join("media m", "m.id = ci.media_id")
      .join("content_types ct2", "ct2.id = m.content_type_id")
      .leftJoin("media_translations mt", "mt.media_id = m.id AND mt.locale = ?", [locale])
      .where("ci.collection_id = ?", [collection.id])
      .orderBy("ci.order", "asc")
      .all();

    return { collection, items, locale };
  }
}

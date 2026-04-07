import { mediaTable, contentTypesTable, mediaTranslationsTable, peopleTable, peopleTranslationsTable, collectionsTable, collectionTranslationsTable, imagesTable } from "../../schema";
import { getDrizzle } from "../../init";
import { validateParams, searchParamsSchema } from "../validation";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../i18n";

type SearchEntityType = "media" | "person" | "collection";

export class SearchController {
  static getList(req: Request) {
    const drizzle = getDrizzle();
    const url = new URL(req.url);
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    
    const params = Object.fromEntries(url.searchParams);
    const v = validateParams(searchParamsSchema, params, locale);
    if (!v.success) return { error: v.error };
    
    const { q, type, page, limit: pageSize } = v.data;
    const offset = (page - 1) * pageSize;

    const activeTypes: SearchEntityType[] = type ? [type] : ["media", "person", "collection"];

    const like = `%${q}%`;
    const results: unknown[] = [];

    if (activeTypes.includes("media")) {
      const posterSubquery = `(SELECT url FROM images WHERE entity_type='media' AND entity_id=m.id AND image_type='poster' AND is_primary=1 LIMIT 1)`;
      
      const rows = drizzle.select(mediaTable).as("m")
        .distinct()
        .selectRaw(`'media' AS entity_type, m.id, m.slug, ct.slug AS content_type, COALESCE(mt.title, m.original_title) AS title, mt.synopsis_short AS description, m.score, m.release_date, ${posterSubquery} AS image_url`)
        .join("content_types ct", "ct.id = m.content_type_id")
        .leftJoin("media_translations mt", "mt.media_id = m.id AND mt.locale = ?", [locale])
        .where("(m.original_title LIKE ? OR mt.title LIKE ?)", [like, like])
        .orderBy("m.popularity", "desc")
        .limit(pageSize)
        .offset(offset)
        .all();
      results.push(...rows);
    }

    if (activeTypes.includes("person")) {
      const profileSubquery = `(SELECT url FROM images WHERE entity_type='person' AND entity_id=p.id AND image_type='profile' AND is_primary=1 LIMIT 1)`;

      const rows = drizzle.select(peopleTable).as("p")
        .distinct()
        .selectRaw(`'person' AS entity_type, p.id, p.name AS slug, COALESCE(pt.name, p.name) AS title, pt.biography AS description, NULL AS score, p.birth_date AS release_date, ${profileSubquery} AS image_url`)
        .leftJoin("people_translations pt", "pt.person_id = p.id AND pt.locale = ?", [locale])
        .where("(p.name LIKE ? OR pt.name LIKE ?)", [like, like])
        .orderBy("p.name", "asc")
        .limit(pageSize)
        .offset(offset)
        .all();
      results.push(...rows);
    }

    if (activeTypes.includes("collection")) {
      const posterSubquery = `(SELECT url FROM images WHERE entity_type='collection' AND entity_id=c.id AND image_type='poster' AND is_primary=1 LIMIT 1)`;

      const rows = drizzle.select(collectionsTable).as("c")
        .distinct()
        .selectRaw(`'collection' AS entity_type, c.id, c.slug, COALESCE(ct2.name, c.slug) AS title, ct2.overview AS description, NULL AS score, NULL AS release_date, ${posterSubquery} AS image_url`)
        .leftJoin("collection_translations ct2", "ct2.collection_id = c.id AND ct2.locale = ?", [locale])
        .where("(ct2.name LIKE ? OR c.slug LIKE ?)", [like, like])
        .orderBy("c.slug", "asc")
        .limit(pageSize)
        .offset(offset)
        .all();
      results.push(...rows);
    }

    return { params: { locale, page, pageSize, total: results.length, query: q }, rows: results };
  }
}

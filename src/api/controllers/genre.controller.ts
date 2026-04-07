import { genresTable, genreTranslationsTable, mediaGenresTable, mediaTable, contentTypesTable, mediaTranslationsTable, imagesTable } from "../../schema";
import { getDrizzle } from "../../init";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../i18n";
import { validateParams, genreDetailParamsSchema } from "../validation";

export class GenreController {
  static getList(req: Request) {
    const drizzle = getDrizzle();
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);

    const rows = drizzle.select(genresTable).as("g")
      .selectRaw("g.id, g.slug, g.image_url, COALESCE(gt.name, g.slug) AS name")
      .leftJoin("genre_translations gt", "gt.genre_id = g.id AND gt.locale = ?", [locale])
      .orderBy("name", "asc")
      .all();

    return { params: { locale, total: rows.length }, rows };
  }

  static getDetail(req: Request, slug: string) {
    const drizzle = getDrizzle();
    const url = new URL(req.url);
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);

    const params = Object.fromEntries(url.searchParams);
    const v = validateParams(genreDetailParamsSchema, params, locale);
    if (!v.success) return { error: v.error };

    const { page, limit: pageSize, type } = v.data;
    const offset = (page - 1) * pageSize;

    const genre = drizzle.select(genresTable).as("g")
      .selectRaw("g.id, g.slug, COALESCE(gt.name, g.slug) AS name")
      .leftJoin("genre_translations gt", "gt.genre_id = g.id AND gt.locale = ?", [locale])
      .where("g.slug = ?", [slug])
      .get() as { id: number; slug: string; name: string } | undefined;

    if (!genre) return null;

    const posterSubquery = `(SELECT url FROM images WHERE entity_type='media' AND entity_id=m.id AND image_type='poster' AND is_primary=1 LIMIT 1)`;

    const itemsQuery = drizzle.select(mediaGenresTable).as("mg")
      .selectRaw(`m.id, m.slug, ct.slug AS content_type, m.original_title, m.status, m.release_date, m.score, m.popularity, COALESCE(mt.title, m.original_title) AS title, mt.synopsis_short, ${posterSubquery} AS poster_url`)
      .join("media m", "m.id = mg.media_id")
      .join("content_types ct", "ct.id = m.content_type_id")
      .leftJoin("media_translations mt", "mt.media_id = m.id AND mt.locale = ?", [locale])
      .where("mg.genre_id = ?", [genre.id]);

    const totalQuery = drizzle.select(mediaGenresTable).as("mg")
      .selectRaw("COUNT(*) as c")
      .join("media m", "m.id = mg.media_id")
      .join("content_types ct", "ct.id = m.content_type_id")
      .where("mg.genre_id = ?", [genre.id]);

    if (type) {
      itemsQuery.andWhere("ct.slug = ?", [type]);
      totalQuery.andWhere("ct.slug = ?", [type]);
    }

    const totalRes = totalQuery.get() as { c: number } | undefined;
    const total = totalRes ? totalRes.c : 0;

    const items = itemsQuery
      .orderBy("m.popularity", "desc")
      .limit(pageSize)
      .offset(offset)
      .all();

    return { genre, items, locale, page, pageSize, total };
  }
}

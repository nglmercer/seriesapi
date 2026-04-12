import { genresTable, mediaGenresTable } from "../../schema";
import { genreDetailParamsSchema } from "../validation";
import { ApiContext } from "../context";

export class GenreController {
  static getList(ctx: ApiContext) {
    const { drizzle, locale } = ctx;

    const rows = drizzle.select(genresTable).as("g")
      .selectRaw("g.id, g.slug, g.image_url, COALESCE(gt.name, g.slug) AS name")
      .leftJoin("genre_translations gt", "gt.genre_id = g.id AND gt.locale = ?", [locale])
      .orderBy("name", "asc")
      .all();

    return { params: { locale, total: rows.length }, rows };
  }

  static getDetail(ctx: ApiContext, slug: string) {
    const { drizzle, locale } = ctx;

    const v = ctx.validate(genreDetailParamsSchema);
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

import { peopleTable, peopleTranslationsTable, creditsTable } from "../../schema";
import { personListParamsSchema } from "../validation";
import { ApiContext } from "../context";

export class PersonController {
  static getList(ctx: ApiContext) {
    const { drizzle, locale } = ctx;

    const v = ctx.validate(personListParamsSchema);
    if (!v.success) return { error: v.error };

    const { page, limit: pageSize, q: search } = v.data;
    const offset = (page - 1) * pageSize;

    const profileSubquery = `(SELECT url FROM images WHERE entity_type='person' AND entity_id=p.id AND image_type='profile' AND is_primary=1 LIMIT 1)`;

    const itemsQuery = drizzle.select(peopleTable).as("p")
      .distinct()
      .selectRaw(`p.id, p.name, p.birth_date, p.birth_country, p.gender, COALESCE(pt.name, p.name) AS display_name, ${profileSubquery} AS profile_url`)
      .leftJoin("people_translations pt", "pt.person_id = p.id AND pt.locale = ?", [locale]);

    const totalQuery = drizzle.select(peopleTable).as("p")
      .selectRaw("COUNT(DISTINCT p.id) as c")
      .leftJoin("people_translations pt", "pt.person_id = p.id AND pt.locale = ?", [locale]);

    if (search) {
      const cond = "(p.name LIKE ? OR pt.name LIKE ?)";
      const params = [`%${search}%`, `%${search}%`];
      itemsQuery.andWhere(cond, params);
      totalQuery.andWhere(cond, params);
    }

    const totalRes = totalQuery.get() as { c: number } | undefined;
    const total = totalRes ? totalRes.c : 0;

    const rows = itemsQuery
      .orderBy("p.name", "asc")
      .limit(pageSize)
      .offset(offset)
      .all();

    return { rows, params: { locale, page, pageSize, total } };
  }

  static getDetail(ctx: ApiContext, id: number) {
    const { drizzle, locale } = ctx;

    const profileSubquery = `(SELECT url FROM images WHERE entity_type='person' AND entity_id=p.id AND image_type='profile' AND is_primary=1 LIMIT 1)`;

    const row = drizzle.select(peopleTable).as("p")
      .selectRaw(`p.id, p.birth_date, p.death_date, p.birth_country, p.gender, p.also_known_as, p.external_ids, COALESCE(pt.name, p.name) AS name, pt.biography, ${profileSubquery} AS profile_url`)
      .leftJoin("people_translations pt", "pt.person_id = p.id AND pt.locale = ?", [locale])
      .where("p.id = ?", [id])
      .get();

    return { person: row, locale };
  }

  static getCredits(ctx: ApiContext, personId: number) {
    const { drizzle, locale } = ctx;

    const posterSubquery = `(SELECT url FROM images WHERE entity_type='media' AND entity_id=m.id AND image_type='poster' AND is_primary=1 LIMIT 1)`;

    const rows = drizzle.select(creditsTable).as("c")
      .selectRaw(`c.credit_type, c.role_name, c.department, c.job, c."order" AS billing_order, m.id AS media_id, m.slug, ct.slug AS content_type, COALESCE(mt.title, m.original_title) AS title, m.score, m.release_date, ${posterSubquery} AS poster_url`)
      .join("media m", "m.id = c.media_id")
      .join("content_types ct", "ct.id = m.content_type_id")
      .leftJoin("media_translations mt", "mt.media_id = m.id AND mt.locale = ?", [locale])
      .where("c.person_id = ?", [personId])
      .orderBy("m.release_date", "desc")
      .all();

    return { rows, locale, total: rows.length };
  }
}

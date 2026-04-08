import { tagsTable } from "../../schema";
import { getDrizzle } from "../../init";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../i18n";

export class TagController {
  static getList(req: Request) {
    const drizzle = getDrizzle();
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);

    const rows = drizzle.select(tagsTable)
      .orderBy("label", "asc")
      .all();

    return { params: { locale, total: rows.length }, rows };
  }
}

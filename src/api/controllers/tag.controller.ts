import { tagsTable } from "../../schema";
import { ApiContext } from "../context";

export class TagController {
  static getList(ctx: ApiContext) {
    const { drizzle, locale } = ctx;

    const rows = drizzle.select(tagsTable)
      .orderBy("label", "asc")
      .all();

    return { params: { locale, total: rows.length }, rows };
  }
}

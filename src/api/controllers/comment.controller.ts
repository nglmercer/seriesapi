import { createHash } from "crypto";
import { getDrizzle } from "../../init";
import { getLocaleFromRequest, SUPPORTED_LOCALES, DEFAULT_LOCALE } from "../../i18n";
import { badRequest } from "../response";
import { commentsTable } from "../../schema";
import { validateParams, commentCreateSchema } from "../validation";

export interface CommentBody {
  entity_type: string;
  entity_id: number;
  display_name: string;
  body: string;
  locale?: string;
  contains_spoilers?: boolean;
  parent_id?: number;
}

function hashIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0]!.trim() : "unknown";
  return createHash("sha256").update(ip).digest("hex");
}

export class CommentController {
  static async createComment(req: Request) {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    let rawBody: any;
    try {
      rawBody = await req.json();
    } catch {
      return { error: badRequest("Invalid JSON body.", locale) };
    }

    const v = validateParams(commentCreateSchema, rawBody, locale);
    if (!v.success) return { error: v.error };

    const { entity_type, entity_id, display_name, body: text, locale: commentLocale, contains_spoilers, parent_id } = v.data;
    const ip_hash = hashIP(req);
    const drizzle = getDrizzle();

    if (parent_id) {
      const parent = drizzle.select(commentsTable)
        .select("id")
        .where("id = ? AND entity_type = ? AND entity_id = ?", [parent_id, entity_type, entity_id])
        .get();
      if (!parent) return { error: badRequest("parent_id does not exist or is in a different thread.", locale) };
    }

    const result = drizzle.insert(commentsTable).values({
      entity_type,
      entity_id,
      parent_id,
      display_name: display_name.trim(),
      ip_hash,
      locale: commentLocale,
      body: text.trim(),
      contains_spoilers: contains_spoilers
    }).run();

    const created = drizzle.select(commentsTable)
      .where("id = ?", [result.lastInsertRowid])
      .get();
    return { data: created, locale };
  }

  static getComment(req: Request, id: number) {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const drizzle = getDrizzle();

    const repliesSubquery = `(SELECT JSON_GROUP_ARRAY(JSON_OBJECT('id', r.id, 'display_name', r.display_name, 'body', r.body, 'likes', r.likes, 'contains_spoilers', r.contains_spoilers, 'created_at', r.created_at)) FROM comments r WHERE r.parent_id = c.id AND r.is_hidden = 0)`;

    const comment = drizzle.select(commentsTable).as("c")
      .selectRaw(`c.id, c.entity_type, c.entity_id, c.parent_id, c.display_name, c.locale, c.body, c.contains_spoilers, c.likes, c.dislikes, c.created_at, ${repliesSubquery} AS replies`)
      .where("c.id = ? AND c.is_hidden = 0", [id])
      .get();

    return { comment, locale };
  }
}

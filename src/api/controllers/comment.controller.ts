import { createHash } from "crypto";
import { badRequest } from "../response";
import { commentsTable } from "../../schema";
import { commentCreateSchema } from "../validation";
import type { AuthUser } from "../routes/auth/middleware";
import { ApiContext } from "../context";

export interface CommentBody {
  entity_type: string;
  entity_id: number;
  display_name: string;
  body: string;
  locale?: string;
  contains_spoilers?: boolean;
  parent_id?: number;
}

function hashIP(ctx: ApiContext): string {
  const forwarded = ctx.req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0]!.trim() : "unknown";
  return createHash("sha256").update(ip).digest("hex");
}

export class CommentController {
  static async createComment(ctx: ApiContext, user?: AuthUser) {
    const { drizzle, locale } = ctx;
    const v = await ctx.body(commentCreateSchema);
    if (!v.success) return { error: v.error };

    const { entity_type, entity_id, body: text, locale: commentLocale, contains_spoilers, parent_id } = v.data;
    const display_name = v.data.display_name || user?.display_name || user?.username;
    if (!display_name) {
      return { error: badRequest("display_name is required when not authenticated", locale) };
    }
    const ip_hash = hashIP(ctx);

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
      parent_id: parent_id || undefined,
      display_name: display_name.trim(),
      ip_hash,
      locale: commentLocale || locale,
      body: text.trim(),
      contains_spoilers: contains_spoilers ? 1 : 0
    }).run();

    const created = drizzle.select(commentsTable)
      .where("id = ?", [result.lastInsertRowid])
      .get();
    return { data: created, locale };
  }

  static getComment(ctx: ApiContext, id: number) {
    const { drizzle, locale } = ctx;

    const repliesSubquery = `(SELECT JSON_GROUP_ARRAY(JSON_OBJECT('id', r.id, 'display_name', r.display_name, 'body', r.body, 'locale', r.locale, 'likes', r.likes, 'contains_spoilers', r.contains_spoilers, 'created_at', r.created_at)) FROM comments r WHERE r.parent_id = c.id AND r.is_hidden = 0)`;

    const comment = drizzle.select(commentsTable).as("c")
      .selectRaw(`c.id, c.entity_type, c.entity_id, c.parent_id, c.display_name, c.locale, c.body, c.contains_spoilers, c.likes, c.dislikes, c.created_at, ${repliesSubquery} AS replies`)
      .where("c.id = ? AND c.is_hidden = 0", [id])
      .get();

    return { comment, locale };
  }
}

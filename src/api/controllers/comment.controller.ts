import { createHash } from "crypto";
import { getDrizzle } from "../../init";
import { getLocaleFromRequest, SUPPORTED_LOCALES, DEFAULT_LOCALE } from "../../i18n";
import { badRequest } from "../response";

export interface CommentBody {
  entity_type: string;
  entity_id: number;
  display_name: string;
  body: string;
  locale?: string;
  contains_spoilers?: boolean;
  parent_id?: number;
}

const ALLOWED_ENTITY_TYPES = new Set(["media", "season", "episode"]);
const MAX_DISPLAY_NAME = 64;
const MAX_BODY = 2000;

function hashIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0]!.trim() : "unknown";
  return createHash("sha256").update(ip).digest("hex");
}

export class CommentController {
  static async createComment(req: Request) {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    let body: CommentBody;
    try {
      body = (await req.json()) as CommentBody;
    } catch {
      return { error: badRequest("Invalid JSON body.", locale) };
    }
    const { entity_type, entity_id, display_name, body: text } = body || {};

    if (!ALLOWED_ENTITY_TYPES.has(entity_type)) {
      return { error: badRequest(`entity_type must be one of: ${[...ALLOWED_ENTITY_TYPES].join(", ")}.`, locale) };
    }
    if (!Number.isInteger(entity_id) || entity_id < 1) {
      return { error: badRequest("entity_id must be a positive integer.", locale) };
    }
    if (typeof display_name !== "string" || display_name.trim().length < 2 || display_name.trim().length > MAX_DISPLAY_NAME) {
      return { error: badRequest(`display_name must be between 2 and ${MAX_DISPLAY_NAME} characters.`, locale) };
    }
    if (typeof text !== "string" || text.trim().length < 1 || text.trim().length > MAX_BODY) {
      return { error: badRequest(`body must be between 1 and ${MAX_BODY} characters.`, locale) };
    }

    const ip_hash = hashIP(req);
    const commentLocale = body.locale ?? DEFAULT_LOCALE;
    const contains_spoilers = body.contains_spoilers ? 1 : 0;
    const parent_id = body.parent_id ?? null;

    const drizzle = getDrizzle();

    if (parent_id !== null) {
      const parent = drizzle.query("SELECT id FROM comments WHERE id = ? AND entity_type = ? AND entity_id = ?")
        .get([parent_id, entity_type, entity_id]);
      if (!parent) return { error: badRequest("parent_id does not exist or is in a different thread.", locale) };
    }

    const result = drizzle.execute(
      `INSERT INTO comments
         (entity_type, entity_id, parent_id, display_name, ip_hash,
          locale, body, contains_spoilers)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [entity_type, entity_id, parent_id, display_name.trim(), ip_hash, commentLocale, text.trim(), contains_spoilers]
    );

    const created = drizzle.query("SELECT * FROM comments WHERE id = ?").get([result.lastInsertRowid]);
    return { data: created, locale };
  }

  static getComment(req: Request, id: number) {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const drizzle = getDrizzle();

    const comment = drizzle.query(`
      SELECT
        c.id, c.entity_type, c.entity_id, c.parent_id,
        c.display_name, c.locale, c.body,
        c.contains_spoilers, c.likes, c.dislikes, c.created_at,
        (SELECT JSON_GROUP_ARRAY(JSON_OBJECT(
           'id', r.id, 'display_name', r.display_name,
           'body', r.body, 'likes', r.likes,
           'contains_spoilers', r.contains_spoilers, 'created_at', r.created_at
         )) FROM comments r
         WHERE r.parent_id = c.id AND r.is_hidden = 0) AS replies
       FROM comments c
       WHERE c.id = ? AND c.is_hidden = 0
    `).get([id]);

    return { comment, locale };
  }
}

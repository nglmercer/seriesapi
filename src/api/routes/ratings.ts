import { getDrizzle } from "../../init";
import { ratingsTable } from "../../schema";
import { ok, badRequest, serverError, unauthorized } from "../response";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../i18n";
import { getUserFromToken } from "./auth";

export async function handleRatingPost(req: Request) {
  try {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const user = getUserFromToken(req);
    if (!user) {
      return unauthorized("Authentication required for rating", locale);
    }

    const body = await req.json() as { entity_type?: string; entity_id?: number; score?: number };
    
    if (!body.entity_type || !body.entity_id || typeof body.score !== "number") {
      return badRequest("Missing required fields (entity_type, entity_id, score)", locale);
    }
    
    if (body.score < 1 || body.score > 10) {
      return badRequest("Score must be between 1 and 10", locale);
    }

    const drizzle = getDrizzle();
    
    // Hash IP address
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const ipHashBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
    const ipHash = Array.from(new Uint8Array(ipHashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Check if rating already exists for this user + entity
    const existing = drizzle.select(ratingsTable)
      .select("id")
      .where("entity_type = ? AND entity_id = ? AND user_id = ?", 
        [body.entity_type, body.entity_id, user.id])
      .get();
      
    if (existing) {
      drizzle.update(ratingsTable)
        .set({ score: body.score, updated_at: new Date().toISOString() })
        .where("id = ?", [existing.id])
        .run();
    } else {
      drizzle.insert(ratingsTable).values({
        entity_type: body.entity_type,
        entity_id: body.entity_id,
        user_id: user.id,
        ip_hash: ipHash,
        score: body.score
      }).run();
    }

    // Get new average score
    const result = drizzle.query<{ avgScore: number, count: number }>(
      "SELECT avg(score) as avgScore, count(id) as count FROM ratings WHERE entity_type = ? AND entity_id = ?"
    ).get([body.entity_type, body.entity_id]);
    
    return ok({ average: result?.avgScore || 0, count: result?.count || 0 }, { locale });
  } catch (err) {
    return serverError(err, getLocaleFromRequest(req, SUPPORTED_LOCALES));
  }
}

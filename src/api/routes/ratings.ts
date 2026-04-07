import { getDrizzle } from "../../init";
import { ratingsTable, mediaTable, seasonsTable, episodesTable } from "../../schema";
import { ok, badRequest, serverError } from "../response";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../i18n";
import { getUserFromToken, withAuth } from "./auth";

export const handleRatingPost = withAuth(async (req: Request, user) => {
  try {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    
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
    let ipHash = "ip_unknown";
    try {
      const ipHashBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
      ipHash = Array.from(new Uint8Array(ipHashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn("[ratings] crypto.subtle failed, using fallback hash", e);
      // fallback simple hash
      let hash = 0;
      for (let i = 0; i < ip.length; i++) {
        hash = ((hash << 5) - hash) + ip.charCodeAt(i);
        hash = hash & hash;
      }
      ipHash = "ip_" + Math.abs(hash).toString(16);
    }
    
    // Check if rating already exists for this user + entity
    const existing = drizzle.select(ratingsTable)
      .select("id")
      .where("entity_type = ? AND entity_id = ? AND user_id = ?", 
        [body.entity_type, body.entity_id, user.id])
      .get() as { id: number } | undefined;
      
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
    const result = drizzle.query<{ avgScore: number | null, count: number }>(
      "SELECT avg(score) as avgScore, count(id) as count FROM ratings WHERE entity_type = ? AND entity_id = ?"
    ).get([body.entity_type, body.entity_id]);
    
    const newAverage = result?.avgScore ? Math.round(result.avgScore * 10) / 10 : 0;
    const newCount = result?.count ?? 0;

    // Synchronize aggregate scores to parent tables
    if (body.entity_type === "media") {
      drizzle.update(mediaTable)
        .set({ score: newAverage, score_count: newCount } as any)
        .where("id = ?", [body.entity_id])
        .run();
    } else if (body.entity_type === "season") {
      drizzle.update(seasonsTable)
        .set({ score: newAverage, score_count: newCount } as any)
        .where("id = ?", [body.entity_id])
        .run();
    } else if (body.entity_type === "episode") {
      drizzle.update(episodesTable)
        .set({ score: newAverage, score_count: newCount } as any)
        .where("id = ?", [body.entity_id])
        .run();
    }
    
    return ok({ average: newAverage, count: newCount }, { locale });
  } catch (err) {
    return serverError(err, getLocaleFromRequest(req, SUPPORTED_LOCALES));
  }
});

export async function handleRatingGet(req: Request) {
  try {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const url = new URL(req.url);
    const entity_type = url.searchParams.get("entity_type");
    const entity_id = parseInt(url.searchParams.get("entity_id") ?? "", 10);

    if (!entity_type || isNaN(entity_id)) {
      return badRequest("Missing required query parameters (entity_type, entity_id)", locale);
    }

    const drizzle = getDrizzle();
    const user = getUserFromToken(req);

    // Get average and count
    const stats = drizzle.query<{ avgScore: number | null, count: number }>(
      "SELECT avg(score) as avgScore, count(id) as count FROM ratings WHERE entity_type = ? AND entity_id = ?"
    ).get([entity_type, entity_id]);

    // Get user's rating if logged in
    let userScore = 0;
    if (user) {
      const userRating = drizzle.select(ratingsTable)
        .select("score")
        .where("entity_type = ? AND entity_id = ? AND user_id = ?", 
          [entity_type, entity_id, user.id])
        .get() as { score: number } | undefined;
      if (userRating) userScore = userRating.score;
    }

    return ok({
      average: stats?.avgScore ? Math.round(stats.avgScore * 10) / 10 : 0,
      count: stats?.count ?? 0,
      userScore
    }, { locale });
  } catch (err) {
    return serverError(err, getLocaleFromRequest(req, SUPPORTED_LOCALES));
  }
}

export async function handleTopRatings(req: Request) {
  try {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const url = new URL(req.url);
    const entity_type = url.searchParams.get("entity_type") || "media";
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const min_votes = parseInt(url.searchParams.get("min_votes") || "5", 10);

    const drizzle = getDrizzle();

    let results: any[] = [];

    if (entity_type === "media") {
      results = drizzle.query(`
        SELECT m.id, m.slug, m.score, m.score_count, m.content_type_id, mt.title, mt.synopsis_short
        FROM media m
        JOIN media_translations mt ON m.id = mt.media_id AND mt.locale = ?
        WHERE m.score_count >= ?
        ORDER BY m.score DESC, m.score_count DESC
        LIMIT ?
      `).all([locale, min_votes, limit]);
    } else if (entity_type === "episode") {
      results = drizzle.query(`
        SELECT e.id, e.media_id, e.season_id, e.episode_number, e.score, e.score_count, et.title
        FROM episodes e
        JOIN episode_translations et ON e.id = et.episode_id AND et.locale = ?
        WHERE e.score_count >= ?
        ORDER BY e.score DESC, e.score_count DESC
        LIMIT ?
      `).all([locale, min_votes, limit]);
    }

    return ok(results, { locale });
  } catch (err) {
    return serverError(err, getLocaleFromRequest(req, SUPPORTED_LOCALES));
  }
}

export const handleUserRatings = withAuth(async (req: Request, user) => {
  try {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const offset = (page - 1) * limit;

    const drizzle = getDrizzle();

    const results = drizzle.query(`
      SELECT r.id, r.entity_type, r.entity_id, r.score, r.created_at,
             CASE 
               WHEN r.entity_type = 'media' THEN (SELECT title FROM media_translations mt WHERE mt.media_id = r.entity_id AND mt.locale = ?)
               WHEN r.entity_type = 'episode' THEN (SELECT title FROM episode_translations et WHERE et.episode_id = r.entity_id AND et.locale = ?)
               ELSE NULL
             END as title,
             CASE 
               WHEN r.entity_type = 'media' THEN (SELECT slug FROM media m WHERE m.id = r.entity_id)
               ELSE NULL
             END as slug
      FROM ratings r
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `).all([locale, locale, user.id, limit, offset]);

    const total = drizzle.query<{ count: number }>(
      "SELECT count(id) as count FROM ratings WHERE user_id = ?"
    ).get([user.id])?.count || 0;

    return ok(results, { locale, total, page, pageSize: limit });
  } catch (err) {
    return serverError(err, getLocaleFromRequest(req, SUPPORTED_LOCALES));
  }
});

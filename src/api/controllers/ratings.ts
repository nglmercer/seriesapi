import { getDrizzle } from "../../init";
import { ratingsTable, mediaTable, seasonsTable, episodesTable } from "../../schema";
import type { AuthUser } from "../routes/auth/middleware";

export interface RatingResult {
  average: number;
  count: number;
}

export interface UserRatingResult extends RatingResult {
  userScore: number;
}

async function hashIp(ip: string): Promise<string> {
  try {
    const ipHashBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
    return Array.from(new Uint8Array(ipHashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
      hash = ((hash << 5) - hash) + ip.charCodeAt(i);
      hash = hash & hash;
    }
    return "ip_" + Math.abs(hash).toString(16);
  }
}

export async function getEntityIds(entityType: string, entityId: number): Promise<{
  mediaId: number | undefined;
  seasonId: number | undefined;
  episodeId: number | undefined;
}> {
  const drizzle = getDrizzle();
  
  if (entityType === "media") {
    return { mediaId: entityId, seasonId: undefined, episodeId: undefined };
  }
  if (entityType === "season") {
    const s = drizzle.query<{ media_id: number }>("SELECT media_id FROM seasons WHERE id = ?").get([entityId]);
    return { mediaId: s?.media_id, seasonId: entityId, episodeId: undefined };
  }
  if (entityType === "episode") {
    const e = drizzle.query<{ media_id: number, season_id: number | null }>("SELECT media_id, season_id FROM episodes WHERE id = ?").get([entityId]);
    return { mediaId: e?.media_id, seasonId: e?.season_id ?? undefined, episodeId: entityId };
  }
  return { mediaId: undefined, seasonId: undefined, episodeId: undefined };
}

export async function getRatingStats(entityType: string, entityId: number): Promise<RatingResult> {
  const drizzle = getDrizzle();
  const result = drizzle.query<{ avgScore: number | null, count: number }>(
    "SELECT avg(score) as avgScore, count(id) as count FROM ratings WHERE entity_type = ? AND entity_id = ?"
  ).get([entityType, entityId]);
  
  return {
    average: result?.avgScore ? Math.round(result.avgScore * 10) / 10 : 0,
    count: result?.count ?? 0,
  };
}

export async function syncAggregateScore(
  entityType: string,
  entityId: number,
  average: number,
  count: number
): Promise<void> {
  const drizzle = getDrizzle();
  
  if (entityType === "media") {
    drizzle.update(mediaTable).set({ score: average, score_count: count }).where("id = ?", [entityId]).run();
  } else if (entityType === "season") {
    drizzle.update(seasonsTable).set({ score: average, score_count: count }).where("id = ?", [entityId]).run();
  } else if (entityType === "episode") {
    drizzle.update(episodesTable).set({ score: average, score_count: count }).where("id = ?", [entityId]).run();
  }
}

export async function createOrUpdateRating(
  user: AuthUser,
  entityType: string,
  entityId: number,
  score: number,
  ip: string
): Promise<RatingResult> {
  const drizzle = getDrizzle();
  const ipHash = await hashIp(ip);
  const { mediaId, seasonId, episodeId } = await getEntityIds(entityType, entityId);
  
  const existing = drizzle.select(ratingsTable)
    .select("id")
    .where("entity_type = ? AND entity_id = ? AND user_id = ?", [entityType, entityId, user.id])
    .get() as { id: number } | undefined;
  
  if (existing) {
    drizzle.update(ratingsTable)
      .set({ score, media_id: mediaId, season_id: seasonId, episode_id: episodeId, updated_at: new Date().toISOString() })
      .where("id = ?", [existing.id])
      .run();
  } else {
    drizzle.insert(ratingsTable).values({
      entity_type: entityType,
      entity_id: entityId,
      media_id: mediaId,
      season_id: seasonId,
      episode_id: episodeId,
      user_id: user.id,
      ip_hash: ipHash,
      score,
    }).run();
  }
  
  const stats = await getRatingStats(entityType, entityId);
  await syncAggregateScore(entityType, entityId, stats.average, stats.count);
  
  return stats;
}

export async function getUserRating(user: AuthUser, entityType: string, entityId: number): Promise<number> {
  if (!user) return 0;
  
  const drizzle = getDrizzle();
  const userRating = drizzle.select(ratingsTable)
    .select("score")
    .where("entity_type = ? AND entity_id = ? AND user_id = ?", [entityType, entityId, user.id])
    .get() as { score: number } | undefined;
  
  return userRating?.score ?? 0;
}

export async function getRatingWithUserScore(
  user: AuthUser | null,
  entityType: string,
  entityId: number
): Promise<UserRatingResult> {
  const stats = await getRatingStats(entityType, entityId);
  const userScore = user ? await getUserRating(user, entityType, entityId) : 0;
  
  return {
    average: stats.average,
    count: stats.count,
    userScore,
  };
}

export interface TopRatedItem {
  id: number;
  score: number;
  score_count: number;
  title?: string;
  slug?: string;
  [key: string]: unknown;
}

export async function getTopRated(
  entityType: string,
  locale: string,
  limit: number,
  minVotes: number
): Promise<TopRatedItem[]> {
  const drizzle = getDrizzle();
  
  if (entityType === "media") {
    return drizzle.query(`
      SELECT m.id, m.slug, m.score, m.score_count, m.content_type_id, mt.title, mt.synopsis_short
      FROM media m
      JOIN media_translations mt ON m.id = mt.media_id AND mt.locale = ?
      WHERE m.score_count >= ?
      ORDER BY m.score DESC, m.score_count DESC
      LIMIT ?
    `).all([locale, minVotes, limit]) as TopRatedItem[];
  }
  if (entityType === "season") {
    return drizzle.query(`
      SELECT s.id, s.media_id, s.season_number, s.score, s.score_count, st.name as title
      FROM seasons s
      JOIN season_translations st ON s.id = st.season_id AND st.locale = ?
      WHERE s.score_count >= ?
      ORDER BY s.score DESC, s.score_count DESC
      LIMIT ?
    `).all([locale, minVotes, limit]) as TopRatedItem[];
  }
  if (entityType === "episode") {
    return drizzle.query(`
      SELECT e.id, e.media_id, e.season_id, e.episode_number, e.score, e.score_count, et.title
      FROM episodes e
      JOIN episode_translations et ON e.id = et.episode_id AND et.locale = ?
      WHERE e.score_count >= ?
      ORDER BY e.score DESC, e.score_count DESC
      LIMIT ?
    `).all([locale, minVotes, limit]) as TopRatedItem[];
  }
  return [];
}

export interface UserRatingItem {
  id: number;
  entity_type: string;
  entity_id: number;
  score: number;
  created_at: string;
  title?: string;
  slug?: string;
}

export async function getUserRatings(
  user: AuthUser,
  locale: string,
  limit: number,
  page: number
): Promise<{ items: UserRatingItem[]; total: number }> {
  const drizzle = getDrizzle();
  const offset = (page - 1) * limit;
  
  const items = drizzle.query(`
    SELECT r.id, r.entity_type, r.entity_id, r.score, r.created_at,
           CASE 
             WHEN r.entity_type = 'media' THEN (SELECT title FROM media_translations mt WHERE mt.media_id = r.entity_id AND mt.locale = ?)
             WHEN r.entity_type = 'season' THEN (SELECT name FROM season_translations st WHERE st.season_id = r.entity_id AND st.locale = ?)
             WHEN r.entity_type = 'episode' THEN (SELECT title FROM episode_translations et WHERE et.episode_id = r.entity_id AND et.locale = ?)
             ELSE NULL
           END as title,
           CASE 
             WHEN r.entity_type = 'media' THEN (SELECT slug FROM media m WHERE m.id = r.entity_id)
             WHEN r.entity_type = 'season' THEN (SELECT m.slug FROM media m JOIN seasons s ON s.media_id = m.id WHERE s.id = r.entity_id)
             WHEN r.entity_type = 'episode' THEN (SELECT m.slug FROM media m JOIN episodes e ON e.media_id = m.id WHERE e.id = r.entity_id)
             ELSE NULL
           END as slug
    FROM ratings r
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `).all([locale, locale, locale, user.id, limit, offset]) as UserRatingItem[];
  
  const total = drizzle.query<{ count: number }>(
    "SELECT count(id) as count FROM ratings WHERE user_id = ?"
  ).get([user.id])?.count || 0;
  
  return { items, total };
}
import { initializeDatabase, getDb } from "./src/init";
import { createRateLimiter, handlePreflight, corsHeaders } from "./src/middleware/ratelimit";

// ── route handlers ────────────────────────────────────────────────────────────
import {
  handleMediaList,
  handleMediaDetail,
  handleMediaSeasons,
  handleMediaEpisodes,
  handleMediaCredits,
  handleMediaImages,
  handleMediaVideos,
  handleMediaRelated,
  handleMediaComments,
} from "./src/api/routes/media";
import { handleSeasonDetail, handleSeasonEpisodes, handleSeasonImages } from "./src/api/routes/seasons";
import {
  handleEpisodeDetail,
  handleEpisodeCredits,
  handleEpisodeImages,
  handleEpisodeComments,
} from "./src/api/routes/episodes";
import { handlePeopleList, handlePersonDetail, handlePersonCredits } from "./src/api/routes/people";
import { handleGenresList, handleGenreMedia } from "./src/api/routes/genres";
import { handleCollectionsList, handleCollectionDetail } from "./src/api/routes/collections";
import { handleSearch } from "./src/api/routes/search";
import { handleCommentPost, handleCommentGet } from "./src/api/routes/comments";
import index from './web/index.html'
// ── config ────────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? "3000", 10);
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000", 10);
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX ?? "60", 10);

// ── helpers ───────────────────────────────────────────────────────────────────

function json404(): Response {
  return new Response(
    JSON.stringify({ ok: false, data: null, error: "Not Found" }),
    {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    },
  );
}

function json405(): Response {
  return new Response(
    JSON.stringify({ ok: false, data: null, error: "Method Not Allowed" }),
    {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    },
  );
}

/** Extract a numeric segment from a URL path array, return NaN if invalid. */
function seg(parts: string[], index: number): number {
  return parseInt(parts[index] ?? "", 10);
}

// ── router ────────────────────────────────────────────────────────────────────

function route(req: Request): Response | Promise<Response> {
  const url = new URL(req.url);
  // strip trailing slash, split on /
  const parts = url.pathname.replace(/\/$/, "").split("/").filter(Boolean);
  // parts[0] = "api", parts[1] = "v1", parts[2] = resource, ...
  const [, , resource, p3, p4] = parts;
  const GET = req.method === "GET";
  const POST = req.method === "POST";
  const db = getDb();

  // ── /api/v1/health ─────────────────────────────────────────────────────────
  if (resource === "health" && GET) {
    return new Response(
      JSON.stringify({ ok: true, status: "online", ts: new Date().toISOString() }),
      { headers: { "Content-Type": "application/json", ...corsHeaders() } },
    );
  }

  // ── /api/v1/search ─────────────────────────────────────────────────────────
  if (resource === "search" && GET) return handleSearch(req, db);

  // ── /api/v1/genres ─────────────────────────────────────────────────────────
  if (resource === "genres") {
    if (!GET) return json405();
    if (!p3) return handleGenresList(req, db);
    return handleGenreMedia(req, db, p3); // p3 = slug
  }

  // ── /api/v1/collections ────────────────────────────────────────────────────
  if (resource === "collections") {
    if (!GET) return json405();
    if (!p3) return handleCollectionsList(req, db);
    return handleCollectionDetail(req, db, p3); // p3 = slug
  }

  // ── /api/v1/people ─────────────────────────────────────────────────────────
  if (resource === "people") {
    if (!GET) return json405();
    if (!p3) return handlePeopleList(req, db);
    const id = seg(parts, 3);
    if (isNaN(id)) return json404();
    if (!p4) return handlePersonDetail(req, db, id);
    if (p4 === "credits") return handlePersonCredits(req, db, id);
    return json404();
  }

  // ── /api/v1/media ──────────────────────────────────────────────────────────
  if (resource === "media") {
    if (!GET) return json405();
    if (!p3) return handleMediaList(req, db);
    const id = seg(parts, 3);
    if (isNaN(id)) return json404();
    if (!p4) return handleMediaDetail(req, db, id);
    if (p4 === "seasons")  return handleMediaSeasons(req, db, id);
    if (p4 === "episodes") return handleMediaEpisodes(req, db, id);
    if (p4 === "credits")  return handleMediaCredits(req, db, id);
    if (p4 === "images")   return handleMediaImages(req, db, id);
    if (p4 === "videos")   return handleMediaVideos(req, db, id);
    if (p4 === "related")  return handleMediaRelated(req, db, id);
    if (p4 === "comments") return handleMediaComments(req, db, id);
    return json404();
  }

  // ── /api/v1/seasons ────────────────────────────────────────────────────────
  if (resource === "seasons") {
    if (!GET) return json405();
    const id = seg(parts, 3);
    if (isNaN(id)) return json404();
    if (!p4) return handleSeasonDetail(req, db, id);
    if (p4 === "episodes") return handleSeasonEpisodes(req, db, id);
    if (p4 === "images")   return handleSeasonImages(req, db, id);
    return json404();
  }

  // ── /api/v1/episodes ───────────────────────────────────────────────────────
  if (resource === "episodes") {
    if (!GET) return json405();
    const id = seg(parts, 3);
    if (isNaN(id)) return json404();
    if (!p4) return handleEpisodeDetail(req, db, id);
    if (p4 === "credits")  return handleEpisodeCredits(req, db, id);
    if (p4 === "images")   return handleEpisodeImages(req, db, id);
    if (p4 === "comments") return handleEpisodeComments(req, db, id);
    return json404();
  }

  // ── /api/v1/comments ───────────────────────────────────────────────────────
  if (resource === "comments") {
    if (POST && !p3) return handleCommentPost(req, db);
    if (GET && p3) {
      const id = seg(parts, 3);
      if (!isNaN(id)) return handleCommentGet(req, db, id);
    }
    return GET ? json404() : json405();
  }

  return json404();
}

// ── server ────────────────────────────────────────────────────────────────────

await initializeDatabase();

const limiter = createRateLimiter({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
});

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    // CORS pre-flight
    const preflight = handlePreflight(req);
    if (preflight) return preflight;

    // Rate-limit check (applied to all non-OPTIONS requests)
    const limited = limiter.check(req);
    if (limited) return limited;

    // Route
    try {
      return await route(req);
    } catch (err) {
      console.error("[anima] Unhandled error:", err);
      return new Response(
        JSON.stringify({ ok: false, data: null, error: "Internal Server Error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        },
      );
    }
  },
  routes:{
    "/": index,
  }
});

console.log(`[anima] Listening on http://localhost:${server.port}`);
console.log(`[anima] Rate limit: ${RATE_LIMIT_MAX} req / ${RATE_LIMIT_WINDOW_MS / 1000}s`);

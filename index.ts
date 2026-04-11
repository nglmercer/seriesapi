import { initializeDatabase, getDb } from "./src/init";
import { createRateLimiter, handlePreflight, corsHeaders, HttpMethod, HttpHeader, ContentType, HttpStatus } from "./src/middleware/ratelimit";

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
  handleMediaBulkUpdate,
} from "./src/api/routes/media";
import {
  handleSeasonDetail,
  handleSeasonEpisodes,
  handleSeasonImages,
  handleSeasonComments,
  handleSeasonCreate,
  handleSeasonUpdate,
  handleSeasonDelete,
} from "./src/api/routes/seasons";
import {
  handleEpisodeDetail,
  handleEpisodeCredits,
  handleEpisodeImages,
  handleEpisodeComments,
  handleEpisodeCreate,
  handleEpisodeUpdate,
  handleEpisodeDelete,
} from "./src/api/routes/episodes";
import { handlePeopleList, handlePersonDetail, handlePersonCredits } from "./src/api/routes/people";
import { handleGenresList, handleGenreMedia } from "./src/api/routes/genres";
import { handleTagsList } from "./src/api/routes/tags";
import { handleCollectionsList, handleCollectionDetail } from "./src/api/routes/collections";
import { handleSearch } from "./src/api/routes/search";
import { handleCommentPost, handleCommentGet, handleUserComments } from "./src/api/routes/comments";
import { handleRegister, handleLogin, handleLogout, handleMe, getUserFromToken, handleVerifyCodeGenerate, handleVerifyCodeApply, handleUserUpdate, handleAuthRouter } from "./src/api/routes/auth";
import { handleReportCreate, handleReportList } from "./src/api/routes/reports";
import { handleRatingPost, handleRatingGet, handleTopRatings, handleUserRatings } from "./src/api/routes/ratings";
import { ok, badRequest, unauthorized, forbidden, notFound, methodNotAllowed, serverError } from "./src/api/response";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "./src/i18n";
import admin_view from './web/admin.html'
import public_view from './web/index.html'
// ── config ────────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? "3000", 10);
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000", 10);
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX ?? "60", 10);

/** Extract a numeric segment from a URL path array, return NaN if invalid. */
function seg(parts: string[], index: number): number {
  return parseInt(parts[index] ?? "", 10);
}

// ── router ────────────────────────────────────────────────────────────────────

function route(req: Request): Response | Promise<Response> {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  const url = new URL(req.url);
  // strip trailing slash, split on /
  const parts = url.pathname.replace(/\/$/, "").split("/").filter(Boolean);
  
  // Verify API prefix: parts[0] = "api", parts[1] = "v1"
  if (parts[0] !== "api" || parts[1] !== "v1") {
    return notFound("API Route", locale);
  }

  // parts[2] = resource, ...
  const [, , resource, p3, p4] = parts;
  const GET = req.method === HttpMethod.GET;
  const POST = req.method === HttpMethod.POST;
  const db = getDb();

  // ── /api/v1/health ─────────────────────────────────────────────────────────
  if (resource === "health" && GET) {
    return ok({ status: "online", ts: new Date().toISOString() }, { locale });
  }

  // ── /api/v1/search ─────────────────────────────────────────────────────────
  if (resource === "search" && GET) return handleSearch(req, db);

  // ── /api/v1/genres ─────────────────────────────────────────────────────────
  if (resource === "genres") {
    if (!GET) return methodNotAllowed(locale);
    if (!p3) return handleGenresList(req, db);
    return handleGenreMedia(req, db, p3); // p3 = slug
  }

  // ── /api/v1/tags ───────────────────────────────────────────────────────────
  if (resource === "tags") {
    if (!GET) return methodNotAllowed(locale);
    return handleTagsList(req, db);
  }

  // ── /api/v1/collections ────────────────────────────────────────────────────
  if (resource === "collections") {
    if (!GET) return methodNotAllowed(locale);
    if (!p3) return handleCollectionsList(req, db);
    return handleCollectionDetail(req, db, p3); // p3 = slug
  }

  // ── /api/v1/people ─────────────────────────────────────────────────────────
  if (resource === "people") {
    if (!GET) return methodNotAllowed(locale);
    if (!p3) return handlePeopleList(req, db);
    const id = seg(parts, 3);
    if (isNaN(id)) return notFound("Person", locale);
    if (!p4) return handlePersonDetail(req, db, id);
    if (p4 === "credits") return handlePersonCredits(req, db, id);
    return notFound("Resource", locale);
  }

  // ── /api/v1/media ──────────────────────────────────────────────────────────
  if (resource === "media") {
    if (POST && p3 === "bulk") return handleMediaBulkUpdate(req, db);
    if (!GET) return methodNotAllowed(locale);
    if (!p3) return handleMediaList(req, db);
    const id = seg(parts, 3);
    if (isNaN(id)) return notFound("Media", locale);
    if (!p4) return handleMediaDetail(req, db, id);
    if (p4 === "seasons")  return handleMediaSeasons(req, db, id);
    if (p4 === "episodes") return handleMediaEpisodes(req, db, id);
    if (p4 === "credits")  return handleMediaCredits(req, db, id);
    if (p4 === "images")   return handleMediaImages(req, db, id);
    if (p4 === "videos")   return handleMediaVideos(req, db, id);
    if (p4 === "related")  return handleMediaRelated(req, db, id);
    if (p4 === "comments") return handleMediaComments(req, db, id);
    return notFound("Resource", locale);
  }

  // ── /api/v1/seasons ────────────────────────────────────────────────────────
  if (resource === "seasons") {
    if (GET) {
      const id = seg(parts, 3);
      if (isNaN(id)) return notFound("Season", locale);
      if (!p4) return handleSeasonDetail(req, db, id);
      if (p4 === "episodes") return handleSeasonEpisodes(req, db, id);
      if (p4 === "images")   return handleSeasonImages(req, db, id);
      if (p4 === "comments") return handleSeasonComments(req, db, id);
      return notFound("Resource", locale);
    }
    
    if (POST) return handleSeasonCreate(req);
    return (req.method === HttpMethod.PUT ? handleSeasonUpdate(req) : req.method === HttpMethod.DELETE ? handleSeasonDelete(req) : methodNotAllowed(locale));
  }

  // ── /api/v1/episodes ───────────────────────────────────────────────────────
  if (resource === "episodes") {
    if (GET) {
      const id = seg(parts, 3);
      if (isNaN(id)) return notFound("Episode", locale);
      if (!p4) return handleEpisodeDetail(req, db, id);
      if (p4 === "credits")  return handleEpisodeCredits(req, db, id);
      if (p4 === "images")   return handleEpisodeImages(req, db, id);
      if (p4 === "comments") return handleEpisodeComments(req, db, id);
      return notFound("Resource", locale);
    }

    if (POST) return handleEpisodeCreate(req);
    return (req.method === HttpMethod.PUT ? handleEpisodeUpdate(req) : req.method === HttpMethod.DELETE ? handleEpisodeDelete(req) : methodNotAllowed(locale));
  }

  // ── /api/v1/comments ───────────────────────────────────────────────────────
  if (resource === "comments") {
    if (GET && p3 === "user") return handleUserComments(req);
    if (POST && !p3) return handleCommentPost(req);
    if (GET && p3) {
      const id = seg(parts, 3);
      if (!isNaN(id)) return handleCommentGet(req, db, id);
    }
    return GET ? notFound("Comment", locale) : methodNotAllowed(locale);
  }

  // ── /api/v1/reports ────────────────────────────────────────────────────────
  if (resource === "reports") {
    if (POST) return handleReportCreate(req);
    if (GET) return handleReportList(req);
    return notFound("Report", locale);
  }

  // ── /api/v1/ratings ───────────────────────────────────────────────────
  if (resource === "ratings") {
    if (GET && p3 === "user") return handleUserRatings(req);
    if (GET && p3 === "top") return handleTopRatings(req);
    if (POST) return handleRatingPost(req);
    if (GET) return handleRatingGet(req);
    return notFound("Rating", locale);
  }

  // ── /api/v1/auth ───────────────────────────────────────────────────────────
  if (resource === "auth") {
    return handleAuthRouter(req, parts);
  }
  return notFound("API Route", locale);
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

    const url = new URL(req.url);
    const path = url.pathname;
    console.log(`[anima] Request: ${path}`);
    // Route
    if (path.startsWith("/api/")) {
      return await route(req);
    }
    return new Response(
      JSON.stringify({ ok: false, data: null, error: "Internal Server Error" }),
      {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        headers: { [HttpHeader.CONTENT_TYPE]: ContentType.JSON, ...corsHeaders(req.headers.get(HttpHeader.ORIGIN.toLowerCase())) },
      },
    );
  },
  routes: {
    '/': public_view,
    '/admin': admin_view
  }
});

console.log(`[anima] Listening on http://localhost:${server.port}`);
console.log(`[anima] Rate limit: ${RATE_LIMIT_MAX} req / ${RATE_LIMIT_WINDOW_MS / 1000}s`);

import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../i18n";
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
} from "./routes/media";
import { handleSeasonRouter } from "./routes/seasons";
import {
  handleEpisodeDetail,
  handleEpisodeCredits,
  handleEpisodeImages,
  handleEpisodeComments,
  handleEpisodeNeighbors,
  handleEpisodeCreate,
  handleEpisodeUpdate,
  handleEpisodeDelete,
  handleEpisodeViews,
} from "./routes/episodes";
import { handlePeopleList, handlePersonDetail, handlePersonCredits } from "./routes/people";
import { handleGenresList, handleGenreMedia } from "./routes/genres";
import { handleTagsList } from "./routes/tags";
import { handleCollectionsList, handleCollectionDetail } from "./routes/collections";
import { handleSearch } from "./routes/search";
import { handleCommentPost, handleCommentGet, handleUserComments } from "./routes/comments";
import { handleAuthRouter } from "./routes/auth";
import { handleReportCreate, handleReportList } from "./routes/reports";
import { handleRatingPost, handleRatingGet, handleTopRatings, handleUserRatings } from "./routes/ratings";
import { ok, methodNotAllowed, notFound } from "./response";

function seg(parts: string[], index: number): number {
  return parseInt(parts[index] ?? "", 10);
}

export function createRouteHandler(getDbFn: () => any) {
  return function route(req: Request): Response | Promise<Response> {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const url = new URL(req.url);
    const parts = url.pathname.replace(/\/$/, "").split("/").filter(Boolean);
    
    if (parts[0] !== "api" || parts[1] !== "v1") {
      return notFound("API Route", locale);
    }

    const [, , resource, p3, p4] = parts;
    const GET = req.method === "GET";
    const POST = req.method === "POST";
    const db = getDbFn();

    if (resource === "health" && GET) {
      return ok({ status: "online", ts: new Date().toISOString() }, { locale });
    }

    if (resource === "search" && GET) return handleSearch(req, db);

    if (resource === "genres") {
      if (!GET) return methodNotAllowed(locale);
      if (!p3) return handleGenresList(req, db);
      return handleGenreMedia(req, db, p3);
    }

    if (resource === "tags") {
      if (!GET) return methodNotAllowed(locale);
      return handleTagsList(req, db);
    }

    if (resource === "collections") {
      if (!GET) return methodNotAllowed(locale);
      if (!p3) return handleCollectionsList(req, db);
      return handleCollectionDetail(req, db, p3);
    }

    if (resource === "people") {
      if (!GET) return methodNotAllowed(locale);
      if (!p3) return handlePeopleList(req, db);
      const id = seg(parts, 3);
      if (isNaN(id)) return notFound("Person", locale);
      if (!p4) return handlePersonDetail(req, db, id);
      if (p4 === "credits") return handlePersonCredits(req, db, id);
      return notFound("Resource", locale);
    }

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

    if (resource === "seasons") {
      return handleSeasonRouter(req, db, parts);
    }

    if (resource === "episodes") {
      if (GET) {
        const id = seg(parts, 3);
        if (isNaN(id)) return notFound("Episode", locale);
        if (!p4) return handleEpisodeDetail(req, db, id);
        if (p4 === "credits")  return handleEpisodeCredits(req, db, id);
        if (p4 === "images")   return handleEpisodeImages(req, db, id);
        if (p4 === "comments") return handleEpisodeComments(req, db, id);
        if (p4 === "neighbors") return handleEpisodeNeighbors(req, db, id);
        return notFound("Resource", locale);
      }
      if (POST) {
        if (!p3) return handleEpisodeCreate(req);
        
        const id = seg(parts, 3);
        if (!isNaN(id) && p4 === "views") return handleEpisodeViews(req, db, id);
        return notFound("Resource", locale);
      }
      if (req.method === "PUT") return handleEpisodeUpdate(req);
      if (req.method === "DELETE") return handleEpisodeDelete(req);
      return methodNotAllowed(locale);
    }

    if (resource === "comments") {
      if (GET && p3 === "user") return handleUserComments(req);
      if (POST && !p3) return handleCommentPost(req);
      if (GET && p3) {
        const id = seg(parts, 3);
        if (!isNaN(id)) return handleCommentGet(req, db, id);
      }
      return GET ? notFound("Comment", locale) : methodNotAllowed(locale);
    }

    if (resource === "reports") {
      if (POST) return handleReportCreate(req);
      if (GET) return handleReportList(req);
      return notFound("Report", locale);
    }

    if (resource === "ratings") {
      if (GET && p3 === "user") return handleUserRatings(req);
      if (GET && p3 === "top") return handleTopRatings(req);
      if (POST) return handleRatingPost(req);
      if (GET) return handleRatingGet(req);
      return notFound("Rating", locale);
    }

    if (resource === "auth") {
      return handleAuthRouter(req, parts);
    }

    return notFound("API Route", locale);
  };
}
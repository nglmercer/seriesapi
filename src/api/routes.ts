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
import { ApiContext } from "./context";
import type { SqliteNapiAdapter } from "../core/driver";

export function createRouteHandler() {
  return function route(req: Request): Response | Promise<Response> {
    const ctx = ApiContext.from(req);

    if (ctx.parts[0] !== "api" || ctx.parts[1] !== "v1") {
      return notFound("API Route", ctx.locale);
    }


    const { resource, p3, p4, GET, POST, locale, db } = ctx;

    if (resource === "health" && GET) {
      return ok({ status: "online", ts: new Date().toISOString() }, { locale });
    }

    if (resource === "search" && GET) return handleSearch(ctx);

    if (resource === "genres") {
      if (!GET) return methodNotAllowed(locale);
      if (!p3) return handleGenresList(ctx);
      return handleGenreMedia(ctx, p3);
    }


    if (resource === "tags") {
      if (!GET) return methodNotAllowed(locale);
      return handleTagsList(ctx);
    }


    if (resource === "collections") {
      if (!GET) return methodNotAllowed(locale);
      if (!p3) return handleCollectionsList(req, db);
      return handleCollectionDetail(req, db, p3);
    }

    if (resource === "people") {
      if (!GET) return methodNotAllowed(locale);
      if (!p3) return handlePeopleList(ctx);
      const id = ctx.seg(3);
      if (isNaN(id)) return notFound("Person", locale);
      if (!p4) return handlePersonDetail(ctx, id);
      if (p4 === "credits") return handlePersonCredits(ctx, id);
      return notFound("Resource", locale);
    }


    if (resource === "media") {
      if (POST && p3 === "bulk") return handleMediaBulkUpdate(ctx);
      if (!GET) return methodNotAllowed(locale);
      if (!p3) return handleMediaList(ctx);
      const id = ctx.seg(3);
      if (isNaN(id)) return notFound("Media", locale);
      if (!p4) return handleMediaDetail(ctx, id);
      if (p4 === "seasons") return handleMediaSeasons(ctx, id);
      if (p4 === "episodes") return handleMediaEpisodes(ctx, id);
      if (p4 === "credits") return handleMediaCredits(ctx, id);
      if (p4 === "images") return handleMediaImages(ctx, id);
      if (p4 === "videos") return handleMediaVideos(ctx, id);
      if (p4 === "related") return handleMediaRelated(ctx, id);
      if (p4 === "comments") return handleMediaComments(ctx, id);
      return notFound("Resource", locale);
    }

    if (resource === "seasons") {
      return handleSeasonRouter(ctx);
    }

    if (resource === "episodes") {
      if (GET) {
        const id = ctx.seg(3);
        if (isNaN(id)) return notFound("Episode", locale);
        if (!p4) return handleEpisodeDetail(ctx, id);
        if (p4 === "credits") return handleEpisodeCredits(ctx, id);
        if (p4 === "images") return handleEpisodeImages(ctx, id);
        if (p4 === "comments") return handleEpisodeComments(ctx, id);
        if (p4 === "neighbors") return handleEpisodeNeighbors(ctx, id);
        return notFound("Resource", locale);
      }
      if (POST) {
        if (!p3) return handleEpisodeCreate(req);

        const id = ctx.seg(3);
        if (!isNaN(id) && p4 === "views") return handleEpisodeViews(ctx, id);
        return notFound("Resource", locale);
      }
      if (ctx.PUT) return handleEpisodeUpdate(req);
      if (ctx.DELETE) return handleEpisodeDelete(req);
      return methodNotAllowed(locale);
    }


    if (resource === "comments") {
      if (GET && p3 === "user") return handleUserComments(req);
      if (POST && !p3) return handleCommentPost(req);
      if (GET && p3) {
        const id = ctx.seg(3);
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
      return handleAuthRouter(req, ctx.parts);
    }

    return notFound("API Route", locale);
  };
}
/**
 * /api/v1/episodes/:id  –  Episode-level routes
 *
 * GET  /api/v1/episodes/:id           – episode detail
 * GET  /api/v1/episodes/:id/credits   – guest cast & crew for this episode
 * GET  /api/v1/episodes/:id/images    – stills / thumbnails
 * GET  /api/v1/episodes/:id/comments  – threaded comments
 * GET  /api/v1/episodes/:id/neighbors – previous/next episode
 */

import { ok, notFound, serverError } from "../response";
import { EpisodeController } from "../controllers/episode.controller";
import { EpisodeView } from "../views/episode.view";
import { withAdmin } from "./auth";
import { episodeCreateSchema, episodeUpdateSchema } from "../validation";
import { ApiContext } from "../context";

export function handleEpisodeDetail(ctx: ApiContext, id: number): Response {
  try {
    const { episode, locale } = EpisodeController.getDetail(ctx, id);
    if (!episode) return ctx.notFound("Episode");
    return ctx.ok(EpisodeView.formatDetail(episode), { locale });
  } catch (err) {
    return serverError(err, ctx.locale);
  }
}

export function handleEpisodeCredits(ctx: ApiContext, episodeId: number): Response {
  try {
    const { rows, locale, total } = EpisodeController.getCredits(ctx, episodeId);
    return ctx.ok(EpisodeView.formatCredits(rows), { locale, total });
  } catch (err) {
    return serverError(err, ctx.locale);
  }
}

export function handleEpisodeImages(ctx: ApiContext, episodeId: number): Response {
  try {
    const { rows, locale, total } = EpisodeController.getImages(ctx, episodeId);
    return ctx.ok(EpisodeView.formatImages(rows), { locale, total });
  } catch (err) {
    return serverError(err, ctx.locale);
  }
}

export function handleEpisodeComments(ctx: ApiContext, episodeId: number): Response {
  try {
    const result = EpisodeController.getComments(ctx, episodeId);
    if ("error" in result) return result.error as Response;
    const { rows, locale, page, pageSize, total } = result;
    return ctx.ok(EpisodeView.formatComments(rows!), { locale: locale!, page, pageSize, total });
  } catch (err) {
    return serverError(err, ctx.locale);
  }
}

export function handleEpisodeNeighbors(ctx: ApiContext, episodeId: number): Response {
  try {
    const result = EpisodeController.getNeighbors(ctx, episodeId);
    if ("error" in result) return result.error as Response;
    return ctx.ok(result);
  } catch (err) {
    return serverError(err, ctx.locale);
  }
}

export const handleEpisodeCreate = withAdmin(async (req: Request) => {
  const ctx = ApiContext.from(req);
  try {
    const v = await ctx.body(episodeCreateSchema);
    if (!v.success) return v.error;
    const result = EpisodeController.create(ctx, v.data);
    return ctx.ok(result);
  } catch (err) {
    return serverError(err, ctx.locale);
  }
});

export const handleEpisodeUpdate = withAdmin(async (req: Request) => {
  const ctx = ApiContext.from(req);
  try {
    const id = ctx.seg(3);
    if (isNaN(id)) return ctx.notFound("Episode");

    const v = await ctx.body(episodeUpdateSchema);
    if (!v.success) return v.error;

    const result = EpisodeController.update(ctx, id, v.data);
    return ctx.ok(result);
  } catch (err) {
    return serverError(err, ctx.locale);
  }
});

export const handleEpisodeDelete = withAdmin(async (req: Request) => {
  const ctx = ApiContext.from(req);
  try {
    const id = ctx.seg(3);
    if (isNaN(id)) return ctx.notFound("Episode");

    const result = EpisodeController.delete(ctx, id);
    return ctx.ok(result);
  } catch (err) {
    return serverError(err, ctx.locale);
  }
});

export const handleEpisodeViews = async (ctx: ApiContext, id: number): Promise<Response> => {
  try {
    if (isNaN(id)) return ctx.notFound("Episode");
    const result = EpisodeController.incrementView(ctx, id);
    if ("error" in result) {
      if (result.error?.status === 404) return ctx.notFound("Episode");
      return serverError("Internal server error", ctx.locale);
    }
    return ctx.ok(result);
  } catch (err) {
    return serverError(err, ctx.locale);
  }
};

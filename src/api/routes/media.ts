/**
 * /api/v1/media  –  Media catalogue routes
 *
 * GET  /api/v1/media                  – paginated list (filter by type/genre/status)
 * GET  /api/v1/media/:id              – single media detail
 * GET  /api/v1/media/:id/seasons      – seasons for a media entry
 * GET  /api/v1/media/:id/episodes     – flat episode list (movies / OVAs)
 * GET  /api/v1/media/:id/credits      – cast & crew
 * GET  /api/v1/media/:id/images       – all images
 * GET  /api/v1/media/:id/videos       – trailers / openings / endings
 * GET  /api/v1/media/:id/related      – related titles
 * GET  /api/v1/media/:id/comments     – public comments
 */

import { ok, notFound, badRequest, serverError } from "../response";
import { MediaController } from "../controllers/media.controller";
import { MediaView } from "../views/media.view";
import { ApiContext } from "../context";

export function handleMediaList(ctx: ApiContext): Response {
  try {
    const result = MediaController.getList(ctx);
    if ("error" in result) return result.error as Response;
    const { data, params } = result;
    return ctx.ok(MediaView.formatList(data), params);
  } catch (err) { return serverError(err, ctx.locale); }
}

export function handleMediaDetail(ctx: ApiContext, id: number): Response {
  try {
    const result = MediaController.getDetail(ctx, id);
    if (!result) return ctx.notFound("Media");
    return ctx.ok(MediaView.formatDetail(result.detail), { locale: result.locale });
  } catch (err) { return serverError(err, ctx.locale); }
}

export function handleMediaSeasons(ctx: ApiContext, mediaId: number): Response {
  try {
    const { rows, locale, total } = MediaController.getSeasons(ctx, mediaId);
    return ctx.ok(MediaView.formatSeasons(rows), { locale, total });
  } catch (err) { return serverError(err, ctx.locale); }
}

export function handleMediaEpisodes(ctx: ApiContext, mediaId: number): Response {
  try {
    const result = MediaController.getEpisodes(ctx, mediaId);
    if ("error" in result) return result.error as Response;
    const { rows, params } = result;
    return ctx.ok(MediaView.formatEpisodes(rows), params);
  } catch (err) { return serverError(err, ctx.locale); }
}

export function handleMediaCredits(ctx: ApiContext, mediaId: number): Response {
  try {
    const { credits, locale } = MediaController.getCredits(ctx, mediaId);
    return ctx.ok(MediaView.formatCredits(credits), { locale });
  } catch (err) { return serverError(err, ctx.locale); }
}

export function handleMediaImages(ctx: ApiContext, mediaId: number): Response {
  try {
    const result = MediaController.getImages(ctx, mediaId);
    if ("error" in result) return result.error as Response;
    const { rows, locale, total } = result;
    return ctx.ok(MediaView.formatImages(rows), { locale, total });
  } catch (err) { return serverError(err, ctx.locale); }
}

export function handleMediaVideos(ctx: ApiContext, mediaId: number): Response {
  try {
    const { rows, locale, total } = MediaController.getVideos(ctx, mediaId);
    return ctx.ok(MediaView.formatVideos(rows), { locale, total });
  } catch (err) { return serverError(err, ctx.locale); }
}

export function handleMediaRelated(ctx: ApiContext, mediaId: number): Response {
  try {
    const { rows, locale, total } = MediaController.getRelated(ctx, mediaId);
    return ctx.ok(MediaView.formatRelated(rows), { locale, total });
  } catch (err) { return serverError(err, ctx.locale); }
}

export function handleMediaComments(ctx: ApiContext, mediaId: number): Response {
  try {
    const result = MediaController.getComments(ctx, mediaId);
    if ("error" in result) return result.error as Response;
    const { rows, params } = result;
    return ctx.ok(MediaView.formatComments(rows), params);
  } catch (err) { return serverError(err, ctx.locale); }
}

export async function handleMediaBulkUpdate(ctx: ApiContext): Promise<Response> {
  try {
    const result = await MediaController.bulkUpdate(ctx);
    if ("error" in result) return ctx.badRequest(result.error as string);
    return ctx.ok({ success: true });
  } catch (err) { return serverError(err, ctx.locale); }
}

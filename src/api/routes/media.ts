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

import type { Database } from "sqlite-napi";
import { ok, notFound, badRequest, serverError } from "../response";
import { MediaController } from "../controllers/media.controller";
import { MediaView } from "../views/media.view";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../i18n";

export function handleMediaList(req: Request, _db: Database): Response {
  try {
    const result = MediaController.getList(req);
    if ("error" in result) return result.error as Response;
    const { data, params } = result;
    return ok(MediaView.formatList(data), params);
  } catch (err) { return serverError(err, getLocaleFromRequest(req, SUPPORTED_LOCALES)); }
}

export function handleMediaDetail(req: Request, _db: Database, id: number): Response {
  try {
    const result = MediaController.getDetail(req, id);
    if (!result) return notFound("Media", getLocaleFromRequest(req, SUPPORTED_LOCALES));
    return ok(MediaView.formatDetail(result.detail), { locale: result.locale });
  } catch (err) { return serverError(err, getLocaleFromRequest(req, SUPPORTED_LOCALES)); }
}

export function handleMediaSeasons(req: Request, _db: Database, mediaId: number): Response {
  try {
    const { rows, locale, total } = MediaController.getSeasons(req, mediaId);
    if (!rows.length) return notFound("Seasons", locale);
    return ok(MediaView.formatSeasons(rows), { locale, total });
  } catch (err) { return serverError(err, getLocaleFromRequest(req, SUPPORTED_LOCALES)); }
}

export function handleMediaEpisodes(req: Request, _db: Database, mediaId: number): Response {
  try {
    const result = MediaController.getEpisodes(req, mediaId);
    if ("error" in result) return result.error as Response;
    const { rows, params } = result;
    return ok(MediaView.formatEpisodes(rows), params);
  } catch (err) { return serverError(err, getLocaleFromRequest(req, SUPPORTED_LOCALES)); }
}

export function handleMediaCredits(req: Request, _db: Database, mediaId: number): Response {
  try {
    const { credits, locale } = MediaController.getCredits(req, mediaId);
    return ok(MediaView.formatCredits(credits), { locale });
  } catch (err) { return serverError(err, getLocaleFromRequest(req, SUPPORTED_LOCALES)); }
}

export function handleMediaImages(req: Request, _db: Database, mediaId: number): Response {
  try {
    const result = MediaController.getImages(req, mediaId);
    if ("error" in result) return result.error as Response;
    const { rows, locale, total } = result;
    return ok(MediaView.formatImages(rows), { locale, total });
  } catch (err) { return serverError(err, getLocaleFromRequest(req, SUPPORTED_LOCALES)); }
}

export function handleMediaVideos(req: Request, _db: Database, mediaId: number): Response {
  try {
    const { rows, locale, total } = MediaController.getVideos(req, mediaId);
    return ok(MediaView.formatVideos(rows), { locale, total });
  } catch (err) { return serverError(err, getLocaleFromRequest(req, SUPPORTED_LOCALES)); }
}

export function handleMediaRelated(req: Request, _db: Database, mediaId: number): Response {
  try {
    const { rows, locale, total } = MediaController.getRelated(req, mediaId);
    return ok(MediaView.formatRelated(rows), { locale, total });
  } catch (err) { return serverError(err, getLocaleFromRequest(req, SUPPORTED_LOCALES)); }
}

export function handleMediaComments(req: Request, _db: Database, mediaId: number): Response {
  try {
    const result = MediaController.getComments(req, mediaId);
    if ("error" in result) return result.error as Response;
    const { rows, params } = result;
    return ok(MediaView.formatComments(rows), params);
  } catch (err) { return serverError(err, getLocaleFromRequest(req, SUPPORTED_LOCALES)); }
}

export async function handleMediaBulkUpdate(req: Request, _db: Database): Promise<Response> {
  try {
    const result = await MediaController.bulkUpdate(req);
    if ("error" in result) return badRequest(result.error as string, getLocaleFromRequest(req, SUPPORTED_LOCALES));
    return ok({ success: true }, { locale: getLocaleFromRequest(req, SUPPORTED_LOCALES) });
  } catch (err) { return serverError(err, getLocaleFromRequest(req, SUPPORTED_LOCALES)); }
}

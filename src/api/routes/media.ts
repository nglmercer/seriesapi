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
import { ok, notFound, serverError } from "../response";
import { MediaController } from "../controllers/media.controller";
import { MediaView } from "../views/media.view";

export function handleMediaList(req: Request, _db: Database): Response {
  try {
    const { data, params } = MediaController.getList(req);
    return ok(MediaView.formatList(data), params);
  } catch (err) { return serverError(err, "en"); }
}

export function handleMediaDetail(req: Request, _db: Database, id: number): Response {
  try {
    const result = MediaController.getDetail(req, id);
    if (!result) return notFound("Media", "en");
    return ok(MediaView.formatDetail(result.detail), { locale: result.locale });
  } catch (err) { return serverError(err, "en"); }
}

export function handleMediaSeasons(req: Request, _db: Database, mediaId: number): Response {
  try {
    const { rows, locale, total } = MediaController.getSeasons(req, mediaId);
    if (!rows.length) return notFound("Seasons", locale);
    return ok(MediaView.formatSeasons(rows), { locale, total });
  } catch (err) { return serverError(err, "en"); }
}

export function handleMediaEpisodes(req: Request, _db: Database, mediaId: number): Response {
  try {
    const { rows, params } = MediaController.getEpisodes(req, mediaId);
    return ok(MediaView.formatEpisodes(rows), params);
  } catch (err) { return serverError(err, "en"); }
}

export function handleMediaCredits(req: Request, _db: Database, mediaId: number): Response {
  try {
    const { credits, locale } = MediaController.getCredits(req, mediaId);
    return ok(MediaView.formatCredits(credits), { locale });
  } catch (err) { return serverError(err, "en"); }
}

export function handleMediaImages(req: Request, _db: Database, mediaId: number): Response {
  try {
    const { rows, locale, total } = MediaController.getImages(req, mediaId);
    return ok(MediaView.formatImages(rows), { locale, total });
  } catch (err) { return serverError(err, "en"); }
}

export function handleMediaVideos(req: Request, _db: Database, mediaId: number): Response {
  try {
    const { rows, locale, total } = MediaController.getVideos(req, mediaId);
    return ok(MediaView.formatVideos(rows), { locale, total });
  } catch (err) { return serverError(err, "en"); }
}

export function handleMediaRelated(req: Request, _db: Database, mediaId: number): Response {
  try {
    const { rows, locale, total } = MediaController.getRelated(req, mediaId);
    return ok(MediaView.formatRelated(rows), { locale, total });
  } catch (err) { return serverError(err, "en"); }
}

export function handleMediaComments(req: Request, _db: Database, mediaId: number): Response {
  try {
    const { rows, params } = MediaController.getComments(req, mediaId);
    return ok(MediaView.formatComments(rows), params);
  } catch (err) { return serverError(err, "en"); }
}

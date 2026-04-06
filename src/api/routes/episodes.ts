/**
 * /api/v1/episodes/:id  –  Episode-level routes
 *
 * GET  /api/v1/episodes/:id           – episode detail
 * GET  /api/v1/episodes/:id/credits   – guest cast & crew for this episode
 * GET  /api/v1/episodes/:id/images    – stills / thumbnails
 * GET  /api/v1/episodes/:id/comments  – threaded comments
 */

import type { Database } from "sqlite-napi";
import { ok, notFound, serverError } from "../response";
import { EpisodeController } from "../controllers/episode.controller";
import { EpisodeView } from "../views/episode.view";

export function handleEpisodeDetail(req: Request, _db: Database, id: number): Response {
  try {
    const { episode, locale } = EpisodeController.getDetail(req, id);
    if (!episode) return notFound("Episode", locale);
    return ok(EpisodeView.formatDetail(episode), { locale });
  } catch (err) {
    return serverError(err, "en");
  }
}

export function handleEpisodeCredits(req: Request, _db: Database, episodeId: number): Response {
  try {
    const { rows, locale, total } = EpisodeController.getCredits(req, episodeId);
    return ok(EpisodeView.formatCredits(rows), { locale, total });
  } catch (err) {
    return serverError(err, "en");
  }
}

export function handleEpisodeImages(req: Request, _db: Database, episodeId: number): Response {
  try {
    const { rows, locale, total } = EpisodeController.getImages(req, episodeId);
    return ok(EpisodeView.formatImages(rows), { locale, total });
  } catch (err) {
    return serverError(err, "en");
  }
}

export function handleEpisodeComments(req: Request, _db: Database, episodeId: number): Response {
  try {
    const { rows, locale, page, pageSize, total } = EpisodeController.getComments(req, episodeId);
    return ok(EpisodeView.formatComments(rows), { locale, page, pageSize, total });
  } catch (err) {
    return serverError(err, "en");
  }
}

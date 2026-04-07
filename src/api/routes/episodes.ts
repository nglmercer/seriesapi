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
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../i18n";
import { withAdmin } from "./auth";

export function handleEpisodeDetail(req: Request, _db: Database, id: number): Response {
  try {
    const { episode, locale } = EpisodeController.getDetail(req, id);
    if (!episode) return notFound("Episode", locale);
    return ok(EpisodeView.formatDetail(episode), { locale });
  } catch (err) {
    return serverError(err, getLocaleFromRequest(req, SUPPORTED_LOCALES));
  }
}

export function handleEpisodeCredits(req: Request, _db: Database, episodeId: number): Response {
  try {
    const { rows, locale, total } = EpisodeController.getCredits(req, episodeId);
    return ok(EpisodeView.formatCredits(rows), { locale, total });
  } catch (err) {
    return serverError(err, getLocaleFromRequest(req, SUPPORTED_LOCALES));
  }
}

export function handleEpisodeImages(req: Request, _db: Database, episodeId: number): Response {
  try {
    const { rows, locale, total } = EpisodeController.getImages(req, episodeId);
    return ok(EpisodeView.formatImages(rows), { locale, total });
  } catch (err) {
    return serverError(err, getLocaleFromRequest(req, SUPPORTED_LOCALES));
  }
}

export function handleEpisodeComments(req: Request, _db: Database, episodeId: number): Response {
  try {
    const result = EpisodeController.getComments(req, episodeId);
    if ("error" in result) return result.error as Response;
    const { rows, locale, page, pageSize, total } = result;
    return ok(EpisodeView.formatComments(rows!), { locale: locale!, page, pageSize, total });
  } catch (err) {
    return serverError(err, getLocaleFromRequest(req, SUPPORTED_LOCALES));
  }
}

export const handleEpisodeCreate = withAdmin(async (req: Request) => {
  try {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const body = await req.json();
    const result = EpisodeController.create(body, locale);
    return ok(result, { locale });
  } catch (err) {
    return serverError(err, getLocaleFromRequest(req, SUPPORTED_LOCALES));
  }
});

export const handleEpisodeUpdate = withAdmin(async (req: Request, user) => {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  try {
    const url = new URL(req.url);
    const parts = url.pathname.replace(/\/$/, "").split("/").filter(Boolean);
    const id = parseInt(parts[3] ?? "", 10);
    if (isNaN(id)) return notFound("Episode", locale);

    const body = await req.json();
    const result = EpisodeController.update(id, body, locale);
    return ok(result, { locale });
  } catch (err) {
    return serverError(err, locale);
  }
});

export const handleEpisodeDelete = withAdmin(async (req: Request, user) => {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  try {
    const url = new URL(req.url);
    const parts = url.pathname.replace(/\/$/, "").split("/").filter(Boolean);
    const id = parseInt(parts[3] ?? "", 10);
    if (isNaN(id)) return notFound("Episode", locale);

    const result = EpisodeController.delete(id);
    return ok(result, { locale });
  } catch (err) {
    return serverError(err, locale);
  }
});

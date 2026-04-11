/**
 * /api/v1/seasons/:id  –  Season-level routes
 *
 * GET  /api/v1/seasons/:id            – season detail
 * GET  /api/v1/seasons/:id/episodes   – episodes in season
 * GET  /api/v1/seasons/:id/images     – season images
 * GET  /api/v1/seasons/:id/comments   – season comments
 */

import type { Database } from "sqlite-napi";
import { ok, notFound, serverError } from "../response";
import { SeasonController } from "../controllers/season.controller";
import { SeasonView } from "../views/season.view";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../i18n";
import { withAdmin } from "./auth";

export function handleSeasonComments(req: Request, _db: Database, seasonId: number): Response {
  try {
    const result = SeasonController.getComments(req, seasonId);
    if ("error" in result) return result.error as Response;

    const { rows, locale, page, pageSize, total } = result;
    return ok(SeasonView.formatComments(rows), { locale, page, pageSize, total });
  } catch (err) {
    return serverError(err, getLocaleFromRequest(req, SUPPORTED_LOCALES));
  }
}

export function handleSeasonDetail(req: Request, _db: Database, id: number): Response {
  try {
    const { season, locale } = SeasonController.getDetail(req, id);
    if (!season) return notFound("Season", locale);
    return ok(SeasonView.formatDetail(season), { locale });
  } catch (err) {
    return serverError(err, getLocaleFromRequest(req, SUPPORTED_LOCALES));
  }
}

export function handleSeasonEpisodes(req: Request, _db: Database, seasonId: number): Response {
  try {
    const result = SeasonController.getEpisodes(req, seasonId);
    if ("error" in result) return result.error as Response;

    const { rows, locale, page, pageSize, total } = result;
    return ok(SeasonView.formatEpisodes(rows), { locale, page, pageSize, total });
  } catch (err) {
    return serverError(err, getLocaleFromRequest(req, SUPPORTED_LOCALES));
  }
}

export function handleSeasonImages(req: Request, _db: Database, seasonId: number): Response {
  try {
    const { rows, locale, total } = SeasonController.getImages(req, seasonId);
    return ok(SeasonView.formatImages(rows), { locale, total });
  } catch (err) {
    return serverError(err, getLocaleFromRequest(req, SUPPORTED_LOCALES));
  }
}

export const handleSeasonCreate = withAdmin(async (req: Request) => {
  try {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const body = await req.json();
    const result = SeasonController.create(body, locale);
    return ok(result, { locale });
  } catch (err) {
    return serverError(err, getLocaleFromRequest(req, SUPPORTED_LOCALES));
  }
});

export const handleSeasonUpdate = withAdmin(async (req: Request, user) => {
  // We need the id which is normally passed separately. 
  // For consistency with withAdmin, we'll need to handle id extraction.
  // Actually, handleSeasonUpdate in seasons.ts takes (req, db, id).
  // Let's modify it to be a higher-order function compatible with index.ts.
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  try {
    const url = new URL(req.url);
    const parts = url.pathname.replace(/\/$/, "").split("/").filter(Boolean);
    const id = parseInt(parts[3] ?? "", 10);
    if (isNaN(id)) return notFound("Season", locale);

    const body = await req.json();
    const result = SeasonController.update(id, body, locale);
    return ok(result, { locale });
  } catch (err) {
    return serverError(err, locale);
  }
});

export const handleSeasonDelete = withAdmin(async (req: Request, user) => {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  try {
    const url = new URL(req.url);
    const parts = url.pathname.replace(/\/$/, "").split("/").filter(Boolean);
    const id = parseInt(parts[3] ?? "", 10);
    if (isNaN(id)) return notFound("Season", locale);

    const result = SeasonController.delete(id);
    return ok(result, { locale });
  } catch (err) {
    return serverError(err, locale);
  }
});

/**
 * /api/v1/seasons/:id  –  Season-level routes
 *
 * GET  /api/v1/seasons/:id            – season detail
 * GET  /api/v1/seasons/:id/episodes   – episodes in season
 * GET  /api/v1/seasons/:id/images     – season images
 */

import type { Database } from "sqlite-napi";
import { ok, notFound, serverError } from "../response";
import { SeasonController } from "../controllers/season.controller";
import { SeasonView } from "../views/season.view";

export function handleSeasonDetail(req: Request, _db: Database, id: number): Response {
  try {
    const { season, locale } = SeasonController.getDetail(req, id);
    if (!season) return notFound("Season", locale);
    return ok(SeasonView.formatDetail(season), { locale });
  } catch (err) {
    return serverError(err, "en");
  }
}

export function handleSeasonEpisodes(req: Request, _db: Database, seasonId: number): Response {
  try {
    const result = SeasonController.getEpisodes(req, seasonId);
    if ("error" in result) return result.error as Response;

    const { rows, locale, page, pageSize, total } = result;
    return ok(SeasonView.formatEpisodes(rows), { locale, page, pageSize, total });
  } catch (err) {
    return serverError(err, "en");
  }
}

export function handleSeasonImages(req: Request, _db: Database, seasonId: number): Response {
  try {
    const { rows, locale, total } = SeasonController.getImages(req, seasonId);
    return ok(SeasonView.formatImages(rows), { locale, total });
  } catch (err) {
    return serverError(err, "en");
  }
}

export async function handleSeasonCreate(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const result = SeasonController.create(body);
    return ok(result, { locale: "es" });
  } catch (err) {
    return serverError(err, "en");
  }
}

export async function handleSeasonUpdate(req: Request, _db: Database, id: number): Promise<Response> {
  try {
    const body = await req.json();
    const result = SeasonController.update(id, body);
    return ok(result, { locale: "es" });
  } catch (err) {
    return serverError(err, "en");
  }
}

export async function handleSeasonDelete(req: Request, _db: Database, id: number): Promise<Response> {
  try {
    const result = SeasonController.delete(id);
    return ok(result, { locale: "es" });
  } catch (err) {
    return serverError(err, "en");
  }
}

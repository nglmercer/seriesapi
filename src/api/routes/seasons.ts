/**
 * /api/v1/seasons  –  Season-level routes
 */

import type { Database } from "sqlite-napi";
import { ok, notFound, serverError, methodNotAllowed } from "../response";
import { SeasonController } from "../controllers/season.controller";
import { SeasonView } from "../views/season.view";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../i18n";
import { ApiContext } from "../context";
import { withAdmin } from "./auth";
import { validateParams, seasonUpdateSchema, seasonCreateSchema } from "../validation";


/**
 * Main router for /api/v1/seasons
 */
export async function handleSeasonRouter(ctx: ApiContext): Promise<Response> {
  const { locale, resource, p3, p4, GET, POST, PUT, DELETE, db } = ctx;

  if (resource !== "seasons") return notFound("Resource", locale);

  // POST /api/v1/seasons
  if (POST && !p3) {
    return handleSeasonCreate(ctx.req);
  }

  // Routes with ID: /api/v1/seasons/:id
  const id = ctx.seg(3);
  if (isNaN(id)) {
    if (!p3 && GET) return handleSeasonList(ctx.req, db); // Optional: if you want a list of seasons
    return notFound("Season", locale);
  }

  if (GET) {
    if (!p4) return handleSeasonDetail(ctx.req, db, id);
    if (p4 === "episodes") return handleSeasonEpisodes(ctx.req, db, id);
    if (p4 === "images") return handleSeasonImages(ctx.req, db, id);
    if (p4 === "comments") return handleSeasonComments(ctx.req, db, id);
    return notFound("Resource", locale);
  }

  if (PUT) return handleSeasonUpdate(ctx.req, id);
  if (DELETE) return handleSeasonDelete(ctx.req, id);

  return methodNotAllowed(locale);
}


export function handleSeasonList(req: Request, _db: Database): Response {
  // If we ever want a global seasons list
  return notFound("Seasons list", getLocaleFromRequest(req, SUPPORTED_LOCALES));
}

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
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  try {
    const body = await req.json();
    const v = validateParams(seasonCreateSchema, body, locale);
    console.log(body, v)
    if (!v.success) return v.error;

    const result = SeasonController.create(v.data, locale);
    return ok(result, { locale });
  } catch (err) {
    return serverError(err, locale);
  }
});

export const handleSeasonUpdate = async (req: Request, id: number): Promise<Response> => {
  return withAdmin(async (req: Request) => {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    try {
      const body = await req.json();
      const v = validateParams(seasonUpdateSchema, body, locale);
      console.log(body, v)
      if (!v.success) return v.error;

      const result = SeasonController.update(id, v.data, locale);
      return ok(result, { locale });
    } catch (err) {
      return serverError(err, locale);
    }
  })(req);
};

export const handleSeasonDelete = async (req: Request, id: number): Promise<Response> => {
  return withAdmin(async (req: Request) => {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    try {
      const result = SeasonController.delete(id);
      return ok(result, { locale });
    } catch (err) {
      return serverError(err, locale);
    }
  })(req);
};

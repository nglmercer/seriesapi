/**
 * /api/v1/seasons  –  Season-level routes
 */

import { serverError, methodNotAllowed } from "../response";
import { SeasonController } from "../controllers/season.controller";
import { SeasonView } from "../views/season.view";
import { ApiContext } from "../context";
import { withAdmin } from "./auth";
import { seasonUpdateSchema, seasonCreateSchema } from "../validation";


/**
 * Main router for /api/v1/seasons
 */
export async function handleSeasonRouter(ctx: ApiContext): Promise<Response> {
  const { locale, resource, p3, p4, POST, GET, PUT, DELETE } = ctx;

  if (resource !== "seasons") return ctx.notFound("Resource");

  // POST /api/v1/seasons
  if (POST && !p3) {
    return handleSeasonCreate(ctx);
  }

  // Routes with ID: /api/v1/seasons/:id
  const id = ctx.seg(3);
  if (isNaN(id)) {
    if (!p3 && GET) return handleSeasonList(ctx); // Optional: if you want a list of seasons
    return ctx.notFound("Season");
  }


  if (GET) {
    if (!p4) return handleSeasonDetail(ctx, id);
    if (p4 === "episodes") return handleSeasonEpisodes(ctx, id);
    if (p4 === "images") return handleSeasonImages(ctx, id);
    if (p4 === "comments") return handleSeasonComments(ctx, id);
    return ctx.notFound("Resource");
  }

  if (PUT) return handleSeasonUpdate(ctx);
  if (DELETE) return handleSeasonDelete(ctx);

  return methodNotAllowed(locale);
}


export function handleSeasonList(ctx: ApiContext): Response {
  // If we ever want a global seasons list
  return ctx.notFound("Seasons list");
}

export function handleSeasonComments(ctx: ApiContext, seasonId: number): Response {
  try {
    const result = SeasonController.getComments(ctx, seasonId);
    if ("error" in result) return result.error as Response;

    const { rows, locale, page, pageSize, total } = result;
    return ctx.ok(SeasonView.formatComments(rows), { page, pageSize, total });
  } catch (err) {
    return serverError(err, ctx.locale);
  }
}

export function handleSeasonDetail(ctx: ApiContext, id: number): Response {
  try {
    const { season, locale } = SeasonController.getDetail(ctx, id);
    if (!season) return ctx.notFound("Season");
    return ctx.ok(SeasonView.formatDetail(season));
  } catch (err) {
    return serverError(err, ctx.locale);
  }
}

export function handleSeasonEpisodes(ctx: ApiContext, seasonId: number): Response {
  try {
    const result = SeasonController.getEpisodes(ctx, seasonId);
    if ("error" in result) return result.error as Response;

    const { rows, locale, page, pageSize, total } = result;
    return ctx.ok(SeasonView.formatEpisodes(rows), { page, pageSize, total });
  } catch (err) {
    return serverError(err, ctx.locale);
  }
}

export function handleSeasonImages(ctx: ApiContext, seasonId: number): Response {
  try {
    const { rows, locale, total } = SeasonController.getImages(ctx, seasonId);
    return ctx.ok(SeasonView.formatImages(rows), { total });
  } catch (err) {
    return serverError(err, ctx.locale);
  }
}

export const handleSeasonCreate = withAdmin(async (ctx: ApiContext) => {
  try {
    const v = await ctx.body(seasonCreateSchema);
    if (!v.success) return v.error;

    const result = SeasonController.create(ctx, v.data);
    return ctx.ok(result);
  } catch (err) {
    return serverError(err, ctx.locale);
  }
});

export const handleSeasonUpdate = withAdmin(async (ctx: ApiContext) => {
  try {
    const id = ctx.seg(3);
    if (isNaN(id)) return ctx.notFound("Season");

    const v = await ctx.body(seasonUpdateSchema);
    if (!v.success) return v.error;

    const result = SeasonController.update(ctx, id, v.data);
    return ctx.ok(result);
  } catch (err) {
    return serverError(err, ctx.locale);
  }
});

export const handleSeasonDelete = withAdmin(async (ctx: ApiContext) => {
  try {
    const id = ctx.seg(3);
    if (isNaN(id)) return ctx.notFound("Season");

    const result = SeasonController.delete(ctx, id);
    return ctx.ok(result);
  } catch (err) {
    return serverError(err, ctx.locale);
  }
});

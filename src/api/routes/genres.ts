/**
 * /api/v1/genres  –  Genre routes
 *
 * GET  /api/v1/genres          – full list (localized)
 * GET  /api/v1/genres/:slug    – genre detail + paginated media
 */

import { serverError } from "../response";
import { GenreController } from "../controllers/genre.controller";
import { GenreView } from "../views/genre.view";
import { ApiContext } from "../context";

export function handleGenresList(ctx: ApiContext): Response {
  try {
    const { params, rows } = GenreController.getList(ctx);
    const formattedData = GenreView.formatList(rows);
    return ctx.ok(formattedData, params);
  } catch (err) {
    return serverError(err, ctx.locale);
  }
}

export function handleGenreMedia(ctx: ApiContext, slug: string): Response {
  try {
    const result = GenreController.getDetail(ctx, slug);
    if (!result) return ctx.notFound("Genre");
    if ("error" in result) return result.error as Response;

    const formattedData = GenreView.formatDetail(result.genre, result.items);
    return ctx.ok(formattedData, { 
      locale: result.locale, 
      page: result.page, 
      pageSize: result.pageSize, 
      total: result.total 
    });
  } catch (err) {
    return serverError(err, ctx.locale);
  }
}

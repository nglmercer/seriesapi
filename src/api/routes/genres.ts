/**
 * /api/v1/genres  –  Genre routes
 *
 * GET  /api/v1/genres          – full list (localized)
 * GET  /api/v1/genres/:slug    – genre detail + paginated media
 */

import type { Database } from "sqlite-napi";
import { ok, notFound, serverError } from "../response";
import { GenreController } from "../controllers/genre.controller";
import { GenreView } from "../views/genre.view";

export function handleGenresList(req: Request, _db: Database): Response {
  try {
    const { params, rows } = GenreController.getList(req);
    const formattedData = GenreView.formatList(rows);
    return ok(formattedData, params);
  } catch (err) {
    return serverError(err, "en");
  }
}

export function handleGenreMedia(req: Request, _db: Database, slug: string): Response {
  try {
    const result = GenreController.getDetail(req, slug);
    if (!result) return notFound("Genre", "en");
    if ("error" in result) return result.error as Response;

    const formattedData = GenreView.formatDetail(result.genre, result.items);
    return ok(formattedData, { 
      locale: result.locale, 
      page: result.page, 
      pageSize: result.pageSize, 
      total: result.total 
    });
  } catch (err) {
    return serverError(err, "en");
  }
}

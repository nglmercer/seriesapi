/**
 * /api/v1/collections  –  Franchise / collection routes
 *
 * GET  /api/v1/collections            – all collections (paginated)
 * GET  /api/v1/collections/:slug      – collection detail + ordered media
 */

import type { Database } from "sqlite-napi";
import { ok, notFound, serverError } from "../response";
import { CollectionController } from "../controllers/collection.controller";
import { CollectionView } from "../views/collection.view";

export function handleCollectionsList(req: Request, _db: Database): Response {
  try {
    const { params, rows } = CollectionController.getList(req);
    const formattedData = CollectionView.formatList(rows);
    return ok(formattedData, params);
  } catch (err) {
    return serverError(err, "en");
  }
}

export function handleCollectionDetail(req: Request, _db: Database, slug: string): Response {
  try {
    const result = CollectionController.getDetail(req, slug);
    if (!result) return notFound("Collection", "en");

    const formattedData = CollectionView.formatDetail(result.collection, result.items);
    return ok(formattedData, { locale: result.locale, total: result.items.length });
  } catch (err) {
    return serverError(err, "en");
  }
}

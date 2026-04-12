/**
 * /api/v1/collections  –  Franchise / collection routes
 *
 * GET  /api/v1/collections            – all collections (paginated)
 * GET  /api/v1/collections/:slug      – collection detail + ordered media
 */

import { serverError } from "../response";
import { CollectionController } from "../controllers/collection.controller";
import { CollectionView } from "../views/collection.view";
import { ApiContext } from "../context";

export function handleCollectionsList(ctx: ApiContext): Response {
  try {
    const result = CollectionController.getList(ctx);
    if ("error" in result) return result.error as Response;

    const { params, rows } = result;
    const formattedData = CollectionView.formatList(rows);
    return ctx.ok(formattedData, params);
  } catch (err) {
    return serverError(err, ctx.locale);
  }
}

export function handleCollectionDetail(ctx: ApiContext, slug: string): Response {
  try {
    const result = CollectionController.getDetail(ctx, slug);
    if (!result) return ctx.notFound("Collection");

    const formattedData = CollectionView.formatDetail(result.collection, result.items);
    return ctx.ok(formattedData, { locale: result.locale, total: result.items.length });
  } catch (err) {
    return serverError(err, ctx.locale);
  }
}

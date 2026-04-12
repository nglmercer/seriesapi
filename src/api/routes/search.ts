/**
 * /api/v1/search  –  Cross-entity full-text search
 *
 * GET  /api/v1/search?q=...&type=media|person|collection&...
 *
 * Matches against:
 *   - media.original_title + media_translations.title
 *   - people.name + people_translations.name
 *   - collections via collection_translations.name
 *
 * Returns a unified result list with an entity_type discriminator.
 */

import { serverError } from "../response";
import { SearchController } from "../controllers/search.controller";
import { SearchView } from "../views/search.view";
import { ApiContext } from "../context";

export function handleSearch(ctx: ApiContext): Response {
  try {
    const result = SearchController.getList(ctx);
    if (result.error) return result.error;

    const formattedData = SearchView.formatList(result.rows);
    return ctx.ok(formattedData, result.params);
  } catch (err) {
    return serverError(err, ctx.locale);
  }
}



import { ApiContext } from "../context";
import { serverError, badRequest } from "../response";

/**
 * handleStats  –  Generic endpoint to get counts/stats for any allowed table
 * 
 * GET /api/v1/stats/:table
 *   Example: /api/v1/stats/media
 *   Example: /api/v1/stats/episodes?season_id=5
 */

const ALLOWED_RESOURCES: Record<string, string> = {
  "media": "media",
  "seasons": "seasons",
  "episodes": "episodes",
  "people": "people",
  "comments": "comments",
  "ratings": "ratings",
  "genres": "genres",
  "tags": "tags",
  "collections": "collections",
  "users": "users",
  "studios": "studios",
  "networks": "networks",
  "images": "images",
  "videos": "videos",
};

export async function handleStats(ctx: ApiContext) {
  try {
    const { p3: resource, drizzle, params: queryParams, locale } = ctx;

    if (!resource) {
      return badRequest("Resource name required (e.g., /api/v1/stats/media)", locale);
    }

    const tableName = ALLOWED_RESOURCES[resource];
    if (!tableName) {
      return badRequest(`Invalid or restricted resource: ${resource}`, locale);
    }

    // Default stats: total count
    const totalRes = drizzle.query<{ count: number }>(`SELECT COUNT(*) as count FROM ${tableName}`).get();
    const total = totalRes?.count ?? 0;

    const result: Record<string, unknown> = {
      resource,
      table: tableName,
      total
    };

    // Filtered count if query params are present (excluding common ones)
    const filterParams = Object.entries(queryParams).filter(([key]) =>
      !["page", "limit", "offset", "locale", "_"].includes(key)
    );

    if (filterParams.length > 0) {
      const conditions: string[] = [];
      const values: unknown[] = [];

      for (const [key, val] of filterParams) {
        // Simple security: only allow alphanumeric column names
        if (/^[a-zA-Z0-9_]+$/.test(key)) {
          conditions.push(`${key} = ?`);
          values.push(val);
        }
      }

      if (conditions.length > 0) {
        const filterSql = `SELECT COUNT(*) as count FROM ${tableName} WHERE ${conditions.join(" AND ")}`;
        const filteredRes = drizzle.query<{ count: number }>(filterSql).get(values);
        result.filtered = filteredRes?.count ?? 0;
        result.filters = Object.fromEntries(filterParams);
      }
    }

    return ctx.ok(result);
  } catch (err) {
    return serverError(err, ctx.locale);
  }
}

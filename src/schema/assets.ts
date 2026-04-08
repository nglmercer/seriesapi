import {
  sqliteTable,
  integer,
  text,
  real,
  boolean,
  primaryKey,
  notNull,
  default_,
  references,
} from "../core/index";

const NOW = "CURRENT_TIMESTAMP";

/**
 * images  –  all artwork for any entity.
 */
export const imagesTable = sqliteTable("images", {
  id: primaryKey(integer("id")),
  entity_type: notNull(text("entity_type")),
  entity_id: notNull(integer("entity_id")),
  image_type: notNull(text("image_type")),
  locale: text("locale"),
  url: notNull(text("url")),
  width: integer("width"),
  height: integer("height"),
  aspect_ratio: real("aspect_ratio"),
  source: text("source"),
  source_id: text("source_id"),
  vote_average: default_(real("vote_average"), 0),
  vote_count: default_(integer("vote_count"), 0),
  is_primary: default_(boolean("is_primary"), 0),
  created_at: default_(text("created_at"), NOW),
});

/**
 * videos  –  trailers, teasers, openings, endings, clips.
 */
export const videosTable = sqliteTable("videos", {
  id: primaryKey(integer("id")),
  media_id: notNull(references(integer("media_id"), { table: "media", column: "id" })),
  season_id: references(integer("season_id"), { table: "seasons", column: "id" }),
  episode_id: references(integer("episode_id"), { table: "episodes", column: "id" }),
  locale: text("locale"),
  video_type: notNull(text("video_type")),
  name: notNull(text("name")),
  site: notNull(text("site")),
  key: notNull(text("key")),
  thumbnail_url: text("thumbnail_url"),
  published_at: text("published_at"),
  official: default_(boolean("official"), 1),
  created_at: default_(text("created_at"), NOW),
});

/**
 * rate_limits  –  in-DB rate-limit counters per IP per endpoint.
 */
export const rateLimitsTable = sqliteTable("rate_limits", {
  id: primaryKey(integer("id")),
  ip_hash: notNull(text("ip_hash")),
  endpoint: notNull(text("endpoint")),
  window_start: notNull(text("window_start")),
  window_seconds: default_(integer("window_seconds"), 60),
  request_count: default_(integer("request_count"), 0),
  limit: default_(integer("limit"), 60),
  blocked_at: text("blocked_at"),
  created_at: default_(text("created_at"), NOW),
});

/**
 * api_logs  –  lightweight access log for analytics / debugging.
 */
export const apiLogsTable = sqliteTable("api_logs", {
  id: primaryKey(integer("id")),
  ip_hash: notNull(text("ip_hash")),
  method: notNull(text("method")),
  path: notNull(text("path")),
  query: text("query"),
  locale: text("locale"),
  status_code: notNull(integer("status_code")),
  response_ms: integer("response_ms"),
  user_agent: text("user_agent"),
  created_at: default_(text("created_at"), NOW),
});

/**
 * translation_requests  –  tracks missing translations.
 */
export const translationRequestsTable = sqliteTable("translation_requests", {
  id: primaryKey(integer("id")),
  entity_type: notNull(text("entity_type")),
  entity_id: notNull(integer("entity_id")),
  locale: notNull(references(text("locale"), { table: "languages", column: "code" })),
  request_count: default_(integer("request_count"), 0),
  last_requested_at: default_(text("last_requested_at"), NOW),
});

/**
 * content_reports  –  user reported issues with content.
 */
export const contentReportsTable = sqliteTable("content_reports", {
  id: primaryKey(integer("id")),
  entity_type: notNull(text("entity_type")),
  entity_id: notNull(integer("entity_id")),
  report_type: notNull(text("report_type")),
  locale: text("locale"),
  message: text("message"),
  status: default_(text("status"), "pending"),
  created_at: default_(text("created_at"), NOW),
});

import {
  sqliteTable,
  integer,
  text,
  real,
  primaryKey,
  notNull,
  default_,
  references,
} from "../core/index";
import { languagesTable } from "./lookups";
import { mediaTable } from "./media";

const NOW = "CURRENT_TIMESTAMP";

/**
 * seasons  –  season groups within a series / anime.
 */
export const seasonsTable = sqliteTable("seasons", {
  id: primaryKey(integer("id")),
  media_id: notNull(references(integer("media_id"), { table: "media", column: "id" })),
  season_number: notNull(integer("season_number")),
  episode_count: default_(integer("episode_count"), 0),
  air_date: text("air_date"),
  end_date: text("end_date"),
  score: default_(real("score"), 0),
  score_count: default_(integer("score_count"), 0),
  view_count: default_(integer("view_count"), 0),
  external_ids: text("external_ids"),
  created_at: default_(text("created_at"), NOW),
  updated_at: default_(text("updated_at"), NOW),
});

/**
 * season_translations  –  localized season name & synopsis.
 */
export const seasonTranslationsTable = sqliteTable("season_translations", {
  id: primaryKey(integer("id")),
  season_id: notNull(references(integer("season_id"), { table: "seasons", column: "id" })),
  locale: notNull(references(text("locale"), { table: "languages", column: "code" })),
  name: text("name"),
  synopsis: text("synopsis"),
});

/**
 * episodes  –  individual episodes within a season.
 */
export const episodesTable = sqliteTable("episodes", {
  id: primaryKey(integer("id")),
  media_id: notNull(references(integer("media_id"), { table: "media", column: "id" })),
  season_id: references(integer("season_id"), { table: "seasons", column: "id" }),
  episode_number: notNull(integer("episode_number")),
  absolute_number: integer("absolute_number"),
  episode_type: default_(text("episode_type"), "regular"),
  air_date: text("air_date"),
  runtime_minutes: integer("runtime_minutes"),
  score: default_(real("score"), 0),
  score_count: default_(integer("score_count"), 0),
  view_count: default_(integer("view_count"), 0),
  external_ids: text("external_ids"),
  created_at: default_(text("created_at"), NOW),
  updated_at: default_(text("updated_at"), NOW),
});

/**
 * episode_translations  –  localized episode title, synopsis, overview.
 */
export const episodeTranslationsTable = sqliteTable("episode_translations", {
  id: primaryKey(integer("id")),
  episode_id: notNull(references(integer("episode_id"), { table: "episodes", column: "id" })),
  locale: notNull(references(text("locale"), { table: "languages", column: "code" })),
  title: text("title"),
  synopsis: text("synopsis"),
});

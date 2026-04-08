import {
  sqliteTable,
  integer,
  text,
  real,
  boolean,
  primaryKey,
  notNull,
  unique,
  default_,
  references,
} from "../core/index";
import { contentTypesTable, languagesTable, genresTable, tagsTable, studiosTable, networksTable } from "./lookups";

const NOW = "CURRENT_TIMESTAMP";

/**
 * media  –  the canonical record for every piece of content.
 */
export const mediaTable = sqliteTable("media", {
  id: primaryKey(integer("id")),
  content_type_id: notNull(references(integer("content_type_id"), { table: "content_types", column: "id" })),
  slug: notNull(unique(text("slug"))),
  original_title: notNull(text("original_title")),
  original_language: references(text("original_language"), { table: "languages", column: "code" }),
  status: default_(text("status"), "unknown"),
  release_date: text("release_date"),
  end_date: text("end_date"),
  runtime_minutes: integer("runtime_minutes"),
  total_episodes: integer("total_episodes"),
  total_seasons: integer("total_seasons"),
  score: default_(real("score"), 0),
  score_count: default_(integer("score_count"), 0),
  popularity: default_(real("popularity"), 0),
  age_rating: text("age_rating"),
  is_adult: default_(boolean("is_adult"), 0),
  external_ids: text("external_ids"),
  created_at: default_(text("created_at"), NOW),
  updated_at: default_(text("updated_at"), NOW),
});

/**
 * media_translations  –  all localizable text per media entry.
 */
export const mediaTranslationsTable = sqliteTable("media_translations", {
  id: primaryKey(integer("id")),
  media_id: notNull(references(integer("media_id"), { table: "media", column: "id" })),
  locale: notNull(references(text("locale"), { table: "languages", column: "code" })),
  title: notNull(text("title")),
  tagline: text("tagline"),
  synopsis: text("synopsis"),
  synopsis_short: text("synopsis_short"),
});

/** media ←→ genres  (M:N) */
export const mediaGenresTable = sqliteTable("media_genres", {
  id: primaryKey(integer("id")),
  media_id: notNull(references(integer("media_id"), { table: "media", column: "id" })),
  genre_id: notNull(references(integer("genre_id"), { table: "genres", column: "id" })),
});

/** media ←→ tags  (M:N) */
export const mediaTagsTable = sqliteTable("media_tags", {
  id: primaryKey(integer("id")),
  media_id: notNull(references(integer("media_id"), { table: "media", column: "id" })),
  tag_id: notNull(references(integer("tag_id"), { table: "tags", column: "id" })),
  spoiler: default_(boolean("spoiler"), 0),
  votes: default_(integer("votes"), 0),
});

/** media ←→ studios  (M:N) */
export const mediaStudiosTable = sqliteTable("media_studios", {
  id: primaryKey(integer("id")),
  media_id: notNull(references(integer("media_id"), { table: "media", column: "id" })),
  studio_id: notNull(references(integer("studio_id"), { table: "studios", column: "id" })),
  is_main: default_(boolean("is_main"), 0),
});

/** media ←→ networks  (M:N) */
export const mediaNetworksTable = sqliteTable("media_networks", {
  id: primaryKey(integer("id")),
  media_id: notNull(references(integer("media_id"), { table: "media", column: "id" })),
  network_id: notNull(references(integer("network_id"), { table: "networks", column: "id" })),
  region: text("region"),
});

/** media_relations  –  links between media entries. */
export const mediaRelationsTable = sqliteTable("media_relations", {
  id: primaryKey(integer("id")),
  source_media_id: notNull(references(integer("source_media_id"), { table: "media", column: "id" })),
  related_media_id: notNull(references(integer("related_media_id"), { table: "media", column: "id" })),
  relation_type: notNull(text("relation_type")),
});

/** collections  –  a named group of related media */
export const collectionsTable = sqliteTable("collections", {
  id: primaryKey(integer("id")),
  slug: notNull(unique(text("slug"))),
  created_at: default_(text("created_at"), NOW),
});

export const collectionTranslationsTable = sqliteTable("collection_translations", {
  id: primaryKey(integer("id")),
  collection_id: notNull(references(integer("collection_id"), { table: "collections", column: "id" })),
  locale: notNull(references(text("locale"), { table: "languages", column: "code" })),
  name: notNull(text("name")),
  overview: text("overview"),
});

export const collectionItemsTable = sqliteTable("collection_items", {
  id: primaryKey(integer("id")),
  collection_id: notNull(references(integer("collection_id"), { table: "collections", column: "id" })),
  media_id: notNull(references(integer("media_id"), { table: "media", column: "id" })),
  "order": default_(integer("order"), 0),
});

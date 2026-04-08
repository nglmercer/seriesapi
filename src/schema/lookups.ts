import {
  sqliteTable,
  integer,
  text,
  boolean,
  primaryKey,
  notNull,
  unique,
  default_,
  references,
} from "../core/index";

/**
 * content_types  –  authoritative list of all media kinds.
 */
export const contentTypesTable = sqliteTable("content_types", {
  id: primaryKey(integer("id")),
  slug: notNull(unique(text("slug"))),
  label: notNull(text("label")),
  description: text("description"),
});

/**
 * languages  –  BCP-47 locale registry.
 */
export const languagesTable = sqliteTable("languages", {
  id: primaryKey(integer("id")),
  code: notNull(unique(text("code"))),
  name: notNull(text("name")),
  native_name: text("native_name"),
  is_rtl: default_(boolean("is_rtl"), 0),
});

/**
 * genres  –  shared genre vocabulary.
 */
export const genresTable = sqliteTable("genres", {
  id: primaryKey(integer("id")),
  slug: notNull(unique(text("slug"))),
  image_url: text("image_url"),
});

/** genre localized names */
export const genreTranslationsTable = sqliteTable("genre_translations", {
  id: primaryKey(integer("id")),
  genre_id: notNull(references(integer("genre_id"), { table: "genres", column: "id" })),
  locale: notNull(references(text("locale"), { table: "languages", column: "code" })),
  name: notNull(text("name")),
});

/**
 * tags  –  freeform tags ("isekai", "time-travel", etc.)
 */
export const tagsTable = sqliteTable("tags", {
  id: primaryKey(integer("id")),
  slug: notNull(unique(text("slug"))),
  label: notNull(text("label")),
});

/**
 * studios  –  production / animation studios
 */
export const studiosTable = sqliteTable("studios", {
  id: primaryKey(integer("id")),
  name: notNull(text("name")),
  country_code: text("country_code"),
  founded_year: integer("founded_year"),
  website: text("website"),
  logo_url: text("logo_url"),
});

/**
 * networks  –  broadcast / streaming networks & platforms
 */
export const networksTable = sqliteTable("networks", {
  id: primaryKey(integer("id")),
  name: notNull(text("name")),
  slug: notNull(unique(text("slug"))),
  country_code: text("country_code"),
  logo_url: text("logo_url"),
  website: text("website"),
});

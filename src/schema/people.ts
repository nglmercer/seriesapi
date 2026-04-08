import {
  sqliteTable,
  integer,
  text,
  real,
  primaryKey,
  notNull,
  unique,
  default_,
  references,
} from "../core/index";
import { languagesTable } from "./lookups";
import { mediaTable } from "./media";

const NOW = "CURRENT_TIMESTAMP";

/**
 * people  –  any person (actor, director, voice actor, writer …)
 */
export const peopleTable = sqliteTable("people", {
  id: primaryKey(integer("id")),
  name: notNull(text("name")),
  also_known_as: text("also_known_as"),
  birth_date: text("birth_date"),
  death_date: text("death_date"),
  birth_country: text("birth_country"),
  gender: text("gender"),
  external_ids: text("external_ids"),
  created_at: default_(text("created_at"), NOW),
  updated_at: default_(text("updated_at"), NOW),
});

/**
 * people_translations  –  biography and name localization
 */
export const peopleTranslationsTable = sqliteTable("people_translations", {
  id: primaryKey(integer("id")),
  person_id: notNull(references(integer("person_id"), { table: "people", column: "id" })),
  locale: notNull(references(text("locale"), { table: "languages", column: "code" })),
  name: text("name"),
  biography: text("biography"),
});

/**
 * credits  –  links a person to a media entity with their role.
 */
export const creditsTable = sqliteTable("credits", {
  id: primaryKey(integer("id")),
  media_id: notNull(references(integer("media_id"), { table: "media", column: "id" })),
  person_id: notNull(references(integer("person_id"), { table: "people", column: "id" })),
  credit_type: notNull(text("credit_type")),
  role_name: text("role_name"),
  department: text("department"),
  job: text("job"),
  "order": default_(integer("order"), 999),
  is_recurring: default_(boolean("is_recurring"), 0),
  episode_count: integer("episode_count"),
});

/**
 * episode_credits  –  per-episode cast appearances.
 */
export const episodeCreditsTable = sqliteTable("episode_credits", {
  id: primaryKey(integer("id")),
  episode_id: notNull(references(integer("episode_id"), { table: "episodes", column: "id" })),
  person_id: notNull(references(integer("person_id"), { table: "people", column: "id" })),
  credit_type: notNull(text("credit_type")),
  role_name: text("role_name"),
});

import { boolean } from "../core/index";

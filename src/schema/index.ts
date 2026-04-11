import { contentTypesTable, languagesTable, genresTable, genreTranslationsTable, tagsTable, studiosTable, networksTable } from "./lookups";
import { peopleTable, peopleTranslationsTable, creditsTable, episodeCreditsTable } from "./people";
import { mediaTable, mediaTranslationsTable, mediaGenresTable, mediaTagsTable, mediaStudiosTable, mediaNetworksTable, mediaRelationsTable, collectionsTable, collectionTranslationsTable, collectionItemsTable } from "./media";
import { seasonsTable, seasonTranslationsTable, episodesTable, episodeTranslationsTable } from "./seasons";
import { imagesTable, videosTable, rateLimitsTable, apiLogsTable, translationRequestsTable, contentReportsTable } from "./assets";
import { usersTable, sessionsTable, passwordResetsTable, verificationCodesTable, commentsTable, ratingsTable, rolesTable } from "./community";

// Re-export all tables for ease of use
export * from "./lookups";
export * from "./people";
export * from "./media";
export * from "./seasons";
export * from "./assets";
export * from "./community";

/**
 * ALL_TABLES  –  ordered list for `createDatabase()` / migrations.
 * Children always come after parents (foreign key safe).
 */
export const ALL_TABLES = [
  // no-dependency lookup tables first
  contentTypesTable,
  languagesTable,
  genresTable,
  tagsTable,
  studiosTable,
  networksTable,

  // lookup translations
  genreTranslationsTable,

  // people
  peopleTable,
  peopleTranslationsTable,

  // core content
  mediaTable,
  mediaTranslationsTable,
  seasonsTable,
  seasonTranslationsTable,
  episodesTable,
  episodeTranslationsTable,

  // media (images, videos)
  imagesTable,
  videosTable,

  // credits
  creditsTable,
  episodeCreditsTable,

  // taxonomy junctions
  mediaGenresTable,
  mediaTagsTable,
  mediaStudiosTable,
  mediaNetworksTable,

  // relations & collections
  mediaRelationsTable,
  collectionsTable,
  collectionTranslationsTable,
  collectionItemsTable,

  // public interaction
  commentsTable,
  ratingsTable,

  // infrastructure
  rateLimitsTable,
  apiLogsTable,
  translationRequestsTable,
  contentReportsTable,

  // user accounts & auth
  rolesTable,
  usersTable,
  sessionsTable,
  passwordResetsTable,
  verificationCodesTable,
] as const;

// TypeScript Inference Helpers
export type { SQLiteTable, InferRow } from "../core/index";

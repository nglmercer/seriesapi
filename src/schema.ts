/**
 * ============================================================
 *  anima – Public Audiovisual Content API
 *  Database Schema (sqlite-napi + custom Drizzle-style ORM)
 * ============================================================
 *
 *  Content types supported
 *  ───────────────────────
 *  • Movie      – stand-alone film
 *  • Series     – multi-season live-action show
 *  • Anime      – Japanese animated series / film
 *  • OVA        – original video animation
 *  • Special    – bonus / holiday episode
 *  • Short      – short film (< 40 min, no episodes)
 *  • Documentary– non-fiction film or series
 *
 *  i18n strategy
 *  ─────────────
 *  Every localizable string (title, synopsis, tagline …) is
 *  stored in a companion *_translations table keyed by
 *  (entity_id, locale).  A locale is a BCP-47 tag stored as
 *  TEXT, e.g. "en", "es", "ja", "pt-BR".
 *
 *  Rate-limit
 *  ──────────
 *  Public API – no auth required.  Rate-limiting is handled at
 *  the middleware layer and tracked per IP in `rate_limits`.
 *
 *  Image strategy
 *  ──────────────
 *  All images (poster, backdrop, logo, thumbnail, profile …)
 *  live in `images` and are linked to their parent entity via
 *  (entity_type, entity_id).  This avoids nullable columns and
 *  allows multiple images per entity with typed roles.
 * ============================================================
 */

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
} from "./core/index";

// ─────────────────────────────────────────────────────────────
// §0  Helpers / shared SQL expressions
// ─────────────────────────────────────────────────────────────

const NOW = "CURRENT_TIMESTAMP";

// ─────────────────────────────────────────────────────────────
// §1  LOOKUP / ENUM TABLES
// ─────────────────────────────────────────────────────────────

/**
 * content_types  –  authoritative list of all media kinds.
 * slug examples: "movie" | "series" | "anime" | "ova" | "special" | "short" | "documentary"
 */
export const contentTypesTable = sqliteTable("content_types", {
  id: primaryKey(integer("id")),
  slug: notNull(unique(text("slug"))),          // machine key used in URLs
  label: notNull(text("label")),                // English display label
  description: text("description"),
});

/**
 * languages  –  BCP-47 locale registry.
 * Populated once at startup; extended on demand.
 */
export const languagesTable = sqliteTable("languages", {
  id: primaryKey(integer("id")),
  code: notNull(unique(text("code"))),          // e.g. "en", "ja", "pt-BR"
  name: notNull(text("name")),                  // "English", "Japanese"
  native_name: text("native_name"),             // "日本語"
  is_rtl: default_(boolean("is_rtl"), 0),       // right-to-left script
});

/**
 * genres  –  shared genre vocabulary (Action, Drama, etc.)
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
 * tags  –  freeform tags ("isekai", "time-travel", "miniseries" …)
 */
export const tagsTable = sqliteTable("tags", {
  id: primaryKey(integer("id")),
  slug: notNull(unique(text("slug"))),
  label: notNull(text("label")),                // canonical English label
});

/**
 * studios  –  production / animation studios
 */
export const studiosTable = sqliteTable("studios", {
  id: primaryKey(integer("id")),
  name: notNull(text("name")),
  country_code: text("country_code"),           // ISO 3166-1 alpha-2
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

// ─────────────────────────────────────────────────────────────
// §2  PEOPLE  (cast & crew)
// ─────────────────────────────────────────────────────────────

/**
 * people  –  any person (actor, director, voice actor, writer …)
 */
export const peopleTable = sqliteTable("people", {
  id: primaryKey(integer("id")),
  name: notNull(text("name")),                  // romanized / original name
  also_known_as: text("also_known_as"),         // JSON array of aliases
  birth_date: text("birth_date"),               // ISO 8601
  death_date: text("death_date"),
  birth_country: text("birth_country"),         // ISO 3166-1 alpha-2
  gender: text("gender"),                       // "male"|"female"|"non-binary"|null
  external_ids: text("external_ids"),           // JSON: {tmdb, mal, anidb, imdb …}
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
  name: text("name"),                           // localized name if different
  biography: text("biography"),
});

// ─────────────────────────────────────────────────────────────
// §3  CORE MEDIA ENTITY
// ─────────────────────────────────────────────────────────────

/**
 * media  –  the canonical record for every piece of content.
 *
 * Designed to be type-agnostic; the `content_type_id` FK drives
 * which optional fields are populated (e.g. episode_count is
 * only relevant for series/anime, not movies).
 */
export const mediaTable = sqliteTable("media", {
  id: primaryKey(integer("id")),

  // Classification
  content_type_id: notNull(references(integer("content_type_id"), { table: "content_types", column: "id" })),

  // Canonical (non-localized) identifiers
  slug: notNull(unique(text("slug"))),          // URL-safe, e.g. "attack-on-titan"
  original_title: notNull(text("original_title")), // title in the original language
  original_language: references(text("original_language"), { table: "languages", column: "code" }),

  // Structural
  status: default_(text("status"), "unknown"),  // "ongoing"|"completed"|"cancelled"|"upcoming"
  release_date: text("release_date"),           // ISO 8601 – premiere date
  end_date: text("end_date"),                   // NULL for movies / ongoing
  runtime_minutes: integer("runtime_minutes"),  // avg episode or total movie runtime
  total_episodes: integer("total_episodes"),    // NULL for movies
  total_seasons: integer("total_seasons"),      // NULL for movies / OVAs

  // Scores
  score: default_(real("score"), 0),            // aggregated 0-10
  score_count: default_(integer("score_count"), 0),
  popularity: default_(real("popularity"), 0),  // trending weight

  // Classification extras
  age_rating: text("age_rating"),              // "G"|"PG"|"PG-13"|"R"|"NC-17"|"TV-MA" etc.
  is_adult: default_(boolean("is_adult"), 0),

  // External IDs (stored as JSON object for flexibility)
  external_ids: text("external_ids"),          // {tmdb, imdb, mal, anidb, kitsu, tvdb …}

  // Metadata
  created_at: default_(text("created_at"), NOW),
  updated_at: default_(text("updated_at"), NOW),
});

/**
 * media_translations  –  all localizable text per media entry.
 * One row per (media_id × locale).
 */
export const mediaTranslationsTable = sqliteTable("media_translations", {
  id: primaryKey(integer("id")),
  media_id: notNull(references(integer("media_id"), { table: "media", column: "id" })),
  locale: notNull(references(text("locale"), { table: "languages", column: "code" })),

  title: notNull(text("title")),               // localized title
  tagline: text("tagline"),
  synopsis: text("synopsis"),                  // full description
  synopsis_short: text("synopsis_short"),      // ≤ 280 chars teaser
});

// ─────────────────────────────────────────────────────────────
// §4  SEASONS
// ─────────────────────────────────────────────────────────────

/**
 * seasons  –  season groups within a series / anime.
 * Movies and OVAs do NOT get seasons (total_seasons = NULL on media).
 */
export const seasonsTable = sqliteTable("seasons", {
  id: primaryKey(integer("id")),
  media_id: notNull(references(integer("media_id"), { table: "media", column: "id" })),
  season_number: notNull(integer("season_number")),  // 0 = "Specials"
  episode_count: default_(integer("episode_count"), 0),
  air_date: text("air_date"),
  end_date: text("end_date"),
  score: default_(real("score"), 0),
  score_count: default_(integer("score_count"), 0),
  external_ids: text("external_ids"),           // {tmdb, anidb …}
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
  name: text("name"),                           // e.g. "Season 1" / "Shingeki no Kyojin"
  synopsis: text("synopsis"),
});

// ─────────────────────────────────────────────────────────────
// §5  EPISODES
// ─────────────────────────────────────────────────────────────

/**
 * episodes  –  individual episodes within a season.
 * Also used for OVA entries (season_id = NULL, episode_number used directly).
 */
export const episodesTable = sqliteTable("episodes", {
  id: primaryKey(integer("id")),
  media_id: notNull(references(integer("media_id"), { table: "media", column: "id" })),
  season_id: references(integer("season_id"), { table: "seasons", column: "id" }),
  episode_number: notNull(integer("episode_number")),
  absolute_number: integer("absolute_number"),  // global episode count across seasons
  episode_type: default_(text("episode_type"), "regular"), // "regular"|"special"|"recap"|"ova"
  air_date: text("air_date"),
  runtime_minutes: integer("runtime_minutes"),
  score: default_(real("score"), 0),
  score_count: default_(integer("score_count"), 0),
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

// ─────────────────────────────────────────────────────────────
// §6  IMAGES
// ─────────────────────────────────────────────────────────────

/**
 * images  –  all artwork for any entity.
 *
 * entity_type: "media" | "season" | "episode" | "person" | "studio" | "network"
 * image_type:  "poster" | "backdrop" | "banner" | "logo" | "thumbnail" | "profile" | "still"
 */
export const imagesTable = sqliteTable("images", {
  id: primaryKey(integer("id")),
  entity_type: notNull(text("entity_type")),    // polymorphic parent type
  entity_id: notNull(integer("entity_id")),     // polymorphic parent id
  image_type: notNull(text("image_type")),      // "poster"|"backdrop"|"banner"|"logo"|"thumbnail"|"profile"|"still"
  locale: text("locale"),                       // NULL = language-neutral
  url: notNull(text("url")),                    // absolute URL or relative path
  width: integer("width"),                      // pixels
  height: integer("height"),
  aspect_ratio: real("aspect_ratio"),
  source: text("source"),                       // "tmdb"|"tvdb"|"mal"|"user"|"internal"
  source_id: text("source_id"),                 // ID at source provider
  vote_average: default_(real("vote_average"), 0),
  vote_count: default_(integer("vote_count"), 0),
  is_primary: default_(boolean("is_primary"), 0), // TRUE = default image for its type
  created_at: default_(text("created_at"), NOW),
});

// ─────────────────────────────────────────────────────────────
// §7  CREDITS / CAST / CREW
// ─────────────────────────────────────────────────────────────

/**
 * credits  –  links a person to a media entity with their role.
 *
 * credit_type: "cast" | "crew"
 * For cast: role_name = character name
 * For crew: department + job (e.g. "Directing" / "Director")
 */
export const creditsTable = sqliteTable("credits", {
  id: primaryKey(integer("id")),
  media_id: notNull(references(integer("media_id"), { table: "media", column: "id" })),
  person_id: notNull(references(integer("person_id"), { table: "people", column: "id" })),
  credit_type: notNull(text("credit_type")),    // "cast"|"crew"
  role_name: text("role_name"),                 // character name / job title
  department: text("department"),               // "Directing"|"Writing"|"Animation" …
  job: text("job"),                             // "Director"|"Screenplay"|"Character Design"
  "order": default_(integer("order"), 999),       // billing order for cast
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

// ─────────────────────────────────────────────────────────────
// §8  TAXONOMY JUNCTION TABLES
// ─────────────────────────────────────────────────────────────

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

/** media ←→ studios  (M:N – a title can be co-produced) */
export const mediaStudiosTable = sqliteTable("media_studios", {
  id: primaryKey(integer("id")),
  media_id: notNull(references(integer("media_id"), { table: "media", column: "id" })),
  studio_id: notNull(references(integer("studio_id"), { table: "studios", column: "id" })),
  is_main: default_(boolean("is_main"), 0),     // primary production studio
});

/** media ←→ networks  (M:N – simulcast on multiple platforms) */
export const mediaNetworksTable = sqliteTable("media_networks", {
  id: primaryKey(integer("id")),
  media_id: notNull(references(integer("media_id"), { table: "media", column: "id" })),
  network_id: notNull(references(integer("network_id"), { table: "networks", column: "id" })),
  region: text("region"),                       // ISO 3166-1 alpha-2 availability
});

// ─────────────────────────────────────────────────────────────
// §9  RELATED CONTENT
// ─────────────────────────────────────────────────────────────

/**
 * media_relations  –  links between media entries.
 *
 * relation_type: "sequel"|"prequel"|"alternative"|"spin_off"|
 *                "side_story"|"adaptation"|"character"|"summary"|"other"
 */
export const mediaRelationsTable = sqliteTable("media_relations", {
  id: primaryKey(integer("id")),
  source_media_id: notNull(references(integer("source_media_id"), { table: "media", column: "id" })),
  related_media_id: notNull(references(integer("related_media_id"), { table: "media", column: "id" })),
  relation_type: notNull(text("relation_type")),
});

// ─────────────────────────────────────────────────────────────
// §10  TRAILERS / VIDEOS
// ─────────────────────────────────────────────────────────────

/**
 * videos  –  trailers, teasers, openings, endings, clips.
 *
 * video_type: "trailer"|"teaser"|"clip"|"featurette"|"opening"|"ending"|"recap"|"behind_the_scenes"
 * site:       "youtube"|"vimeo"|"bilibili"|"niconico"
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
  key: notNull(text("key")),                    // platform video ID (e.g. YouTube key)
  thumbnail_url: text("thumbnail_url"),
  published_at: text("published_at"),
  official: default_(boolean("official"), 1),
  created_at: default_(text("created_at"), NOW),
});

// ─────────────────────────────────────────────────────────────
// §11  COMMENTS / REVIEWS
// ─────────────────────────────────────────────────────────────

/**
 * comments  –  public user comments on any entity.
 *
 * entity_type: "media" | "season" | "episode"
 * Threaded via parent_id (1-level deep to keep it simple).
 * No auth required – authors identified by display_name + ip_hash.
 */
export const commentsTable = sqliteTable("comments", {
  id: primaryKey(integer("id")),
  entity_type: notNull(text("entity_type")),
  entity_id: notNull(integer("entity_id")),
  parent_id: references(integer("parent_id"), { table: "comments", column: "id" }),

  // Author info (no auth)
  display_name: notNull(text("display_name")),
  ip_hash: notNull(text("ip_hash")),            // SHA-256 of IP – not the IP itself

  // Content
  locale: default_(text("locale"), "en"),
  body: notNull(text("body")),
  contains_spoilers: default_(boolean("contains_spoilers"), 0),

  // Moderation
  is_hidden: default_(boolean("is_hidden"), 0),
  hidden_reason: text("hidden_reason"),

  // Reactions
  likes: default_(integer("likes"), 0),
  dislikes: default_(integer("dislikes"), 0),

  created_at: default_(text("created_at"), NOW),
  updated_at: default_(text("updated_at"), NOW),
});

// ─────────────────────────────────────────────────────────────
// §12  RATINGS
// ─────────────────────────────────────────────────────────────

/**
 * ratings  –  anonymous/session-based score for any entity.
 *
 * score: 1–10 (integer)
 * session_id: client-generated UUID stored in a cookie
 */
export const ratingsTable = sqliteTable("ratings", {
  id: primaryKey(integer("id")),
  entity_type: notNull(text("entity_type")),    // "media"|"season"|"episode"
  entity_id: notNull(integer("entity_id")),
  session_id: notNull(text("session_id")),      // UUID from client cookie
  ip_hash: notNull(text("ip_hash")),
  score: notNull(integer("score")),             // 1-10
  created_at: default_(text("created_at"), NOW),
  updated_at: default_(text("updated_at"), NOW),
});

// ─────────────────────────────────────────────────────────────
// §13  COLLECTIONS / FRANCHISES
// ─────────────────────────────────────────────────────────────

/**
 * collections  –  a named group of related media
 *  (e.g. "Marvel Cinematic Universe", "Gundam Franchise")
 */
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

// ─────────────────────────────────────────────────────────────
// §14  RATE-LIMIT MIDDLEWARE TRACKING
// ─────────────────────────────────────────────────────────────

/**
 * rate_limits  –  in-DB rate-limit counters per IP per endpoint.
 *
 * The middleware upserts a row per (ip_hash, endpoint, window_start).
 * Rows older than `window_seconds` are irrelevant and can be pruned.
 *
 * window algorithm: fixed-window counter (simple + fast for SQLite).
 */
export const rateLimitsTable = sqliteTable("rate_limits", {
  id: primaryKey(integer("id")),
  ip_hash: notNull(text("ip_hash")),
  endpoint: notNull(text("endpoint")),          // e.g. "/api/v1/media"
  window_start: notNull(text("window_start")),  // ISO 8601 UTC timestamp (rounded to window)
  window_seconds: default_(integer("window_seconds"), 60),
  request_count: default_(integer("request_count"), 0),
  limit: default_(integer("limit"), 60),        // max requests per window
  blocked_at: text("blocked_at"),               // set when first exceeded
  created_at: default_(text("created_at"), NOW),
});

// ─────────────────────────────────────────────────────────────
// §15  API QUERY LOGS (optional, lightweight analytics)
// ─────────────────────────────────────────────────────────────

/**
 * api_logs  –  lightweight access log for analytics / debugging.
 * Only write on non-cached responses; keep pruned.
 */
export const apiLogsTable = sqliteTable("api_logs", {
  id: primaryKey(integer("id")),
  ip_hash: notNull(text("ip_hash")),
  method: notNull(text("method")),              // HTTP verb
  path: notNull(text("path")),
  query: text("query"),                         // raw query string
  locale: text("locale"),                       // Accept-Language resolved locale
  status_code: notNull(integer("status_code")),
  response_ms: integer("response_ms"),          // latency
  user_agent: text("user_agent"),
  created_at: default_(text("created_at"), NOW),
});

// ─────────────────────────────────────────────────────────────
// §16  I18n – MISSING TRANSLATION REPORTS
// ─────────────────────────────────────────────────────────────

/**
 * translation_requests  –  tracks which (entity × locale) translations
 * are missing, helping editors prioritize localization work.
 */
export const translationRequestsTable = sqliteTable("translation_requests", {
  id: primaryKey(integer("id")),
  entity_type: notNull(text("entity_type")),    // "media"|"season"|"episode"|"genre"|"person"
  entity_id: notNull(integer("entity_id")),
  locale: notNull(references(text("locale"), { table: "languages", column: "code" })),
  request_count: default_(integer("request_count"), 0),
  last_requested_at: default_(text("last_requested_at"), NOW),
});

// ─────────────────────────────────────────────────────────────
// §18  USER ACCOUNTS & AUTHENTICATION
// ─────────────────────────────────────────────────────────────

/**
 * users  –  registered user accounts
 */
export const usersTable = sqliteTable("users", {
  id: primaryKey(integer("id")),
  username: notNull(unique(text("username"))),
  email: notNull(unique(text("email"))),
  password_hash: notNull(text("password_hash")),   // bcrypt hash
  display_name: text("display_name"),              // optional display name
  role: default_(text("role"), "user"),            // "user"|"editor"|"admin"
  is_active: default_(boolean("is_active"), 1),
  created_at: default_(text("created_at"), NOW),
  updated_at: default_(text("updated_at"), NOW),
});

/**
 * sessions  –  active login sessions
 */
export const sessionsTable = sqliteTable("sessions", {
  id: primaryKey(integer("id")),
  user_id: notNull(references(integer("user_id"), { table: "users", column: "id" })),
  token: notNull(unique(text("token"))),           // JWT or session token
  expires_at: notNull(text("expires_at")),         // ISO 8601
  ip_hash: text("ip_hash"),
  user_agent: text("user_agent"),
  created_at: default_(text("created_at"), NOW),
});

/**
 * password_resets  –  password reset tokens
 */
export const passwordResetsTable = sqliteTable("password_resets", {
  id: primaryKey(integer("id")),
  user_id: notNull(references(integer("user_id"), { table: "users", column: "id" })),
  token: notNull(unique(text("token"))),
  expires_at: notNull(text("expires_at")),
  used_at: text("used_at"),
  created_at: default_(text("created_at"), NOW),
});

// ─────────────────────────────────────────────────────────────
// §17  EXPORTS – ordered by dependency for table creation
// ─────────────────────────────────────────────────────────────

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

  // user accounts & auth
  usersTable,
  sessionsTable,
  passwordResetsTable,
] as const;

// ─────────────────────────────────────────────────────────────
// §18  TypeScript Inference Helpers
// ─────────────────────────────────────────────────────────────

// Re-export for external use
export type {
  SQLiteTable,
} from "./core/index";

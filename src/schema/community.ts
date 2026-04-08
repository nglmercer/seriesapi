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

const NOW = "CURRENT_TIMESTAMP";

/**
 * users  –  registered user accounts
 */
export const usersTable = sqliteTable("users", {
  id: primaryKey(integer("id")),
  username: notNull(unique(text("username"))),
  email: notNull(unique(text("email"))),
  password_hash: notNull(text("password_hash")),
  display_name: text("display_name"),
  role: default_(text("role"), "user"),
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
  token: notNull(unique(text("token"))),
  expires_at: notNull(text("expires_at")),
  ip_hash: text("ip_hash"),
  user_agent: text("user_agent"),
  created_at: default_(text("created_at"), NOW),
});

/**
 * comments  –  public user comments on any entity.
 */
export const commentsTable = sqliteTable("comments", {
  id: primaryKey(integer("id")),
  entity_type: notNull(text("entity_type")),
  entity_id: notNull(integer("entity_id")),
  parent_id: references(integer("parent_id"), { table: "comments", column: "id" }),
  display_name: notNull(text("display_name")),
  ip_hash: notNull(text("ip_hash")),
  locale: default_(text("locale"), "en"),
  body: notNull(text("body")),
  contains_spoilers: default_(boolean("contains_spoilers"), 0),
  is_hidden: default_(boolean("is_hidden"), 0),
  hidden_reason: text("hidden_reason"),
  likes: default_(integer("likes"), 0),
  dislikes: default_(integer("dislikes"), 0),
  created_at: default_(text("created_at"), NOW),
  updated_at: default_(text("updated_at"), NOW),
});

/**
 * ratings  –  anonymous/session-based score for any entity.
 */
export const ratingsTable = sqliteTable("ratings", {
  id: primaryKey(integer("id")),
  entity_type: notNull(text("entity_type")),
  entity_id: notNull(integer("entity_id")),
  user_id: notNull(references(integer("user_id"), { table: "users", column: "id" })),
  ip_hash: notNull(text("ip_hash")),
  score: notNull(integer("score")),
  created_at: default_(text("created_at"), NOW),
  updated_at: default_(text("updated_at"), NOW),
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

/**
 * verification_codes  –  codes for changing user roles
 */
export const verificationCodesTable = sqliteTable("verification_codes", {
  id: primaryKey(integer("id")),
  code: notNull(unique(text("code"))),
  target_role: notNull(text("target_role")),
  user_id: notNull(references(integer("user_id"), { table: "users", column: "id" })),
  expires_at: notNull(text("expires_at")),
  used: default_(integer("used"), 0),
  created_at: default_(text("created_at"), NOW),
});

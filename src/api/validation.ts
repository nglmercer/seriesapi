import { z } from "zod";
import { badRequest } from "./response";
import { SUPPORTED_LOCALES } from "../i18n";

/**
 * Common Zod Schemas for API validation
 */

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).optional(),
});

export const localeSchema = z.enum([...SUPPORTED_LOCALES] as [string, ...string[]]).optional();

export const searchSchema = z.string().trim().min(1, "Search query must be at least 1 characters");

export const idSchema = z.coerce.number().int().positive();

export const sortOrderSchema = z.enum(["asc", "desc"]).default("desc");

/**
 * Validation result wrappers
 */

export interface ValidationSuccess<T> {
  success: true;
  data: T;
}

export interface ValidationFailure {
  success: false;
  error: Response;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

/**
 * Helper to perform validation and return standardized success/failure
 */
export function validateParams<T>(schema: z.ZodSchema<T>, params: unknown, locale: string): ValidationResult<T> {
  const result = schema.safeParse(params);
  if (!result.success) {
    const message = result.error.issues
      .map((e) => `${e.path.join(".") || "param"}: ${e.message}`)
      .join(", ");
    return {
      success: false,
      error: badRequest(message, locale),
    };
  }
  return {
    success: true,
    data: result.data,
  };
}

export const searchParamsSchema = z.object({
  q: searchSchema,
  type: z.enum(["media", "person", "collection"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Shared entity filters
 */
export const mediaFilterSchema = z.object({
  type: z.string().optional(),
  genre: z.string().optional(),
  tag: z.string().optional(),
  status: z.string().optional(),
  sort_by: z.enum(["popularity", "score", "release_date", "title"]).default("popularity"),
  order: sortOrderSchema,
  q: z.string().optional(),
  year_from: z.coerce.number().int().optional(),
  year_to: z.coerce.number().int().optional(),
  score_from: z.coerce.number().optional(),
});

export const mediaListParamsSchema = mediaFilterSchema.extend({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).optional(),
});

export const genreDetailParamsSchema = z.object({
  type: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const episodeParamsSchema = z.object({
  season: z.coerce.number().int().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const imageParamsSchema = z.object({
  type: z.string().optional(),
});

export const personListParamsSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const commentCreateSchema = z.object({
  entity_type: z.enum(["media", "season", "episode"]),
  entity_id: idSchema,
  display_name: z.string().trim().min(2).max(64),
  body: z.string().trim().min(1).max(2000),
  locale: localeSchema,
  contains_spoilers: z.boolean().optional().default(false),
  parent_id: idSchema.optional().nullable(),
});

export const registerSchema = z.object({
  username: z.string().trim().min(3).max(32),
  email: z.email(),
  password: z.string().min(6),
  display_name: z.string().trim().min(2).max(64).optional(),
});

export const loginSchema = z.object({
  username: z.string().trim(), // can be email too
  password: z.string(),
});

export const userUpdateSchema = z.object({
  display_name: z.string().trim().min(2).max(64).optional(),
  email: z.email().optional(),
  password: z.string().min(6).optional(),
});

export const reportCreateSchema = z.object({
  entity_type: z.string().trim(),
  entity_id: idSchema,
  report_type: z.string().trim(),
  locale: localeSchema.nullable().optional(),
  message: z.string().trim().max(1000).nullable().optional(),
});

export const translationRequestSchema = z.object({
  entity_type: z.string().trim(),
  entity_id: idSchema,
  locale: z.string().trim(),
});

export const roleChallengeSchema = z.object({
  target_role: z.enum(["user", "editor", "admin"]),
});

/**
 * API response helpers
 * Provides consistent JSON envelope + header injection for every route.
 */

import { corsHeaders } from "../middleware/ratelimit";

export interface ApiMeta {
  locale: string;
  page?: number;
  pageSize?: number;
  total?: number;
  [key: string]: unknown;
}

export interface ApiResponse<T> {
  ok: boolean;
  data: T | null;
  error?: string;
  meta: ApiMeta;
}

const BASE_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
  ...corsHeaders(),
};

export function ok<T>(data: T, meta: ApiMeta, status = 200): Response {
  const body: ApiResponse<T> = { ok: true, data, meta };
  const headers = new Headers(BASE_HEADERS);
  if (meta.locale) {
    headers.set("Content-Language", meta.locale);
  }
  return new Response(JSON.stringify(body), {
    status,
    headers,
  });
}

export function notFound(resource: string, locale: string): Response {
  const body: ApiResponse<null> = {
    ok: false,
    data: null,
    error: `${resource} not found`,
    meta: { locale },
  };
  const headers = new Headers({ ...BASE_HEADERS, "Cache-Control": "no-store" });
  if (locale) headers.set("Content-Language", locale);
  return new Response(JSON.stringify(body), {
    status: 404,
    headers,
  });
}

export function badRequest(message: string, locale: string): Response {
  const body: ApiResponse<null> = {
    ok: false,
    data: null,
    error: message,
    meta: { locale },
  };
  return new Response(JSON.stringify(body), {
    status: 400,
    headers: { ...BASE_HEADERS, "Cache-Control": "no-store" },
  });
}

export function unauthorized(message: string, locale: string): Response {
  const body: ApiResponse<null> = {
    ok: false,
    data: null,
    error: message,
    meta: { locale },
  };
  return new Response(JSON.stringify(body), {
    status: 401,
    headers: { ...BASE_HEADERS, "Cache-Control": "no-store" },
  });
}

export function serverError(err: unknown, locale: string): Response {
  console.error("[anima] Internal error:", err);
  const body: ApiResponse<null> = {
    ok: false,
    data: null,
    error: "Internal server error",
    meta: { locale },
  };
  return new Response(JSON.stringify(body), {
    status: 500,
    headers: { ...BASE_HEADERS, "Cache-Control": "no-store" },
  });
}

// ─── Pagination helpers ───────────────────────────────────────────────────────

export interface PaginationParams {
  page: number;
  pageSize: number;
  offset: number;
}

export function parsePagination(url: URL): PaginationParams {
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10) || 20),
  );
  return { page, pageSize, offset: (page - 1) * pageSize };
}

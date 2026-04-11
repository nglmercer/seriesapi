/**
 * Rate-limit middleware for Bun's HTTP server.
 *
 * Strategy: fixed-window counter per (ip_hash, endpoint, window).
 * All state is kept in-memory (Map) with an optional DB flush.
 * No auth required – all routes are public.
 *
 * Usage:
 *   const limiter = createRateLimiter({ windowMs: 60_000, max: 60 });
 *   const response = limiter.check(req);
 *   if (response) return response;   // 429 Too Many Requests
 */

import { createHash } from "crypto";
import type { Database } from "sqlite-napi";

// ─── Constants & Enums ────────────────────────────────────────────────────────

export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  OPTIONS = "OPTIONS",
}

export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
}

export enum HttpHeader {
  CONTENT_TYPE = "Content-Type",
  AUTHORIZATION = "Authorization",
  ORIGIN = "Origin",
  X_FORWARDED_FOR = "X-Forwarded-For",
  RETRY_AFTER = "Retry-After",
  RATELIMIT_LIMIT = "X-RateLimit-Limit",
  RATELIMIT_REMAINING = "X-RateLimit-Remaining",
  RATELIMIT_RESET = "X-RateLimit-Reset",
  CORS_ALLOW_ORIGIN = "Access-Control-Allow-Origin",
  CORS_ALLOW_METHODS = "Access-Control-Allow-Methods",
  CORS_ALLOW_HEADERS = "Access-Control-Allow-Headers",
  CORS_MAX_AGE = "Access-Control-Max-Age",
}

export enum ContentType {
  JSON = "application/json",
  HTML = "text/html",
  PLAIN = "text/plain",
}

const DURATIONS = {
  MINUTE: 60_000,
  PRUNE_INTERVAL: 5 * 60_000,
  CORS_MAX_AGE: 86400, // 24 hours in seconds
};

const DEFAULTS = {
  WINDOW_MS: DURATIONS.MINUTE,
  MAX_REQUESTS: 60,
  UNKNOWN_IP: "unknown",
  ID_PLACEHOLDER: "/:id",
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RateLimiterOptions {
  /** Window duration in milliseconds. Default: 60 000 (1 min) */
  windowMs?: number;
  /** Max requests per window per IP. Default: 60 */
  max?: number;
  /** Whether to persist counters to the DB. Default: false */
  persist?: boolean;
  db?: Database;
  /** Custom key generator – receives Request, returns string */
  keyFn?: (req: Request) => string;
}

interface Counter {
  count: number;
  windowStart: number;
}

// ─── In-memory store ─────────────────────────────────────────────────────────

const store = new Map<string, Counter>();

// Prune expired entries
let pruneTimer: ReturnType<typeof setInterval> | null = null;

function startPruning(windowMs: number) {
  if (pruneTimer) return;
  pruneTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, counter] of store.entries()) {
      if (now - counter.windowStart >= windowMs) store.delete(key);
    }
  }, Math.max(windowMs, DURATIONS.PRUNE_INTERVAL));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hashIP(req: Request): string {
  const forwarded = req.headers.get(HttpHeader.X_FORWARDED_FOR.toLowerCase());
  if (!forwarded || typeof forwarded !== "string") {
    return DEFAULTS.UNKNOWN_IP;
  }
  const ip = forwarded.split(",")[0]!.trim();
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

function getEndpoint(req: Request): string {
  const url = new URL(req.url);
  // Collapse IDs to keep key space small: /api/v1/media/123 → /api/v1/media/:id
  return url.pathname.replace(/\/\d+/g, DEFAULTS.ID_PLACEHOLDER);
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export interface RateLimiter {
  /** Returns a 429 Response if limited, undefined otherwise. */
  check(req: Request): Response | undefined;
  /** Expose current counters (for /health or monitoring). */
  stats(): { activeKeys: number };
}

export function createRateLimiter(opts: RateLimiterOptions = {}): RateLimiter {
  const windowMs = opts.windowMs ?? DEFAULTS.WINDOW_MS;
  const max = opts.max ?? DEFAULTS.MAX_REQUESTS;
  const keyFn = opts.keyFn ?? ((req) => `${hashIP(req)}:${getEndpoint(req)}`);

  startPruning(windowMs);

  return {
    check(req: Request): Response | undefined {
      const key = keyFn(req);
      const now = Date.now();
      let counter = store.get(key);

      if (!counter || now - counter.windowStart >= windowMs) {
        counter = { count: 0, windowStart: now };
      }

      counter.count++;
      store.set(key, counter);

      const remaining = Math.max(0, max - counter.count);
      const reset = Math.ceil((counter.windowStart + windowMs) / 1000);

      // Always attach headers; only block when over limit
      const headers = {
        [HttpHeader.RATELIMIT_LIMIT]: String(max),
        [HttpHeader.RATELIMIT_REMAINING]: String(remaining),
        [HttpHeader.RATELIMIT_RESET]: String(reset),
        [HttpHeader.RETRY_AFTER]: counter.count > max ? String(Math.ceil(windowMs / 1000)) : "",
      };

      if (counter.count > max) {
        return new Response(
          JSON.stringify({
            error: "Too Many Requests",
            message: `Rate limit exceeded. Try again in ${Math.ceil((counter.windowStart + windowMs - now) / 1000)}s.`,
            retryAfter: reset,
          }),
          {
            status: HttpStatus.TOO_MANY_REQUESTS,
            headers: { 
              [HttpHeader.CONTENT_TYPE]: ContentType.JSON, 
              ...headers,
              ...corsHeaders(req.headers.get(HttpHeader.ORIGIN.toLowerCase()))
            },
          },
        );
      }
    },

    stats() {
      return { activeKeys: store.size };
    },
  };
}

// ─── CORS helper ─────────────────────────────────────────────────────────────

export function corsHeaders(origin?: string | null): Record<string, string> {
  return {
    [HttpHeader.CORS_ALLOW_ORIGIN]: origin ?? "*",
    [HttpHeader.CORS_ALLOW_METHODS]: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    [HttpHeader.CORS_ALLOW_HEADERS]: `${HttpHeader.CONTENT_TYPE}, Accept-Language, Authorization`,
    [HttpHeader.CORS_MAX_AGE]: String(DURATIONS.CORS_MAX_AGE),
  };
}

/** Respond to OPTIONS pre-flight */
export function handlePreflight(req: Request): Response | undefined {
  if (req.method === HttpMethod.OPTIONS) {
    return new Response(null, {
      status: HttpStatus.NO_CONTENT,
      headers: corsHeaders(req.headers.get(HttpHeader.ORIGIN.toLowerCase())),
    });
  }
}

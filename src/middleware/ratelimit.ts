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

// Prune expired entries every 5 minutes
let pruneTimer: ReturnType<typeof setInterval> | null = null;

function startPruning(windowMs: number) {
  if (pruneTimer) return;
  pruneTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, counter] of store.entries()) {
      if (now - counter.windowStart >= windowMs) store.delete(key);
    }
  }, Math.max(windowMs, 5 * 60_000));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hashIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (!forwarded || typeof forwarded !== "string") {
    return "unknown";
  }
  const ip = forwarded.split(",")[0]!.trim();
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

function getEndpoint(req: Request): string {
  const url = new URL(req.url);
  // Collapse IDs to keep key space small: /api/v1/media/123 → /api/v1/media/:id
  return url.pathname.replace(/\/\d+/g, "/:id");
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export interface RateLimiter {
  /** Returns a 429 Response if limited, undefined otherwise. */
  check(req: Request): Response | undefined;
  /** Expose current counters (for /health or monitoring). */
  stats(): { activeKeys: number };
}

export function createRateLimiter(opts: RateLimiterOptions = {}): RateLimiter {
  const windowMs = opts.windowMs ?? 60_000;
  const max = opts.max ?? 60;
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
        "X-RateLimit-Limit": String(max),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(reset),
        "Retry-After": counter.count > max ? String(Math.ceil(windowMs / 1000)) : "",
      };

      if (counter.count > max) {
        return new Response(
          JSON.stringify({
            error: "Too Many Requests",
            message: `Rate limit exceeded. Try again in ${Math.ceil((counter.windowStart + windowMs - now) / 1000)}s.`,
            retryAfter: reset,
          }),
          {
            status: 429,
            headers: { 
              "Content-Type": "application/json", 
              ...headers,
              ...corsHeaders(req.headers.get("origin"))
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
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept-Language",
    "Access-Control-Max-Age": "86400",
  };
}

/** Respond to OPTIONS pre-flight */
export function handlePreflight(req: Request): Response | undefined {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(req.headers.get("origin")),
    });
  }
}

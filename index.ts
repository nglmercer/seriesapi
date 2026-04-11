import { initializeDatabase, getDb } from "./src/init";
import { createRateLimiter, handlePreflight, HttpHeader, ContentType, HttpStatus } from "./src/middleware/ratelimit";
import { createRouteHandler } from "./src/api/routes";
import admin_view from './web/admin.html'
import public_view from './web/index.html'

const PORT = parseInt(process.env.PORT ?? "3000", 10);
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000", 10);
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX ?? "60", 10);

await initializeDatabase();

const limiter = createRateLimiter({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
});

const route = createRouteHandler(getDb);

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const preflight = handlePreflight(req);
    if (preflight) return preflight;

    const limited = limiter.check(req);
    if (limited) return limited;

    const url = new URL(req.url);
    const path = url.pathname;
    console.log(`[anima] Request: ${path}`);

    if (path.startsWith("/api/")) {
      return await route(req);
    }
    return new Response("Not Found", {
      status: HttpStatus.NOT_FOUND,
      headers: { [HttpHeader.CONTENT_TYPE]: ContentType.PLAIN },
    });
  },
  routes: {
    '/': public_view,
    '/admin': admin_view
  }
});

console.log(`[anima] Listening on http://localhost:${server.port}`);
console.log(`[anima] Rate limit: ${RATE_LIMIT_MAX} req / ${RATE_LIMIT_WINDOW_MS / 1000}s`);
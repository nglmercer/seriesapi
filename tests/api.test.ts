import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { getDb, enableInMemoryDatabase, initializeDatabase, closeDatabase } from "../src/init";
import { parseAcceptLanguage, resolveLocale, SUPPORTED_LOCALES } from "../src/i18n";
import { createRateLimiter } from "../src/middleware/ratelimit";
import { handleMediaList, handleMediaDetail } from "../src/api/routes/media";

describe("anima API Core & Routes", () => {
  beforeAll(async () => {
    // Setup an in-memory DB and initialize our schemas
    enableInMemoryDatabase();
    await initializeDatabase();
    const db = getDb();

    // 1. Seed dependencies: languages, content_types
    db.run("INSERT INTO languages (code, name) VALUES ('en', 'English'), ('es', 'Spanish')");
    db.run("INSERT INTO content_types (slug, label) VALUES ('movie', 'Movie'), ('anime', 'Anime')");
    
    const contentTypeMovie = db.query("SELECT id FROM content_types WHERE slug = 'movie'").get() as { id: number };

    // 2. Seed a movie
    const insertMedia = db.run(
      `INSERT INTO media (content_type_id, slug, original_title, release_date, score, popularity)
       VALUES (?, 'test-movie', 'Original Test Title', '2023-01-01', 8.5, 100)`,
      [contentTypeMovie.id]
    );
    const mediaId = insertMedia.lastInsertRowid;

    // 3. Seed translations for English and Spanish
    db.run(
      `INSERT INTO media_translations (media_id, locale, title, synopsis_short)
       VALUES (?, 'en', 'English Test Title', 'English short synopsis')`,
      [mediaId]
    );
    db.run(
      `INSERT INTO media_translations (media_id, locale, title, synopsis_short)
       VALUES (?, 'es', 'Título de Prueba Español', 'Sinopsis corta en español')`,
      [mediaId]
    );

    // 4. Seed an image
    db.run(
      `INSERT INTO images (entity_type, entity_id, image_type, url, is_primary)
       VALUES ('media', ?, 'poster', 'http://example.com/poster.jpg', 1)`,
      [mediaId]
    );
  });

  afterAll(() => {
    // Clean up
    closeDatabase();
  });

  describe("i18n module", () => {
    it("should parse Accept-Language header correctly", () => {
      const parsed = parseAcceptLanguage("es-MX,es;q=0.9,en;q=0.8");
      expect(parsed[0]).toBe("es-MX");
      expect(parsed[1]).toBe("es");
      expect(parsed[2]).toBe("en");
    });

    it("should resolve locale to supported languages", () => {
      // Fallback to 'es' since pt-BR isn't in our custom Set
      expect(resolveLocale("pt-BR,pt;q=0.9,es;q=0.8", new Set(["en", "es"]))).toBe("es");
      
      // Fallback to exactly en
      expect(resolveLocale("ru,ru-RU;q=0.9", new Set(["en", "es"]))).toBe("en");
    });
  });

  describe("Rate Limiter Middleware", () => {
    it("should block requests exceeding the limit", () => {
      const limiter = createRateLimiter({ windowMs: 1000, max: 2 });
      
      const req = new Request("http://localhost/api/v1/test", {
        headers: { "x-forwarded-for": "192.168.1.1" }
      });

      // Request 1 - OK
      expect(limiter.check(req)).toBeUndefined();
      
      // Request 2 - OK
      expect(limiter.check(req)).toBeUndefined();
      
      // Request 3 - Blocked
      const blocked = limiter.check(req);
      expect(blocked).not.toBeUndefined();
      expect(blocked?.status).toBe(429);
      expect(blocked?.headers.get("X-RateLimit-Remaining")).toBe("0");
    });
  });

  describe("Media Routes", () => {
    it("should list media in English by default", async () => {
      const db = getDb();
      const req = new Request("http://localhost/api/v1/media");
      const res = handleMediaList(req, db);
      
      expect(res.status).toBe(200);
      
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.data).toBeArray();
      expect(body.data.length).toBeGreaterThan(0);
      
      const item = body.data[0];
      expect(item.title).toBe("English Test Title");          // Fetched mapped english title
      expect(item.poster_url).toBe("http://example.com/poster.jpg"); // Image relation fetched
    });

    it("should respect Accept-Language header to list media in Spanish", async () => {
      const db = getDb();
      const req = new Request("http://localhost/api/v1/media", {
        headers: { "Accept-Language": "es-ES,es;q=0.9" } // user requests spanish
      });
      const res = handleMediaList(req, db);
      
      const body = await res.json();
      const item = body.data[0];
      
      expect(body.meta.locale).toBe("es");
      expect(item.title).toBe("Título de Prueba Español");
    });

    it("should fetch a specific media details", async () => {
      const db = getDb();
      // Assume the seed media got ID 1
      const req = new Request("http://localhost/api/v1/media/1");
      const res = handleMediaDetail(req, db, 1);
      
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.original_title).toBe("Original Test Title");
      expect(body.data.score).toBe(8.5);
    });

    it("should return 404 for missing media details", async () => {
      const db = getDb();
      const req = new Request("http://localhost/api/v1/media/999");
      const res = handleMediaDetail(req, db, 999);
      
      expect(res.status).toBe(404);
    });
  });
});

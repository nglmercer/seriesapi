import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { getDb, enableInMemoryDatabase, initializeDatabase, closeDatabase } from "../src/init";
import { parseAcceptLanguage, resolveLocale } from "../src/i18n";
import { createRateLimiter } from "../src/middleware/ratelimit";
import { handleMediaList, handleMediaDetail, handleMediaSeasons, handleMediaEpisodes, handleMediaCredits, handleMediaVideos, handleMediaRelated, handleMediaImages } from "../src/api/routes/media";
import { handlePeopleList, handlePersonDetail, handlePersonCredits } from "../src/api/routes/people";
import { handleSeasonDetail, handleSeasonEpisodes, handleSeasonImages } from "../src/api/routes/seasons";
import { handleEpisodeDetail, handleEpisodeCredits, handleEpisodeImages } from "../src/api/routes/episodes";
import { handleCommentPost, handleCommentGet } from "../src/api/routes/comments";
import { handleSearch } from "../src/api/routes/search";
import { handleCollectionsList, handleCollectionDetail } from "../src/api/routes/collections";
import { handleGenresList, handleGenreMedia } from "../src/api/routes/genres";
import { badRequest, serverError, notFound, ok } from "../src/api/response";

function uniqueSlug(prefix: string): string {
  return prefix + "-" + Date.now() + Math.floor(Math.random() * 10000);
}

describe("anima API Core & Routes", () => {
  beforeAll(async () => {
    enableInMemoryDatabase();
    await initializeDatabase();
    const db = getDb();
    db.run("INSERT OR IGNORE INTO languages (code, name) VALUES ('en', 'English'), ('es', 'Spanish')");
    db.run("INSERT OR IGNORE INTO content_types (slug, label) VALUES ('movie', 'Movie'), ('anime', 'Anime'), ('series', 'Series')");
  });

  beforeEach(async () => {
    const db = getDb();
    const safeDelete = (table: string) => { try { db.run("DELETE FROM " + table); } catch {} };
    
    safeDelete("media");
    safeDelete("media_translations");
    safeDelete("images");
    safeDelete("people");
    safeDelete("people_translations");
    safeDelete("seasons");
    safeDelete("season_translations");
    safeDelete("episodes");
    safeDelete("episode_translations");
    safeDelete("comments");
    safeDelete("collections");
    safeDelete("collection_translations");
    safeDelete("collection_items");
    safeDelete("genres");
    safeDelete("genre_translations");
    safeDelete("media_genres");
    safeDelete("credits");
    safeDelete("episode_credits");
    safeDelete("videos");
    safeDelete("media_relations");
  });

  afterAll(() => {
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
      expect(resolveLocale("pt-BR,pt;q=0.9,es;q=0.8", new Set(["en", "es"]))).toBe("es");
      expect(resolveLocale("ru,ru-RU;q=0.9", new Set(["en", "es"]))).toBe("en");
    });
  });

  describe("Rate Limiter Middleware", () => {
    it("should block requests exceeding the limit", () => {
      const limiter = createRateLimiter({ windowMs: 1000, max: 2 });
      
      const req = new Request("http://localhost/api/v1/test", {
        headers: { "x-forwarded-for": "192.168.1.1" }
      });

      expect(limiter.check(req)).toBeUndefined();
      expect(limiter.check(req)).toBeUndefined();
      
      const blocked = limiter.check(req);
      expect(blocked).not.toBeUndefined();
      expect(blocked?.status).toBe(429);
      expect(blocked?.headers.get("X-RateLimit-Remaining")).toBe("0");
    });
  });

  describe("Media Routes", () => {
    it("should list media in English by default", async () => {
      const db = getDb();
      const ct = db.query("SELECT id FROM content_types WHERE slug = 'movie'").get() as { id: number };
      const mResult = db.run(
        `INSERT INTO media (content_type_id, slug, original_title, release_date, score, popularity)
         VALUES (?, ?, 'Original Test Title', '2023-01-01', 8.5, 100)`,
        [ct.id, uniqueSlug("movie")]
      );
      db.run(
        `INSERT INTO media_translations (media_id, locale, title, synopsis_short)
         VALUES (?, 'en', 'English Test Title', 'English short synopsis')`,
        [mResult.lastInsertRowid]
      );
      db.run(
        `INSERT INTO images (entity_type, entity_id, image_type, url, is_primary)
         VALUES ('media', ?, 'poster', 'http://example.com/poster.jpg', 1)`,
        [mResult.lastInsertRowid]
      );
      
      const req = new Request("http://localhost/api/v1/media");
      const res = handleMediaList(req, db);
      
      expect(res.status).toBe(200);
      const body = await res.json() as { ok: boolean; data: unknown[] };
      expect(body.ok).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
    });

    it("should fetch a specific media details", async () => {
      const db = getDb();
      const ct = db.query("SELECT id FROM content_types WHERE slug = 'movie'").get() as { id: number };
      const mResult = db.run(
        `INSERT INTO media (content_type_id, slug, original_title, score) VALUES (?, ?, 'Original Title', 8.5)`,
        [ct.id, uniqueSlug("moviedetail")]
      );
      const req = new Request(`http://localhost/api/v1/media/${mResult.lastInsertRowid}`);
      const res = handleMediaDetail(req, db, Number(mResult.lastInsertRowid));
      
      expect(res.status).toBe(200);
      const body = await res.json() as { ok: boolean; data: { original_title: string; score: number } };
      expect(body.data.original_title).toBe("Original Title");
      expect(body.data.score).toBe(8.5);
    });

    it("should return 404 for missing media details", async () => {
      const db = getDb();
      const req = new Request("http://localhost/api/v1/media/999");
      const res = handleMediaDetail(req, db, 999);
      expect(res.status).toBe(404);
    });
  });

  describe("API Response Helpers", () => {
    it("should create badRequest response", async () => {
      const res = badRequest("Invalid input", "en");
      expect(res.status).toBe(400);
      const body = await res.json() as { ok: boolean; error: string };
      expect(body.ok).toBe(false);
      expect(body.error).toBe("Invalid input");
    });

    it("should create serverError response", async () => {
      const res = serverError(new Error("test"), "en");
      expect(res.status).toBe(500);
      const body = await res.json() as { ok: boolean; error: string };
      expect(body.ok).toBe(false);
    });

    it("should create notFound response", async () => {
      const res = notFound("Media", "en");
      expect(res.status).toBe(404);
      const body = await res.json() as { ok: boolean; error: string };
      expect(body.ok).toBe(false);
    });

    it("should create ok response with data", async () => {
      const res = ok({ id: 1, name: "test" }, { locale: "en" });
      expect(res.status).toBe(200);
      const body = await res.json() as { ok: boolean; data: unknown };
      expect(body.ok).toBe(true);
    });
  });

  describe("People Routes", () => {
    it("should list people", async () => {
      const db = getDb();
      db.run("INSERT INTO people (name) VALUES ('John Actor')");
      const req = new Request("http://localhost/api/v1/people");
      const res = handlePeopleList(req, db);
      expect(res.status).toBe(200);
    });

    it("should get person detail", async () => {
      const db = getDb();
      const result = db.run("INSERT INTO people (name) VALUES ('John Actor')");
      const req = new Request(`http://localhost/api/v1/people/${result.lastInsertRowid}`);
      const res = handlePersonDetail(req, db, Number(result.lastInsertRowid));
      expect(res.status).toBe(200);
    });

    it("should return 404 for missing person", async () => {
      const db = getDb();
      const req = new Request("http://localhost/api/v1/people/999");
      const res = handlePersonDetail(req, db, 999);
      expect(res.status).toBe(404);
    });
  });

  describe("Seasons Routes", () => {
    it("should get season detail", async () => {
      const db = getDb();
      const ct = db.query("SELECT id FROM content_types WHERE slug = 'series'").get() as { id: number };
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Test')", [ct.id, uniqueSlug("season")]);
      const sResult = db.run("INSERT INTO seasons (media_id, season_number) VALUES (?, 1)", [mResult.lastInsertRowid]);
      const req = new Request(`http://localhost/api/v1/seasons/${sResult.lastInsertRowid}`);
      const res = handleSeasonDetail(req, db, Number(sResult.lastInsertRowid));
      expect(res.status).toBe(200);
    });

    it("should get season episodes", async () => {
      const db = getDb();
      const ct = db.query("SELECT id FROM content_types WHERE slug = 'series'").get() as { id: number };
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Test')", [ct.id, uniqueSlug("seasonep")]);
      const sResult = db.run("INSERT INTO seasons (media_id, season_number) VALUES (?, 1)", [mResult.lastInsertRowid]);
      db.run("INSERT INTO episodes (media_id, season_id, episode_number) VALUES (?, ?, 1)", [mResult.lastInsertRowid, sResult.lastInsertRowid]);
      const req = new Request(`http://localhost/api/v1/seasons/${sResult.lastInsertRowid}/episodes`);
      const res = handleSeasonEpisodes(req, db, Number(sResult.lastInsertRowid));
      expect(res.status).toBe(200);
    });
  });

  describe("Episodes Routes", () => {
    it("should get episode detail", async () => {
      const db = getDb();
      const ct = db.query("SELECT id FROM content_types WHERE slug = 'series'").get() as { id: number };
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Test')", [ct.id, uniqueSlug("episode")]);
      const sResult = db.run("INSERT INTO seasons (media_id, season_number) VALUES (?, 1)", [mResult.lastInsertRowid]);
      const eResult = db.run("INSERT INTO episodes (media_id, season_id, episode_number) VALUES (?, ?, 1)", [mResult.lastInsertRowid, sResult.lastInsertRowid]);
      const req = new Request(`http://localhost/api/v1/episodes/${eResult.lastInsertRowid}`);
      const res = handleEpisodeDetail(req, db, Number(eResult.lastInsertRowid));
      expect(res.status).toBe(200);
    });

    it("should get episode credits", async () => {
      const db = getDb();
      const ct = db.query("SELECT id FROM content_types WHERE slug = 'series'").get() as { id: number };
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Test')", [ct.id, uniqueSlug("epcredit")]);
      const sResult = db.run("INSERT INTO seasons (media_id, season_number) VALUES (?, 1)", [mResult.lastInsertRowid]);
      const eResult = db.run("INSERT INTO episodes (media_id, season_id, episode_number) VALUES (?, ?, 1)", [mResult.lastInsertRowid, sResult.lastInsertRowid]);
      const pResult = db.run("INSERT INTO people (name) VALUES ('Actor')");
      db.run("INSERT INTO episode_credits (episode_id, person_id, credit_type, role_name) VALUES (?, ?, 'cast', 'Hero')", [eResult.lastInsertRowid, pResult.lastInsertRowid]);
      const req = new Request(`http://localhost/api/v1/episodes/${eResult.lastInsertRowid}/credits`);
      const res = handleEpisodeCredits(req, db, Number(eResult.lastInsertRowid));
      expect(res.status).toBe(200);
    });
  });

  describe("Comments Routes", () => {
    it("should post a comment", async () => {
      const db = getDb();
      const ct = db.query("SELECT id FROM content_types WHERE slug = 'movie'").get() as { id: number };
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Test')", [ct.id, uniqueSlug("comment")]);
      const req = new Request("http://localhost/api/v1/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "192.168.1.1" },
        body: JSON.stringify({
          entity_type: "media",
          entity_id: mResult.lastInsertRowid,
          display_name: "TestUser",
          body: "Great movie!"
        })
      });
      const res = await handleCommentPost(req, db);
      expect(res.status).toBe(201);
    });

    it("should reject invalid comment data", async () => {
      const db = getDb();
      const req = new Request("http://localhost/api/v1/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity_type: "media", entity_id: 1, display_name: "x", body: "" })
      });
      const res = await handleCommentPost(req, db);
      expect(res.status).toBe(400);
    });

    it("should get comment by id", async () => {
      const db = getDb();
      const ct = db.query("SELECT id FROM content_types WHERE slug = 'movie'").get() as { id: number };
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Test')", [ct.id, uniqueSlug("getcomment")]);
      db.run("INSERT INTO comments (entity_type, entity_id, display_name, ip_hash, body) VALUES ('media', ?, 'User', 'hash', 'Comment')", [mResult.lastInsertRowid]);
      const commentId = db.query("SELECT last_insert_rowid() as id").get() as { id: number };
      const req = new Request(`http://localhost/api/v1/comments/${commentId.id}`);
      const res = handleCommentGet(req, db, commentId.id);
      expect(res.status).toBe(200);
    });
  });

  describe("Search Route", () => {
    it("should search media", async () => {
      const db = getDb();
      const ct = db.query("SELECT id FROM content_types WHERE slug = 'movie'").get() as { id: number };
      db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Test Movie')", [ct.id, uniqueSlug("search")]);
      const req = new Request("http://localhost/api/v1/search?q=Test&type=media");
      const res = handleSearch(req, db);
      expect(res.status).toBe(200);
    });

    it("should reject short search queries", async () => {
      const db = getDb();
      const req = new Request("http://localhost/api/v1/search?q=a");
      const res = handleSearch(req, db);
      expect(res.status).toBe(400);
    });
  });

  describe("Collections Routes", () => {
    it("should list collections", async () => {
      const db = getDb();
      db.run("INSERT INTO collections (slug) VALUES (?)", [uniqueSlug("col")]);
      const req = new Request("http://localhost/api/v1/collections");
      const res = handleCollectionsList(req, db);
      expect(res.status).toBe(200);
    });
  });

  describe("Genres Routes", () => {
    it("should list genres", async () => {
      const db = getDb();
      db.run("INSERT INTO genres (slug) VALUES ('action')");
      const req = new Request("http://localhost/api/v1/genres");
      const res = handleGenresList(req, db);
      expect(res.status).toBe(200);
    });

    it("should get genre media", async () => {
      const db = getDb();
      const ct = db.query("SELECT id FROM content_types WHERE slug = 'movie'").get() as { id: number };
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Test')", [ct.id, uniqueSlug("genre")]);
      db.run("INSERT INTO genres (slug) VALUES ('action')");
      const g = db.query("SELECT id FROM genres WHERE slug = 'action'").get() as { id: number };
      db.run("INSERT INTO media_genres (media_id, genre_id) VALUES (?, ?)", [mResult.lastInsertRowid, g.id]);
      const req = new Request("http://localhost/api/v1/genres/action");
      const res = handleGenreMedia(req, db, "action");
      expect(res.status).toBe(200);
    });
  });

  describe("Media Extended Routes", () => {
    it("should get media seasons", async () => {
      const db = getDb();
      const ct = db.query("SELECT id FROM content_types WHERE slug = 'series'").get() as { id: number };
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Test')", [ct.id, uniqueSlug("mseason")]);
      db.run("INSERT INTO seasons (media_id, season_number) VALUES (?, 1)", [mResult.lastInsertRowid]);
      const req = new Request(`http://localhost/api/v1/media/${mResult.lastInsertRowid}/seasons`);
      const res = handleMediaSeasons(req, db, Number(mResult.lastInsertRowid));
      expect(res.status).toBe(200);
    });

    it("should get media episodes", async () => {
      const db = getDb();
      const ct = db.query("SELECT id FROM content_types WHERE slug = 'movie'").get() as { id: number };
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Test')", [ct.id, uniqueSlug("mep")]);
      const req = new Request(`http://localhost/api/v1/media/${mResult.lastInsertRowid}/episodes`);
      const res = handleMediaEpisodes(req, db, Number(mResult.lastInsertRowid));
      expect(res.status).toBe(200);
    });

    it("should get media credits", async () => {
      const db = getDb();
      const ct = db.query("SELECT id FROM content_types WHERE slug = 'movie'").get() as { id: number };
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Test')", [ct.id, uniqueSlug("mcredit")]);
      const pResult = db.run("INSERT INTO people (name) VALUES ('Actor')");
      db.run("INSERT INTO credits (media_id, person_id, credit_type, role_name) VALUES (?, ?, 'cast', 'Hero')", [mResult.lastInsertRowid, pResult.lastInsertRowid]);
      const req = new Request(`http://localhost/api/v1/media/${mResult.lastInsertRowid}/credits`);
      const res = handleMediaCredits(req, db, Number(mResult.lastInsertRowid));
      expect(res.status).toBe(200);
    });

    it("should get media videos", async () => {
      const db = getDb();
      const ct = db.query("SELECT id FROM content_types WHERE slug = 'movie'").get() as { id: number };
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Test')", [ct.id, uniqueSlug("mvideo")]);
      db.run("INSERT INTO videos (media_id, video_type, name, site, key) VALUES (?, 'trailer', 'Trailer', 'youtube', 'abc123')", [mResult.lastInsertRowid]);
      const req = new Request(`http://localhost/api/v1/media/${mResult.lastInsertRowid}/videos`);
      const res = handleMediaVideos(req, db, Number(mResult.lastInsertRowid));
      expect(res.status).toBe(200);
    });

    it("should get media related", async () => {
      const db = getDb();
      const ct = db.query("SELECT id FROM content_types WHERE slug = 'movie'").get() as { id: number };
      const m1 = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, 'movie-1', 'Movie 1')", [ct.id]);
      const m2 = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, 'movie-2', 'Movie 2')", [ct.id]);
      db.run("INSERT INTO media_relations (source_media_id, related_media_id, relation_type) VALUES (?, ?, 'sequel')", [m1.lastInsertRowid, m2.lastInsertRowid]);
      const req = new Request(`http://localhost/api/v1/media/${m1.lastInsertRowid}/related`);
      const res = handleMediaRelated(req, db, Number(m1.lastInsertRowid));
      expect(res.status).toBe(200);
    });

    it("should get media images", async () => {
      const db = getDb();
      const ct = db.query("SELECT id FROM content_types WHERE slug = 'movie'").get() as { id: number };
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Test')", [ct.id, uniqueSlug("mimage")]);
      db.run("INSERT INTO images (entity_type, entity_id, image_type, url, is_primary) VALUES ('media', ?, 'poster', 'http://img.com/poster.jpg', 1)", [mResult.lastInsertRowid]);
      const req = new Request(`http://localhost/api/v1/media/${mResult.lastInsertRowid}/images`);
      const res = handleMediaImages(req, db, Number(mResult.lastInsertRowid));
      expect(res.status).toBe(200);
    });
  });
});

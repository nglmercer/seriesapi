import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { getDb, enableInMemoryDatabase, initializeDatabase, closeDatabase } from "../../src/init";
import { handleMediaList, handleMediaDetail, handleMediaSeasons, handleMediaEpisodes, handleMediaCredits, handleMediaVideos, handleMediaRelated, handleMediaImages, handleMediaComments } from "../../src/api/routes/media";
import { uniqueSlug, getContentTypeId } from "../setup";

describe("Media Routes", () => {
  beforeAll(async () => {
    enableInMemoryDatabase();
    await initializeDatabase();
    const db = getDb();
    db.run("INSERT OR IGNORE INTO languages (code, name) VALUES ('en', 'English'), ('es', 'Spanish')");
    db.run("INSERT OR IGNORE INTO content_types (slug, label) VALUES ('movie', 'Movie'), ('series', 'Series'), ('anime', 'Anime')");
  });

  beforeEach(() => {
    const db = getDb();
    const safeDelete = (t: string) => { try { db.run("DELETE FROM " + t); } catch {} };
    safeDelete("media"); safeDelete("media_translations"); safeDelete("images");
    safeDelete("seasons"); safeDelete("season_translations"); safeDelete("episodes");
    safeDelete("episode_translations"); safeDelete("credits"); safeDelete("videos");
    safeDelete("media_relations"); safeDelete("comments");
  });

  afterAll(() => { closeDatabase(); });

  describe("handleMediaList", () => {
    it("should list media with pagination", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "movie");
      db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Test')", [ct, uniqueSlug("list")]);

      const req = new Request("http://localhost/api/v1/media");
      const res = handleMediaList(req, db);
      expect(res.status).toBe(200);
      const body = await res.json() as { ok: boolean; data: unknown[]; meta: { total: number } };
      expect(body.ok).toBe(true);
      expect(body.meta.total).toBeGreaterThan(0);
    });

    it("should filter by content type", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "movie");
      db.run("INSERT INTO media (content_type_id, slug, original_title, status) VALUES (?, ?, 'Movie', 'completed')", [ct, uniqueSlug("type")]);
      db.run("INSERT INTO media (content_type_id, slug, original_title, status) VALUES (?, ?, 'Series', 'completed')", [getContentTypeId(db, "series"), uniqueSlug("type2")]);

      const req = new Request("http://localhost/api/v1/media?type=movie");
      const res = handleMediaList(req, db);
      const body = await res.json() as { data: unknown[] };
      expect(body.data.length).toBe(1);
    });

    it("should filter by status", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "movie");
      db.run("INSERT INTO media (content_type_id, slug, original_title, status) VALUES (?, ?, 'Movie 1', 'completed')", [ct, uniqueSlug("status1")]);
      db.run("INSERT INTO media (content_type_id, slug, original_title, status) VALUES (?, ?, 'Movie 2', 'ongoing')", [ct, uniqueSlug("status2")]);

      const req = new Request("http://localhost/api/v1/media?status=completed");
      const res = handleMediaList(req, db);
      const body = await res.json() as { data: unknown[] };
      expect(body.data.length).toBe(1);
    });

    it("should filter by search query", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "movie");
      db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'The Matrix')", [ct, uniqueSlug("search")]);
      db.run("INSERT INTO media_translations (media_id, locale, title) VALUES (last_insert_rowid(), 'en', 'Matrix')");

      const req = new Request("http://localhost/api/v1/media?q=Matrix");
      const res = handleMediaList(req, db);
      expect(res.status).toBe(200);
    });

    it("should sort by different fields", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "movie");
      db.run("INSERT INTO media (content_type_id, slug, original_title, score, release_date) VALUES (?, ?, 'Movie A', 9.0, '2023-01-01')", [ct, uniqueSlug("sort")]);
      db.run("INSERT INTO media (content_type_id, slug, original_title, score, release_date) VALUES (?, ?, 'Movie B', 7.0, '2023-06-01')", [ct, uniqueSlug("sort2")]);

      const req = new Request("http://localhost/api/v1/media?sort_by=score&order=desc");
      const res = handleMediaList(req, db);
      const body = await res.json() as { data: { score: number }[] };
      expect(body.data[0]!.score).toBe(9);
    });
  });

  describe("handleMediaDetail", () => {
    it("should return media details", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "movie");
      const result = db.run("INSERT INTO media (content_type_id, slug, original_title, score) VALUES (?, ?, 'Test Movie', 8.5)", [ct, uniqueSlug("detail")]);

      const req = new Request(`http://localhost/api/v1/media/${result.lastInsertRowid}`);
      const res = handleMediaDetail(req, db, Number(result.lastInsertRowid));
      expect(res.status).toBe(200);
      const body = await res.json() as { data: { original_title: string; score: number } };
      expect(body.data.original_title).toBe("Test Movie");
      expect(body.data.score).toBe(8.5);
    });

    it("should include translations", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "movie");
      const result = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Original')", [ct, uniqueSlug("detail2")]);
      db.run("INSERT INTO media_translations (media_id, locale, title, tagline, synopsis) VALUES (?, 'en', 'English Title', 'Tagline', 'Synopsis')", [result.lastInsertRowid]);

      const req = new Request(`http://localhost/api/v1/media/${result.lastInsertRowid}`);
      const res = handleMediaDetail(req, db, Number(result.lastInsertRowid));
      const body = await res.json() as { data: { title: string; tagline: string } };
      expect(body.data.title).toBe("English Title");
    });

    it("should include related data (genres, tags, studios, networks)", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "movie");
      const result = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Test')", [ct, uniqueSlug("detail3")]);
      
      db.run("INSERT INTO genres (slug) VALUES ('action')");
      const genre = db.query("SELECT id FROM genres WHERE slug = 'action'").get() as { id: number };
      db.run("INSERT INTO media_genres (media_id, genre_id) VALUES (?, ?)", [result.lastInsertRowid, genre.id]);

      const req = new Request(`http://localhost/api/v1/media/${result.lastInsertRowid}`);
      const res = handleMediaDetail(req, db, Number(result.lastInsertRowid));
      const body = await res.json() as { data: { genres: unknown[] } };
      expect(body.data.genres.length).toBe(1);
    });

    it("should return 404 for non-existent media", async () => {
      const db = getDb();
      const req = new Request("http://localhost/api/v1/media/99999");
      const res = handleMediaDetail(req, db, 99999);
      expect(res.status).toBe(404);
    });
  });

  describe("handleMediaSeasons", () => {
    it("should return seasons for series", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "series");
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Test Series')", [ct, uniqueSlug("season")]);
      db.run("INSERT INTO seasons (media_id, season_number, episode_count, score) VALUES (?, 1, 12, 8.5)", [mResult.lastInsertRowid]);

      const req = new Request(`http://localhost/api/v1/media/${mResult.lastInsertRowid}/seasons`);
      const res = handleMediaSeasons(req, db, Number(mResult.lastInsertRowid));
      expect(res.status).toBe(200);
    });

    it("should return 404 when no seasons exist", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "movie");
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Movie')", [ct, uniqueSlug("noseason")]);

      const req = new Request(`http://localhost/api/v1/media/${mResult.lastInsertRowid}/seasons`);
      const res = handleMediaSeasons(req, db, Number(mResult.lastInsertRowid));
      expect(res.status).toBe(404);
    });
  });

  describe("handleMediaEpisodes", () => {
    it("should return episodes for media", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "series");
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Test Series')", [ct, uniqueSlug("ep")]);
      const sResult = db.run("INSERT INTO seasons (media_id, season_number) VALUES (?, 1)", [mResult.lastInsertRowid]);
      db.run("INSERT INTO episodes (media_id, season_id, episode_number, runtime_minutes, score) VALUES (?, ?, 1, 24, 8.0)", [mResult.lastInsertRowid, sResult.lastInsertRowid]);

      const req = new Request(`http://localhost/api/v1/media/${mResult.lastInsertRowid}/episodes`);
      const res = handleMediaEpisodes(req, db, Number(mResult.lastInsertRowid));
      expect(res.status).toBe(200);
    });

    it("should filter episodes by season", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "series");
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Test')", [ct, uniqueSlug("epseason")]);
      const s1 = db.run("INSERT INTO seasons (media_id, season_number) VALUES (?, 1)", [mResult.lastInsertRowid]);
      const s2 = db.run("INSERT INTO seasons (media_id, season_number) VALUES (?, 2)", [mResult.lastInsertRowid]);
      db.run("INSERT INTO episodes (media_id, season_id, episode_number) VALUES (?, ?, 1)", [mResult.lastInsertRowid, s1.lastInsertRowid]);
      db.run("INSERT INTO episodes (media_id, season_id, episode_number) VALUES (?, ?, 1)", [mResult.lastInsertRowid, s2.lastInsertRowid]);

      const req = new Request(`http://localhost/api/v1/media/${mResult.lastInsertRowid}/episodes?season=1`);
      const res = handleMediaEpisodes(req, db, Number(mResult.lastInsertRowid));
      const body = await res.json() as { data: { season_number: number }[] };
      expect(body.data.every(e => e.season_number === 1)).toBe(true);
    });
  });

  describe("handleMediaCredits", () => {
    it("should return cast and crew", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "movie");
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Test')", [ct, uniqueSlug("credits")]);
      const p1 = db.run("INSERT INTO people (name) VALUES ('Actor')");
      const p2 = db.run("INSERT INTO people (name) VALUES ('Director')");
      db.run("INSERT INTO credits (media_id, person_id, credit_type, role_name, department, job) VALUES (?, ?, 'cast', 'Hero', NULL, NULL)", [mResult.lastInsertRowid, p1.lastInsertRowid]);
      db.run("INSERT INTO credits (media_id, person_id, credit_type, role_name, department, job) VALUES (?, ?, 'crew', 'Director', 'Directing', 'Director')", [mResult.lastInsertRowid, p2.lastInsertRowid]);

      const req = new Request(`http://localhost/api/v1/media/${mResult.lastInsertRowid}/credits`);
      const res = handleMediaCredits(req, db, Number(mResult.lastInsertRowid));
      expect(res.status).toBe(200);
      const body = await res.json() as { data: { cast: unknown[]; crew: unknown[] } };
      expect(body.data.cast.length).toBe(1);
      expect(body.data.crew.length).toBe(1);
    });
  });

  describe("handleMediaVideos", () => {
    it("should return videos for media", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "movie");
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Test')", [ct, uniqueSlug("videos")]);
      db.run("INSERT INTO videos (media_id, video_type, name, site, key, official) VALUES (?, 'trailer', 'Trailer', 'youtube', 'abc123', 1)", [mResult.lastInsertRowid]);

      const req = new Request(`http://localhost/api/v1/media/${mResult.lastInsertRowid}/videos`);
      const res = handleMediaVideos(req, db, Number(mResult.lastInsertRowid));
      const body = await res.json() as { data: { video_type: string }[] };
      expect(body.data[0]!.video_type).toBe("trailer");
    });
  });

  describe("handleMediaRelated", () => {
    it("should return related media", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "movie");
      const m1 = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, 'movie-1', 'Movie 1')", [ct]);
      const m2 = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, 'movie-2', 'Movie 2')", [ct]);
      db.run("INSERT INTO media_relations (source_media_id, related_media_id, relation_type) VALUES (?, ?, 'sequel')", [m1.lastInsertRowid, m2.lastInsertRowid]);

      const req = new Request(`http://localhost/api/v1/media/${m1.lastInsertRowid}/related`);
      const res = handleMediaRelated(req, db, Number(m1.lastInsertRowid));
      const body = await res.json() as { data: { relation_type: string }[] };
      expect(body.data[0]!.relation_type).toBe("sequel");
    });
  });

  describe("handleMediaImages", () => {
    it("should return images for media", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "movie");
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Test')", [ct, uniqueSlug("images")]);
      db.run("INSERT INTO images (entity_type, entity_id, image_type, url, is_primary, vote_average) VALUES ('media', ?, 'poster', 'http://img.com/poster.jpg', 1, 8.5)", [mResult.lastInsertRowid]);
      db.run("INSERT INTO images (entity_type, entity_id, image_type, url, is_primary, vote_average) VALUES ('media', ?, 'backdrop', 'http://img.com/backdrop.jpg', 0, 7.5)", [mResult.lastInsertRowid]);

      const req = new Request(`http://localhost/api/v1/media/${mResult.lastInsertRowid}/images`);
      const res = handleMediaImages(req, db, Number(mResult.lastInsertRowid));
      const body = await res.json() as { data: { image_type: string }[] };
      expect(body.data.length).toBe(2);
    });

    it("should filter images by type", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "movie");
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Test')", [ct, uniqueSlug("imgtype")]);
      db.run("INSERT INTO images (entity_type, entity_id, image_type, url) VALUES ('media', ?, 'poster', 'http://img.com/poster.jpg')", [mResult.lastInsertRowid]);
      db.run("INSERT INTO images (entity_type, entity_id, image_type, url) VALUES ('media', ?, 'backdrop', 'http://img.com/backdrop.jpg')", [mResult.lastInsertRowid]);

      const req = new Request(`http://localhost/api/v1/media/${mResult.lastInsertRowid}/images?type=poster`);
      const res = handleMediaImages(req, db, Number(mResult.lastInsertRowid));
      const body = await res.json() as { data: { image_type: string }[] };
      expect(body.data.length).toBe(1);
      expect(body.data[0]!.image_type).toBe("poster");
    });
  });

  describe("handleMediaComments", () => {
    it("should return comments for media", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "movie");
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Test')", [ct, uniqueSlug("comments")]);
      db.run("INSERT INTO comments (entity_type, entity_id, display_name, ip_hash, body, likes, is_hidden, parent_id) VALUES ('media', ?, 'User', 'hash', 'Great!', 5, 0, NULL)", [mResult.lastInsertRowid]);

      const req = new Request(`http://localhost/api/v1/media/${mResult.lastInsertRowid}/comments`);
      const res = handleMediaComments(req, db, Number(mResult.lastInsertRowid));
      const body = await res.json() as { data: { display_name: string }[] };
      expect(body.data[0]!.display_name).toBe("User");
    });
  });
});
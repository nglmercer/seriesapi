import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { getDb, enableInMemoryDatabase, initializeDatabase, closeDatabase } from "../../src/init";
import { handleSeasonDetail, handleSeasonEpisodes, handleSeasonImages } from "../../src/api/routes/seasons";
import { uniqueSlug, getContentTypeId } from "../setup";

describe("Seasons Routes", () => {
  beforeAll(async () => {
    enableInMemoryDatabase();
    await initializeDatabase();
    const db = getDb();
    db.run("INSERT OR IGNORE INTO languages (code, name) VALUES ('en', 'English')");
    db.run("INSERT OR IGNORE INTO content_types (slug, label) VALUES ('series', 'Series')");
  });

  beforeEach(() => {
    const db = getDb();
    const safeDelete = (t: string) => { try { db.run("DELETE FROM " + t); } catch {} };
    safeDelete("seasons"); safeDelete("season_translations"); safeDelete("episodes");
    safeDelete("images"); safeDelete("media");
  });

  afterAll(() => { closeDatabase(); });

  describe("handleSeasonDetail", () => {
    it("should return season details", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "series");
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Series')", [ct, uniqueSlug("season")]);
      const sResult = db.run("INSERT INTO seasons (media_id, season_number, episode_count, score, air_date, end_date) VALUES (?, 1, 12, 8.5, '2023-01-01', '2023-03-31')", [mResult.lastInsertRowid]);

      const req = new Request(`http://localhost/api/v1/seasons/${sResult.lastInsertRowid}`);
      const res = handleSeasonDetail(req, db, Number(sResult.lastInsertRowid));
      const body = await res.json() as { data: { season_number: number; episode_count: number } };
      expect(body.data.season_number).toBe(1);
      expect(body.data.episode_count).toBe(12);
    });

    it("should include translation", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "series");
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Series')", [ct, uniqueSlug("seasont")]);
      const sResult = db.run("INSERT INTO seasons (media_id, season_number) VALUES (?, 1)", [mResult.lastInsertRowid]);
      db.run("INSERT INTO season_translations (season_id, locale, name, synopsis) VALUES (?, 'en', 'Season One', 'First season')", [sResult.lastInsertRowid]);

      const req = new Request(`http://localhost/api/v1/seasons/${sResult.lastInsertRowid}`);
      const res = handleSeasonDetail(req, db, Number(sResult.lastInsertRowid));
      const body = await res.json() as { data: { name: string } };
      expect(body.data.name).toBe("Season One");
    });

    it("should return 404 for non-existent season", async () => {
      const db = getDb();
      const req = new Request("http://localhost/api/v1/seasons/999");
      const res = handleSeasonDetail(req, db, 999);
      expect(res.status).toBe(404);
    });
  });

  describe("handleSeasonEpisodes", () => {
    it("should return episodes for season", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "series");
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Series')", [ct, uniqueSlug("seasonep")]);
      const sResult = db.run("INSERT INTO seasons (media_id, season_number) VALUES (?, 1)", [mResult.lastInsertRowid]);
      db.run("INSERT INTO episodes (media_id, season_id, episode_number, absolute_number, runtime_minutes, score) VALUES (?, ?, 1, 1, 24, 8.0)", [mResult.lastInsertRowid, sResult.lastInsertRowid]);
      db.run("INSERT INTO episodes (media_id, season_id, episode_number, absolute_number, runtime_minutes, score) VALUES (?, ?, 2, 2, 24, 8.5)", [mResult.lastInsertRowid, sResult.lastInsertRowid]);

      const req = new Request(`http://localhost/api/v1/seasons/${sResult.lastInsertRowid}/episodes`);
      const res = handleSeasonEpisodes(req, db, Number(sResult.lastInsertRowid));
      const body = await res.json() as { data: unknown[] };
      expect(body.data.length).toBe(2);
    });

    it("should support pagination", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "series");
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Series')", [ct, uniqueSlug("seasonep2")]);
      const sResult = db.run("INSERT INTO seasons (media_id, season_number) VALUES (?, 1)", [mResult.lastInsertRowid]);
      for (let i = 1; i <= 25; i++) db.run("INSERT INTO episodes (media_id, season_id, episode_number) VALUES (?, ?, ?)", [mResult.lastInsertRowid, sResult.lastInsertRowid, i]);

      const req = new Request(`http://localhost/api/v1/seasons/${sResult.lastInsertRowid}/episodes?page=1&limit=10`);
      const res = handleSeasonEpisodes(req, db, Number(sResult.lastInsertRowid));
      const body = await res.json() as { data: unknown[]; meta: { total: number } };
      expect(body.data.length).toBe(10);
      expect(body.meta.total).toBe(25);
    });
  });

  describe("handleSeasonImages", () => {
    it("should return images for season", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "series");
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Series')", [ct, uniqueSlug("seasonimg")]);
      const sResult = db.run("INSERT INTO seasons (media_id, season_number) VALUES (?, 1)", [mResult.lastInsertRowid]);
      db.run("INSERT INTO images (entity_type, entity_id, image_type, url, is_primary) VALUES ('season', ?, 'poster', 'http://img.com/poster.jpg', 1)", [sResult.lastInsertRowid]);

      const req = new Request(`http://localhost/api/v1/seasons/${sResult.lastInsertRowid}/images`);
      const res = handleSeasonImages(req, db, Number(sResult.lastInsertRowid));
      const body = await res.json() as { data: { image_type: string }[] };
      expect(body.data[0].image_type).toBe("poster");
    });
  });
});
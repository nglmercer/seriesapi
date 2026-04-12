import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { getDb, enableInMemoryDatabase, initializeDatabase, closeDatabase } from "../../src/init";
import { handleEpisodeDetail, handleEpisodeCredits, handleEpisodeImages, handleEpisodeComments } from "../../src/api/routes/episodes";
import { uniqueSlug, getContentTypeId } from "../setup";
import { ApiContext } from "../../src/api/context";

describe("Episodes Routes", () => {
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
    safeDelete("episodes"); safeDelete("episode_translations"); safeDelete("episode_credits");
    safeDelete("images"); safeDelete("comments"); safeDelete("seasons"); safeDelete("media");
  });

  afterAll(() => { closeDatabase(); });

  describe("handleEpisodeDetail", () => {
    it("should return episode details", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "series");
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Series')", [ct, uniqueSlug("ep")]);
      const sResult = db.run("INSERT INTO seasons (media_id, season_number) VALUES (?, 1)", [mResult.lastInsertRowid]);
      const eResult = db.run("INSERT INTO episodes (media_id, season_id, episode_number, absolute_number, runtime_minutes, score, score_count, air_date, episode_type) VALUES (?, ?, 1, 1, 24, 8.5, 100, '2023-01-01', 'regular')", [mResult.lastInsertRowid, sResult.lastInsertRowid]);

      const req = new Request(`http://localhost/api/v1/episodes/${eResult.lastInsertRowid}`);
      const res = handleEpisodeDetail(ApiContext.from(req), Number(eResult.lastInsertRowid));
      const body = await res.json() as { data: { episode_number: number; runtime_minutes: number } };
      expect(body.data.episode_number).toBe(1);
      expect(body.data.runtime_minutes).toBe(24);
    });

    it("should include translation", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "series");
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Series')", [ct, uniqueSlug("ept")]);
      const sResult = db.run("INSERT INTO seasons (media_id, season_number) VALUES (?, 1)", [mResult.lastInsertRowid]);
      const eResult = db.run("INSERT INTO episodes (media_id, season_id, episode_number) VALUES (?, ?, 1)", [mResult.lastInsertRowid, sResult.lastInsertRowid]);
      db.run("INSERT INTO episode_translations (episode_id, locale, title, synopsis) VALUES (?, 'en', 'Episode Title', 'Synopsis')", [eResult.lastInsertRowid]);

      const req = new Request(`http://localhost/api/v1/episodes/${eResult.lastInsertRowid}`);
      const res = handleEpisodeDetail(ApiContext.from(req), Number(eResult.lastInsertRowid));
      const body = await res.json() as { data: { title: string } };
      expect(body.data.title).toBe("Episode Title");
    });

    it("should return 404 for non-existent episode", async () => {
      const db = getDb();
      const req = new Request("http://localhost/api/v1/episodes/999");
      const res = handleEpisodeDetail(ApiContext.from(req), 999);
      expect(res.status).toBe(404);
    });
  });

  describe("handleEpisodeCredits", () => {
    it("should return episode credits", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "series");
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Series')", [ct, uniqueSlug("epcredit")]);
      const sResult = db.run("INSERT INTO seasons (media_id, season_number) VALUES (?, 1)", [mResult.lastInsertRowid]);
      const eResult = db.run("INSERT INTO episodes (media_id, season_id, episode_number) VALUES (?, ?, 1)", [mResult.lastInsertRowid, sResult.lastInsertRowid]);
      const pResult = db.run("INSERT INTO people (name) VALUES ('Guest Star')");
      db.run("INSERT INTO episode_credits (episode_id, person_id, credit_type, role_name) VALUES (?, ?, 'cast', 'Guest')", [eResult.lastInsertRowid, pResult.lastInsertRowid]);

      const req = new Request(`http://localhost/api/v1/episodes/${eResult.lastInsertRowid}/credits`);
      const res = handleEpisodeCredits(ApiContext.from(req), Number(eResult.lastInsertRowid));
      const body = await res.json() as { data: { credit_type: string }[] };
      expect(body.data[0]!.credit_type).toBe("cast");
    });
  });

  describe("handleEpisodeImages", () => {
    it("should return images for episode", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "series");
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Series')", [ct, uniqueSlug("epimg")]);
      const sResult = db.run("INSERT INTO seasons (media_id, season_number) VALUES (?, 1)", [mResult.lastInsertRowid]);
      const eResult = db.run("INSERT INTO episodes (media_id, season_id, episode_number) VALUES (?, ?, 1)", [mResult.lastInsertRowid, sResult.lastInsertRowid]);
      db.run("INSERT INTO images (entity_type, entity_id, image_type, url, is_primary) VALUES ('episode', ?, 'still', 'http://img.com/still.jpg', 1)", [eResult.lastInsertRowid]);

      const req = new Request(`http://localhost/api/v1/episodes/${eResult.lastInsertRowid}/images`);
      const res = handleEpisodeImages(ApiContext.from(req), Number(eResult.lastInsertRowid));
      const body = await res.json() as { data: { image_type: string }[] };
      expect(body.data[0]!.image_type).toBe("still");
    });
  });

  describe("handleEpisodeComments", () => {
    it("should return comments for episode", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "series");
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Series')", [ct, uniqueSlug("epcomment")]);
      const sResult = db.run("INSERT INTO seasons (media_id, season_number) VALUES (?, 1)", [mResult.lastInsertRowid]);
      const eResult = db.run("INSERT INTO episodes (media_id, season_id, episode_number) VALUES (?, ?, 1)", [mResult.lastInsertRowid, sResult.lastInsertRowid]);
      db.run("INSERT INTO comments (entity_type, entity_id, display_name, ip_hash, body, likes, is_hidden, parent_id) VALUES ('episode', ?, 'User', 'hash', 'Great episode!', 5, 0, NULL)", [eResult.lastInsertRowid]);

      const req = new Request(`http://localhost/api/v1/episodes/${eResult.lastInsertRowid}/comments`);
      const res = handleEpisodeComments(ApiContext.from(req), Number(eResult.lastInsertRowid));
      const body = await res.json() as { data: { display_name: string }[] };
      expect(body.data[0]!.display_name).toBe("User");
    });
  });
});
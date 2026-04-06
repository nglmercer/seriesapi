import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { getDb, enableInMemoryDatabase, initializeDatabase, closeDatabase } from "../../src/init";
import { handleSearch } from "../../src/api/routes/search";
import { uniqueSlug, getContentTypeId } from "../setup";

describe("Search Route", () => {
  beforeAll(async () => {
    enableInMemoryDatabase();
    await initializeDatabase();
    const db = getDb();
    db.run("INSERT OR IGNORE INTO languages (code, name) VALUES ('en', 'English'), ('es', 'Spanish')");
    db.run("INSERT OR IGNORE INTO content_types (slug, label) VALUES ('movie', 'Movie'), ('series', 'Series')");
  });

  beforeEach(() => {
    const db = getDb();
    const safeDelete = (t: string) => { try { db.run("DELETE FROM " + t); } catch {} };
    safeDelete("media"); safeDelete("media_translations"); safeDelete("people");
    safeDelete("people_translations"); safeDelete("collections");
    safeDelete("collection_translations"); safeDelete("images");
  });

  afterAll(() => { closeDatabase(); });

  describe("handleSearch", () => {
    it("should search media by title", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "movie");
      db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'The Matrix')", [ct, uniqueSlug("search")]);

      const req = new Request("http://localhost/api/v1/search?q=Matrix&type=media");
      const res = handleSearch(req, db);
      const body = await res.json() as { data: { entity_type: string }[] };
      expect(body.data.length).toBeGreaterThan(0);
      expect(body.data[0].entity_type).toBe("media");
    });

    it("should search people by name", async () => {
      const db = getDb();
      db.run("INSERT INTO people (name) VALUES ('Keanu Reeves')");
      db.run("INSERT INTO people (name) VALUES ('Tom Cruise')");

      const req = new Request("http://localhost/api/v1/search?q=Keanu&type=person");
      const res = handleSearch(req, db);
      const body = await res.json() as { data: { entity_type: string }[] };
      expect(body.data[0].entity_type).toBe("person");
    });

    it("should search all types when no type specified", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "movie");
      db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Movie')", [ct, uniqueSlug("searchall")]);
      db.run("INSERT INTO people (name) VALUES ('Actor')");

      const req = new Request("http://localhost/api/v1/search?q=Movie");
      const res = handleSearch(req, db);
      expect(res.status).toBe(200);
    });

    it("should reject short search queries", async () => {
      const db = getDb();
      const req = new Request("http://localhost/api/v1/search?q=a");
      const res = handleSearch(req, db);
      expect(res.status).toBe(400);
    });

    it("should handle empty results", async () => {
      const db = getDb();
      const req = new Request("http://localhost/api/v1/search?q=nonexistent");
      const res = handleSearch(req, db);
      const body = await res.json() as { data: unknown[]; meta: { total: number } };
      expect(body.data.length).toBe(0);
      expect(body.meta.total).toBe(0);
    });

    it("should include translation in results", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "movie");
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Original')", [ct, uniqueSlug("searchtr")]);
      db.run("INSERT INTO media_translations (media_id, locale, title) VALUES (?, 'en', 'Translated')", [mResult.lastInsertRowid]);

      const req = new Request("http://localhost/api/v1/search?q=Translated&type=media");
      const res = handleSearch(req, db);
      const body = await res.json() as { data: { title: string }[] };
      expect(body.data[0].title).toBe("Translated");
    });
  });
});
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { getDb, enableInMemoryDatabase, initializeDatabase, closeDatabase } from "../../src/init";
import { handlePeopleList, handlePersonDetail, handlePersonCredits } from "../../src/api/routes/people";
import { uniqueSlug, getContentTypeId } from "../setup";
import { ApiContext } from "../../src/api/context";

describe("People Routes", () => {
  beforeAll(async () => {
    enableInMemoryDatabase();
    await initializeDatabase();
    const db = getDb();
    db.run("INSERT OR IGNORE INTO languages (code, name) VALUES ('en', 'English')");
    db.run("INSERT OR IGNORE INTO content_types (slug, label) VALUES ('movie', 'Movie')");
  });

  beforeEach(() => {
    const db = getDb();
    const safeDelete = (t: string) => { try { db.run("DELETE FROM " + t); } catch {} };
    safeDelete("people"); safeDelete("people_translations"); safeDelete("credits");
  });

  afterAll(() => { closeDatabase(); });

  describe("handlePeopleList", () => {
    it("should list all people", async () => {
      const db = getDb();
      db.run("INSERT INTO people (name, gender) VALUES ('John Doe', 'male')");
      db.run("INSERT INTO people (name, gender) VALUES ('Jane Doe', 'female')");

      const req = new Request("http://localhost/api/v1/people");
      const res = handlePeopleList(ApiContext.from(req));
      expect(res.status).toBe(200);
      const body = await res.json() as { data: unknown[] };
      expect(body.data.length).toBe(2);
    });

    it("should search people by name", async () => {
      const db = getDb();
      db.run("INSERT INTO people (name) VALUES ('John Actor')");
      db.run("INSERT INTO people (name) VALUES ('Jane Director')");

      const req = new Request("http://localhost/api/v1/people?q=John");
      const res = handlePeopleList(ApiContext.from(req));
      const body = await res.json() as { data: { name: string }[] };
      expect(body.data.length).toBe(1);
      expect(body.data[0]!.name).toBe("John Actor");
    });

    it("should support pagination", async () => {
      const db = getDb();
      for (let i = 0; i < 25; i++) db.run("INSERT INTO people (name) VALUES (?)", ["Person " + i]);

      const req = new Request("http://localhost/api/v1/people?page=1&limit=10");
      const res = handlePeopleList(ApiContext.from(req));
      const body = await res.json() as { data: unknown[]; meta: { total: number } };
      expect(body.data.length).toBe(10);
      expect(body.meta.total).toBe(25);
    });
  });

  describe("handlePersonDetail", () => {
    it("should return person details", async () => {
      const db = getDb();
      const result = db.run("INSERT INTO people (name, birth_date, birth_country, gender) VALUES ('John Actor', '1980-01-01', 'US', 'male')");

      const req = new Request(`http://localhost/api/v1/people/${result.lastInsertRowid}`);
      const res = handlePersonDetail(ApiContext.from(req), Number(result.lastInsertRowid));
      const body = await res.json() as { data: { name: string; birth_date: string } };
      expect(body.data.name).toBe("John Actor");
      expect(body.data.birth_date).toBe("1980-01-01");
    });

    it("should include translation", async () => {
      const db = getDb();
      const result = db.run("INSERT INTO people (name) VALUES ('Original Name')");
      db.run("INSERT INTO people_translations (person_id, locale, name, biography) VALUES (?, 'en', 'Translated Name', 'Bio')", [result.lastInsertRowid]);

      const req = new Request(`http://localhost/api/v1/people/${result.lastInsertRowid}`);
      const res = handlePersonDetail(ApiContext.from(req), Number(result.lastInsertRowid));
      const body = await res.json() as { data: { name: string } };
      expect(body.data.name).toBe("Translated Name");
    });

    it("should return 404 for non-existent person", async () => {
      const db = getDb();
      const req = new Request("http://localhost/api/v1/people/999");
      const res = handlePersonDetail(ApiContext.from(req), 999);
      expect(res.status).toBe(404);
    });
  });

  describe("handlePersonCredits", () => {
    it("should return media credits for person", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "movie");
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Movie')", [ct, uniqueSlug("personcredit")]);
      const pResult = db.run("INSERT INTO people (name) VALUES ('Actor')");
      db.run("INSERT INTO credits (media_id, person_id, credit_type, role_name, department, job, \"order\") VALUES (?, ?, 'cast', 'Hero', 'Acting', 'Actor', 1)", [mResult.lastInsertRowid, pResult.lastInsertRowid]);

      const req = new Request(`http://localhost/api/v1/people/${pResult.lastInsertRowid}/credits`);
      const res = handlePersonCredits(ApiContext.from(req), Number(pResult.lastInsertRowid));
      const body = await res.json() as { data: { credit_type: string }[] };
      expect(body.data[0]!.credit_type).toBe("cast");
    });

    it("should return crew credits", async () => {
      const db = getDb();
      const ct = getContentTypeId(db, "movie");
      const mResult = db.run("INSERT INTO media (content_type_id, slug, original_title) VALUES (?, ?, 'Movie')", [ct, uniqueSlug("crewcredit")]);
      const pResult = db.run("INSERT INTO people (name) VALUES ('Director')");
      db.run("INSERT INTO credits (media_id, person_id, credit_type, role_name, department, job, \"order\") VALUES (?, ?, 'crew', 'Director', 'Directing', 'Director', 1)", [mResult.lastInsertRowid, pResult.lastInsertRowid]);

      const req = new Request(`http://localhost/api/v1/people/${pResult.lastInsertRowid}/credits`);
      const res = handlePersonCredits(ApiContext.from(req), Number(pResult.lastInsertRowid));
      const body = await res.json() as { data: { department: string }[] };
      expect(body.data[0]!.department).toBe("Directing");
    });
  });
});
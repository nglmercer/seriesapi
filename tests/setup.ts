import { Database } from "sqlite-napi";
import { enableInMemoryDatabase, initializeDatabase, getDb, closeDatabase } from "../src/init";

let _db: Database | null = null;

export async function setupTestDb(): Promise<Database> {
  enableInMemoryDatabase();
  await initializeDatabase();
  _db = getDb();
  
  const db = _db;
  db.run("INSERT OR IGNORE INTO languages (code, name) VALUES ('en', 'English'), ('es', 'Spanish'), ('ja', 'Japanese')");
  db.run("INSERT OR IGNORE INTO content_types (slug, label) VALUES ('movie', 'Movie'), ('series', 'Series'), ('anime', 'Anime')");
  
  return db;
}

export function getTestDb(): Database {
  if (!_db) throw new Error("Database not initialized. Call setupTestDb() first.");
  return _db;
}

export function cleanupTestDb(): void {
  if (_db) {
    try { closeDatabase(); } catch {}
    _db = null;
  }
}

export function resetTestData(): void {
  const db = getTestDb();
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
}

let _slugCounter = 0;
export function uniqueSlug(prefix: string): string {
  _slugCounter++;
  return `${prefix}-${Date.now()}-${_slugCounter}`;
}

export function getContentTypeId(db: Database, slug: string): number {
  const row = db.query("SELECT id FROM content_types WHERE slug = ?").get([slug]) as { id: number } | undefined;
  return row?.id ?? 0;
}

export function getLanguageId(db: Database, code: string): number {
  const row = db.query("SELECT id FROM languages WHERE code = ?").get([code]) as { id: number } | undefined;
  return row?.id ?? 0;
}
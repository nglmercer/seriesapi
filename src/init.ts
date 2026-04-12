import { Database } from "sqlite-napi";
import { sqliteNapi, type SQLiteTable } from "./core/index";
import { ALL_TABLES } from "./schema";
import type { SqliteNapiAdapter } from "./core/driver";

// ─── Config ────────────────────────────────────────────────────────────────
let dbPath = "./anima.db";
let _db: Database | null = null;
let _drizzle: SqliteNapiAdapter | null = null;
let useInMemoryDb = false;

// ─── Internal helpers ───────────────────────────────────────────────────────

function buildDatabase(
  tables: SQLiteTable<Record<string, unknown>>[] = [...ALL_TABLES],
): { database: Database; drizzleAdapter: SqliteNapiAdapter } {
  const database = useInMemoryDb
    ? new Database(":memory:")
    : new Database(dbPath);

  // Enable WAL mode for concurrent reads
  database.pragma("journal_mode", "WAL");
  database.pragma("foreign_keys", 1);

  const drizzleAdapter = sqliteNapi(database);

  for (const table of tables) {
    try {
      const sql = table.getSQL();
      database.runSafe(sql, ["table_already_exists"]);
    } catch {
      // table already exists or other non-fatal error
    }
  }

  return { database, drizzleAdapter };
}

function ensureDatabase() {
  if (!_db || !_drizzle) {
    const { database, drizzleAdapter } = buildDatabase();
    _db = database;
    _drizzle = drizzleAdapter;
  }
  return { db: _db, drizzle: _drizzle };
}

// ─── Public getters ─────────────────────────────────────────────────────────

export function getDb(): Database {
  return ensureDatabase().db;
}

export function getDrizzle(): SqliteNapiAdapter {
  return ensureDatabase().drizzle;
}

// Proxy-based convenience exports (backward compatible)
export const db = new Proxy({} as Database, {
  get(_t, prop) {
    return getDb()[prop as keyof Database];
  },
});

export const drizzle = new Proxy({} as SqliteNapiAdapter, {
  get(_t, prop) {
    return getDrizzle()[prop as keyof SqliteNapiAdapter];
  },
});

// ─── Lifecycle ───────────────────────────────────────────────────────────────

export async function initializeDatabase(
  tables: SQLiteTable<Record<string, unknown>>[] = [...ALL_TABLES],
): Promise<void> {
  // Close existing connections if they exist to prevent leaks
  if (_db) {
    try { _db.close(); } catch { /* ignore */ }
  }

  const { database, drizzleAdapter } = buildDatabase(tables);
  _db = database;
  _drizzle = drizzleAdapter;
  console.log(`[anima] Database ready — ${ALL_TABLES.length} tables`);
}

export async function resetDatabase(): Promise<void> {
  try {
    closeDatabase();
    
    if (!useInMemoryDb) {
      const fs = await import("fs");
      if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    }
    
    await initializeDatabase();
    console.log("[anima] Database reset");
  } catch (err) {
    console.error("[anima] resetDatabase error:", err);
    throw err;
  }
}

export function closeDatabase(): void {
  if (_db) {
    try { _db.close(); } catch { /* ignore */ }
    _db = null;
    _drizzle = null;
  }
}


// ─── Test helpers ────────────────────────────────────────────────────────────

export function setDbPath(path: string) { dbPath = path; }
export function enableInMemoryDatabase() { useInMemoryDb = true; }
export function disableInMemoryDatabase() { useInMemoryDb = false; }

export function createTestDatabase(
  tables: SQLiteTable<Record<string, unknown>>[] = [...ALL_TABLES],
) {
  const testDb = new Database(":memory:");
  testDb.pragma("foreign_keys", 1);
  const testDrizzle = sqliteNapi(testDb);
  for (const table of tables) {
    try { testDb.run(table.getSQL()); } catch { /* ignore */ }
  }
  return { db: testDb, drizzle: testDrizzle };
}

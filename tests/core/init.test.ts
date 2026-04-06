import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { getDb, getDrizzle, resetDatabase, closeDatabase, createTestDatabase, setDbPath, enableInMemoryDatabase, disableInMemoryDatabase, db as proxyDb, drizzle as proxyDrizzle } from "../../src/init";

describe("Database Init", () => {
  beforeEach(() => {
    closeDatabase();
    enableInMemoryDatabase();
  });

  afterEach(() => {
    closeDatabase();
  });

  it("should initialize database lazily", () => {
    const db = getDb();
    expect(db).toBeDefined();
    
    const drizzle = getDrizzle();
    expect(drizzle).toBeDefined();
  });

  it("should have working proxy db and drizzle", () => {
    // using proxy db should forward to getDb()
    expect(proxyDb.pragma).toBeDefined();
    
    // proxy drizzle
    expect(proxyDrizzle.select).toBeDefined();
  });

  it("should support resetDatabase", async () => {
    const initialDb = getDb();
    expect(initialDb).toBeDefined();
    
    await resetDatabase();
    const newDb = getDb();
    expect(newDb).not.toBe(initialDb); // though they might be functionally same, instances differ
  });

  it("should test resetDatabase for on-disk db conditionally", async () => {
    // This will hit the branch where !useInMemoryDb exists
    setDbPath("./test_reset.db");
    disableInMemoryDatabase();
    
    const initialDb = getDb();
    expect(initialDb).toBeDefined();

    await resetDatabase();
    
    const newDb = getDb();
    expect(newDb).toBeDefined();

    // cleanup
    closeDatabase();
    enableInMemoryDatabase();
    
    // Let's also hit the catch path of resetDatabase by throwing artificially (not easy, but we can cover the rest)
  });

  it("should support createTestDatabase", () => {
    const { db, drizzle } = createTestDatabase();
    expect(db).toBeDefined();
    expect(drizzle).toBeDefined();
    db.close();
  });
});

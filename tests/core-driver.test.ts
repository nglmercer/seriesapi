import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { Database } from "sqlite-napi";
import { sqliteNapi, getTablesSQL, getTableSQL } from "../src/core/driver";
import { sqliteTable } from "../src/core/table";
import { integer, primaryKey, text } from "../src/core/columns";

describe("Core Driver", () => {
  let db: Database;
  let adapter: ReturnType<typeof sqliteNapi>;

  const users = sqliteTable("users", {
    id: primaryKey(integer("id")),
    name: text("name"),
  });

  beforeEach(() => {
    db = new Database(":memory:");
    adapter = sqliteNapi(db);
    db.run(getTableSQL(users));
  });

  afterEach(() => {
    db.close();
  });

  it("should insert data", () => {
    const result = adapter.insert(users).values({ name: "Alice" }).run();
    expect(result.changes).toBe(1);
  });

  it("should select data", () => {
    adapter.insert(users).values({ name: "Alice" }).run();
    adapter.insert(users).values({ name: "Bob" }).run();

    const all = adapter.select(users).all();
    expect(all.length).toBe(2);

    const specific = adapter.select(users).select("name").all();
    expect(specific[0].name).toBeDefined();
    // @ts-expect-error id shouldn't be here
    expect(specific[0].id).toBeUndefined();

    const limitOffset = adapter.select(users).orderBy("id", "desc").limit(1).offset(1).all();
    expect(limitOffset.length).toBe(1);
    expect(limitOffset[0].name).toBe("Alice");
  });

  it("should select single data with get()", () => {
    adapter.insert(users).values({ name: "Alice" }).run();
    const alice = adapter.select(users).where("name = ?", ["Alice"]).get();
    expect(alice).toBeDefined();
    expect(alice?.name).toBe("Alice");
  });

  it("should run select queries", () => {
    const result = adapter.select(users).where("1 = 0").run();
    expect(result).toBeDefined();
  });

  it("should update data", () => {
    adapter.insert(users).values({ name: "Alice" }).run();
    const updateResult = adapter.update(users).set({ name: "Alice 2" }).where("name = ?", ["Alice"]).run();
    expect(updateResult.changes).toBe(1);
    
    // update without where
    adapter.update(users).set({ name: "Everyone" }).run();
    const all = adapter.select(users).all();
    expect(all[0].name).toBe("Everyone");
  });

  it("should delete data", () => {
    adapter.insert(users).values({ name: "Alice" }).run();
    adapter.insert(users).values({ name: "Bob" }).run();
    
    const deleteResult = adapter.delete(users).where("name = ?", ["Alice"]).run();
    expect(deleteResult.changes).toBe(1);

    // delete without where
    const delAll = adapter.delete(users).run();
    expect(delAll.changes).toBe(1);
  });

  it("should execute raw sql", () => {
    const result = adapter.execute("INSERT INTO users (name) VALUES (?)", ["Raw"]);
    expect(result.changes).toBe(1);
  });

  it("should prepare and run queries", () => {
    const query = adapter.query<{id: number, name: string}>("SELECT * FROM users WHERE name = ?");
    
    adapter.insert(users).values({ name: "Prepared" }).run();
    
    const all = query.all(["Prepared"]);
    expect(all.length).toBe(1);

    const get = query.get(["Prepared"]);
    expect(get?.name).toBe("Prepared");

    const delQuery = adapter.query("DELETE FROM users WHERE name = ?");
    const runResult = delQuery.run(["Prepared"]);
    expect(runResult.changes).toBe(1);
  });

  it("should test helpers getTablesSQL", () => {
    const sql = getTablesSQL([users]);
    expect(sql).toContain("CREATE TABLE users");
  });
});

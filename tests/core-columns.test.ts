import { describe, it, expect } from "bun:test";
import {
  integer,
  text,
  real,
  blob,
  boolean,
  numeric,
  primaryKey,
  notNull,
  unique,
  default_,
  references,
  timestamp,
  date,
  varchar,
} from "../src/core/columns";

describe("Core Columns", () => {
  it("should create basic columns", () => {
    expect(integer("id").getSQLType()).toBe("INTEGER");
    expect(text("name").getSQLType()).toBe("TEXT");
    expect(real("price").getSQLType()).toBe("REAL");
    expect(blob("data").getSQLType()).toBe("BLOB");
    expect(boolean("active").getSQLType()).toBe("INTEGER");
    expect(numeric("count").getSQLType()).toBe("NUMERIC");
    expect(varchar("title", 255).getSQLType()).toBe("TEXT");
    expect(date("created").getSQLType()).toBe("TEXT");
    expect(timestamp("updated").getSQLType()).toBe("TEXT");
  });

  it("should generate correct SQL for basic columns", () => {
    expect(integer("id").toSQL()).toBe("id INTEGER");
    expect(text("name").toSQL()).toBe("name TEXT");
  });

  it("should handle modifiers and quote reserved words", () => {
    const col = integer("order");
    expect(col.toSQL()).toBe('"order" INTEGER');

    const pk = primaryKey(integer("id"));
    expect(pk.toSQL()).toBe("id INTEGER PRIMARY KEY AUTOINCREMENT");

    const nn = notNull(text("name"));
    expect(nn.toSQL()).toBe("name TEXT NOT NULL");

    const uq = unique(text("email"));
    expect(uq.toSQL()).toBe("email TEXT UNIQUE");

    const dflt = default_(text("status"), "active");
    expect(dflt.toSQL()).toBe("status TEXT DEFAULT 'active'");

    const dfltNum = default_(integer("count"), 0);
    expect(dfltNum.toSQL()).toBe("count INTEGER DEFAULT 0");

    const strftimeDef = default_(text("created_at"), "CURRENT_TIMESTAMP");
    expect(strftimeDef.toSQL()).toBe("created_at TEXT DEFAULT CURRENT_TIMESTAMP");

    const nullDef = default_(text("null_col"), null);
    expect(nullDef.toSQL()).toBe("null_col TEXT DEFAULT NULL");

    const ref = references(integer("user_id"), { table: "users", column: "id" });
    expect(ref.toSQL()).toBe("user_id INTEGER REFERENCES users(id)");
  });

  it("should handle toString", () => {
    const col = integer("test");
    expect(col.toString()).toBe("test");
  });
});
